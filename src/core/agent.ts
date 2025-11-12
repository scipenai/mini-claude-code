import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_MODEL, WORKDIR } from '../config/environment';
import ora, { Ora } from 'ora';
import { getTools } from '../tools/tools';
import { dispatchTool } from '../tools/dispatcher';
import { logErrorDebug } from '../utils/logger';
import { ui } from '../utils/ui';
import { shouldAutoCompact, executeAutoCompact } from '../utils/context-compression';
import {
    incrementRound,
    checkAndRemind,
    consumePendingContextBlocks,
    initializeReminder
} from './todo-reminder';
import { anthropic } from './anthropic-client';
import { getContext, formatContextForPrompt } from './context';

// ---------- System prompt ----------
function getSystemPrompt(): string {
    const basePrompt = (
        `You are a coding agent operating INSIDE the user's repository at ${WORKDIR}.\n` +
        `Operating System: ${process.platform === 'win32' ? 'Windows' : process.platform === 'darwin' ? 'macOS' : 'Linux'}\n` +
        `Shell: ${process.platform === 'win32' ? 'PowerShell' : 'bash'}\n` +
        "Follow this loop strictly: check skills → plan briefly → use TOOLS to act directly on files/shell → report concise results.\n" +
        "\n" +
        "Skills System:\n" +
        "- Available skills are listed in the <available_skills> XML element in Project Context section below\n" +
        "- BEFORE starting complex tasks, check if a relevant skill exists in <available_skills>\n" +
        "- Each skill in <available_skills> contains a <name>, <description>, and <path> to its SKILL.md file\n" +
        "- To use a skill, read its SKILL.md file using read_file tool with the <path> from the skill tag\n" +
        "- Skills provide specialized instructions and best practices - follow them closely\n" +
        "- Don't read a skill if it's already loaded in your context\n" +
        "- Skills are especially useful for: PDF/Excel processing, data analysis, code reviews, migrations, etc.\n" +
        "\n" +
        "Rules:\n" +
        "- Prefer taking actions with tools (read/write/edit/bash) over long prose.\n" +
        "- Keep outputs terse. Use bullet lists / checklists when summarizing.\n" +
        "- Never invent file paths. Ask via reads or list directories first if unsure.\n" +
        "- For edits, apply the smallest change that satisfies the request.\n" +
        "- For bash tool: On Windows use PowerShell syntax, on Unix use bash syntax. Avoid destructive or privileged commands; stay inside the workspace.\n" +
        "- Use the TodoWrite tool to maintain multi-step plans when needed.\n" +
        "- After finishing, summarize what changed and how to run or test.\n"
    );

    // Load and inject project context (AGENTS.md, etc.)
    const context = getContext();
    const contextPrompt = formatContextForPrompt(context);

    return basePrompt + contextPrompt;
}

// Initialize reminder system
let reminderInitialized = false;

// ---------- Rate limit retry helper ----------
async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function callAnthropicWithRetry(
    params: any,
    maxRetries: number = 5,
    baseDelay: number = 1000
): Promise<Anthropic.Message> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await anthropic.messages.create(params);
        } catch (error: any) {
            // Check if it's a 429 rate limit error
            const is429 = error?.status === 429 ||
                error?.message?.includes('429') ||
                error?.message?.includes('Request limit exceeded');

            if (is429 && attempt < maxRetries) {
                // Calculate exponential backoff delay
                const delay = baseDelay * Math.pow(2, attempt);
                const jitter = Math.random() * 1000; // Add jitter to avoid thundering herd
                const totalDelay = delay + jitter;

                console.log(`\n⚠️  Rate limit exceeded (429). Retrying in ${(totalDelay / 1000).toFixed(1)}s (attempt ${attempt + 1}/${maxRetries})...`);
                await sleep(totalDelay);
                continue;
            }

            // If not a 429 error or exceeded max retries, throw the error
            throw error;
        }
    }
    throw new Error('Max retries exceeded for API call');
}

// ---------- Core loop ----------
export async function query(messages: any[], opts: any = {}): Promise<any[]> {
    let spinner: Ora | null = null;
    const onStatusUpdate = opts.onStatusUpdate;

    // Initialize reminder system (first time only)
    if (!reminderInitialized) {
        initializeReminder();
        reminderInitialized = true;
    }

    // Increment conversation round
    incrementRound();

    // Check if reminder is needed
    checkAndRemind();

    // ============ Auto-compression checkpoint ============
    // Check if context compression is needed before each query
    if (shouldAutoCompact(messages)) {
        messages = await executeAutoCompact(messages);
        // Update status bar after compression
        if (onStatusUpdate) {
            onStatusUpdate();
        }
    }

    // Add pending context blocks (reminder messages)
    const pendingBlocks = consumePendingContextBlocks();
    if (pendingBlocks.length > 0) {
        // Add reminder messages as system context
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'user' && Array.isArray(lastMessage.content)) {
            // Add reminders to user message content
            for (const block of pendingBlocks) {
                lastMessage.content.push(block);
            }
        }
    }

    while (true) {
        spinner = ora({
            text: 'Thinking...',
            color: 'cyan',
        }).start();

        try {
            const res: Anthropic.Message = await callAnthropicWithRetry({
                model: ANTHROPIC_MODEL,
                system: getSystemPrompt(),
                messages: messages,
                tools: getTools(),
                max_tokens: 16000,
                ...(opts.tool_choice ? { tool_choice: opts.tool_choice } : {})
            });

            spinner.stop();

            const toolUses: any[] = [];
            let hasTextOutput = false;

            try {
                for (const block of res.content) {
                    const btype = (block as any).type;
                    if (btype === "text") {
                        const text = (block as any).text || "";
                        if (text.trim()) {
                            ui.printAssistantText(text);
                            hasTextOutput = true;
                        }
                    }
                    if (btype === "tool_use") {
                        toolUses.push(block);
                    }
                }
            } catch (err: any) {
                logErrorDebug(
                    "Iterating res.content failed",
                    {
                        error: err.message,
                        stop_reason: res.stop_reason,
                        content_type: typeof res.content,
                        is_array: Array.isArray(res.content),
                        keys: Object.keys(res),
                    }
                );
                throw err;
            }

            if (res.stop_reason === "tool_use") {
                // Execute tools with visual feedback
                const results = await Promise.all(
                    toolUses.map(async (tu) => {
                        const toolName = (tu as any).name;
                        const toolInput = (tu as any).input;

                        ui.printToolUse(toolName, toolInput);

                        const startTime = Date.now();
                        try {
                            const result = await dispatchTool(tu);
                            const duration = Date.now() - startTime;

                            // Extract result message
                            const resultText = typeof result.content === 'string'
                                ? result.content
                                : 'Done';

                            ui.printToolResult(true, resultText, duration);
                            return result;
                        } catch (error: any) {
                            const duration = Date.now() - startTime;
                            ui.printToolResult(false, error.message || 'Execution failed', duration);
                            throw error;
                        }
                    })
                );

                messages.push({ role: "assistant", content: res.content });
                messages.push({ role: "user", content: results });

                // Update status bar after tools execution
                if (onStatusUpdate) {
                    console.log(); // Add spacing before status bar update
                    onStatusUpdate();
                    console.log(); // Add spacing after status bar update
                }

                continue;
            }

            messages.push({ role: "assistant", content: res.content });
            return messages;

        } catch (error: any) {
            if (spinner) {
                spinner.stop();
            }
            throw error;
        }
    }
}
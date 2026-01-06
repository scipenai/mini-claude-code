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
import { callAnthropicWithRetry } from './api-helpers';
import { getContext, formatContextForPrompt } from './context';
import { getAgentDescriptions } from './agent-types';
import type { Message, QueryOptions, ToolUse } from '../types';

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
        "Subagent System (Task Tool):\n" +
        "You can spawn subagents for complex subtasks using the Task tool. Subagents run in ISOLATED contexts - they don't see your conversation history.\n" +
        "Agent types:\n" +
        `${getAgentDescriptions()}\n` +
        "Use Task for:\n" +
        "- Exploring large codebases (explore agent reads many files, returns summary)\n" +
        "- Planning complex changes (plan agent analyzes code, returns strategy)\n" +
        "- Implementing isolated features (code agent makes changes, returns summary)\n" +
        "\n" +
        "Rules:\n" +
        "- Prefer taking actions with tools (read/write/edit/bash) over long prose.\n" +
        "- Keep outputs terse. Use bullet lists / checklists when summarizing.\n" +
        "- Never invent file paths. Ask via reads or list directories first if unsure.\n" +
        "- For edits, apply the smallest change that satisfies the request.\n" +
        "- For bash tool: On Windows use PowerShell syntax, on Unix use bash syntax. Avoid destructive or privileged commands; stay inside the workspace.\n" +
        "- Use the TodoWrite tool to maintain multi-step plans when needed.\n" +
        "- Use the Task tool to spawn subagents for focused subtasks that need context isolation.\n" +
        "- After finishing, summarize what changed and how to run or test.\n"
    );

    // Load and inject project context (AGENTS.md, etc.)
    const context = getContext();
    const contextPrompt = formatContextForPrompt(context);

    return basePrompt + contextPrompt;
}

// Initialize reminder system
let reminderInitialized = false;

// ---------- Core loop ----------
export async function query(messages: Message[], opts: QueryOptions = {}): Promise<Message[]> {
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
                (lastMessage.content as Anthropic.TextBlockParam[]).push({
                    type: 'text',
                    text: block.text
                });
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

            const toolUses: Anthropic.ToolUseBlock[] = [];
            let hasTextOutput = false;

            try {
                for (const block of res.content) {
                    if (block.type === "text") {
                        const text = block.text || "";
                        if (text.trim()) {
                            ui.printAssistantText(text);
                            hasTextOutput = true;
                        }
                    }
                    if (block.type === "tool_use") {
                        toolUses.push(block);
                    }
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                logErrorDebug(
                    "Iterating res.content failed",
                    {
                        error: errorMessage,
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
                        const toolName = tu.name;
                        const toolInput = (tu.input || {}) as Record<string, unknown>;

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
                        } catch (error) {
                            const duration = Date.now() - startTime;
                            const errorMessage = error instanceof Error ? error.message : 'Execution failed';
                            ui.printToolResult(false, errorMessage, duration);
                            throw error;
                        }
                    })
                );

                messages.push({ role: "assistant", content: res.content as Anthropic.ContentBlockParam[] });
                messages.push({ role: "user", content: results as Anthropic.ToolResultBlockParam[] });

                // Update status bar after tools execution
                if (onStatusUpdate) {
                    console.log(); // Add spacing before status bar update
                    onStatusUpdate();
                    console.log(); // Add spacing after status bar update
                }

                continue;
            }

            messages.push({ role: "assistant", content: res.content as Anthropic.ContentBlockParam[] });
            return messages;

        } catch (error) {
            if (spinner) {
                spinner.stop();
            }
            throw error;
        }
    }
}
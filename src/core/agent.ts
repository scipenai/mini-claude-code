import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL, ANTHROPIC_MODEL, WORKDIR } from '../config/environment';
import { Spinner } from './spinner';
import { tools } from '../tools/tools';
import { dispatchTool } from '../tools/dispatcher';
import { logErrorDebug } from '../utils/logger';

// ---------- SDK client ----------
const apiKey = ANTHROPIC_API_KEY;
if (!apiKey) {
    console.error("❌ ANTHROPIC_API_KEY not set. Please set the ANTHROPIC_API_KEY environment variable.");
    process.exit(1);
}

const anthropic = new Anthropic({
    apiKey: apiKey,
    baseURL: ANTHROPIC_BASE_URL
});

// ---------- System prompt ----------
const SYSTEM = (
    `You are a coding agent operating INSIDE the user's repository at ${WORKDIR}.\n` +
    "Follow this loop strictly: plan briefly → use TOOLS to act directly on files/shell → report concise results.\n" +
    "Rules:\n" +
    "- Prefer taking actions with tools (read/write/edit/bash) over long prose.\n" +
    "- Keep outputs terse. Use bullet lists / checklists when summarizing.\n" +
    "- Never invent file paths. Ask via reads or list directories first if unsure.\n" +
    "- For edits, apply the smallest change that satisfies the request.\n" +
    "- For bash, avoid destructive or privileged commands; stay inside the workspace.\n" +
    "- After finishing, summarize what changed and how to run or test."
);

// ---------- Core loop ----------
export async function query(messages: any[], opts: any = {}): Promise<any[]> {
    while (true) {
        const spinner = new Spinner();
        spinner.start();

        try {
            const res: Anthropic.Message = await anthropic.messages.create({
                model: ANTHROPIC_MODEL,
                system: SYSTEM,
                messages: messages,
                tools: tools,
                max_tokens: 16000,
                ...(opts.tool_choice ? { tool_choice: opts.tool_choice } : {})
            });

            const toolUses: any[] = [];

            try {
                for (const block of res.content) {
                    const btype = (block as any).type;
                    if (btype === "text") {
                        console.log((block as any).text || "");
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
                const results = toolUses.map(tu => dispatchTool(tu));
                messages.push({ role: "assistant", content: res.content });
                messages.push({ role: "user", content: results });
                continue;
            }

            messages.push({ role: "assistant", content: res.content });
            return messages;

        } finally {
            spinner.stop();
        }
    }
}
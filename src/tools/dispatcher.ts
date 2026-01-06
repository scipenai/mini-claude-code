import Anthropic from '@anthropic-ai/sdk';
import { prettyToolLine, prettySubLine } from '../utils/logger';
import { clampText } from '../utils/text-helpers';
import { runBash } from './bash';
import { runRead } from './readFile';
import { runWrite } from './writeFile';
import { runEdit } from './editText';
import { runTodoWrite, TodoWriteInput } from './todoWrite';
import { runTaskTool, TaskInput } from './task';
import { mcpClientManager } from '../core/mcp-client';
import type { ToolResult, BashToolInput, ReadFileToolInput, WriteFileToolInput, EditTextToolInput } from '../types';

// ---------- Types ----------

/**
 * Options for tool dispatch behavior
 */
interface DispatchOptions {
    /** Whether to print tool execution details to console */
    silent: boolean;
    /** Whether Task tool is allowed (disabled for subagents to prevent recursion) */
    allowTaskTool: boolean;
    /** Whether MCP tools are allowed */
    allowMcpTools: boolean;
}

/**
 * Tool executor function type
 */
type ToolExecutor = (input: unknown) => string | Promise<string>;

/**
 * Tool definition with executor and display info
 */
interface ToolDefinition {
    executor: ToolExecutor;
    getDisplayInfo: (input: unknown) => { label: string; detail: string };
    clampOutput?: boolean;
}

// ---------- Helper Functions ----------

/**
 * Helper to safely get a string array's length
 */
function getItemsLength(input: unknown): number {
    const obj = input as Record<string, unknown>;
    const items = obj?.items;
    return Array.isArray(items) ? items.length : 0;
}

/**
 * Create success result
 */
function createResult(toolUseId: string, content: string, isError = false): ToolResult {
    return {
        type: "tool_result",
        tool_use_id: toolUseId,
        content,
        ...(isError ? { is_error: true } : {})
    };
}

// ---------- Tool Definitions ----------

/**
 * Base tool definitions (available to both main agent and subagents)
 */
const BASE_TOOLS: Record<string, ToolDefinition> = {
    TodoWrite: {
        executor: (input) => runTodoWrite(input as TodoWriteInput),
        getDisplayInfo: (input) => ({
            label: "Todo",
            detail: `Update task list (${getItemsLength(input)} items)`
        }),
    },
    bash: {
        executor: (input) => runBash(input as BashToolInput),
        getDisplayInfo: (input) => ({
            label: "Bash",
            detail: (input as BashToolInput).command || ''
        }),
        clampOutput: true,
    },
    read_file: {
        executor: (input) => runRead(input as ReadFileToolInput),
        getDisplayInfo: (input) => ({
            label: "Read",
            detail: (input as ReadFileToolInput).path || ''
        }),
        clampOutput: true,
    },
    write_file: {
        executor: (input) => runWrite(input as WriteFileToolInput),
        getDisplayInfo: (input) => ({
            label: "Write",
            detail: (input as WriteFileToolInput).path || ''
        }),
    },
    edit_text: {
        executor: (input) => runEdit(input as EditTextToolInput),
        getDisplayInfo: (input) => {
            const editInput = input as EditTextToolInput;
            return {
                label: "Edit",
                detail: `${editInput.action} ${editInput.path}`
            };
        },
    },
};

// ---------- Core Dispatcher ----------

/**
 * Core tool dispatch logic
 * 
 * This is the unified dispatcher that handles all tool execution.
 * Behavior is controlled via options parameter.
 * 
 * @param toolUse - Tool use block from Anthropic API
 * @param options - Dispatch options controlling behavior
 * @returns Tool result
 */
async function dispatchToolCore(
    toolUse: Anthropic.ToolUseBlock,
    options: DispatchOptions
): Promise<ToolResult> {
    const { silent, allowTaskTool, allowMcpTools } = options;
    const name = toolUse.name;
    const inputObj = toolUse.input;
    const toolUseId = toolUse.id;

    try {
        // Check base tools first
        const toolDef = BASE_TOOLS[name];
        if (toolDef) {
            // Print tool info if not silent
            if (!silent) {
                const { label, detail } = toolDef.getDisplayInfo(inputObj);
                prettyToolLine(label, detail);
            }

            // Execute tool
            const out = await Promise.resolve(toolDef.executor(inputObj));

            // Print result if not silent
            if (!silent) {
                const displayOut = toolDef.clampOutput ? clampText(out, 2000) : out;
                prettySubLine(displayOut || "(No content)");
            }

            return createResult(toolUseId, out);
        }

        // Handle Task tool (main agent only)
        if (name === "Task") {
            if (!allowTaskTool) {
                return createResult(toolUseId, "Task tool is not available in subagent context", true);
            }
            // Task tool displays its own progress
            const out = await runTaskTool(inputObj as unknown as TaskInput);
            return createResult(toolUseId, out);
        }

        // Handle MCP tools (main agent only)
        if (name.includes('__')) {
            if (!allowMcpTools) {
                return createResult(toolUseId, "MCP tools are not available in subagent context", true);
            }

            if (!silent) {
                prettyToolLine("MCP", name);
            }

            try {
                const out = await mcpClientManager.callTool(name, (inputObj || {}) as Record<string, unknown>);
                if (!silent) {
                    prettySubLine(clampText(out, 2000));
                }
                return createResult(toolUseId, out);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (!silent) {
                    prettySubLine(`Error: ${errorMessage}`);
                }
                return createResult(toolUseId, errorMessage, true);
            }
        }

        // Unknown tool
        return createResult(toolUseId, `unknown tool: ${name}`, true);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createResult(toolUseId, errorMessage, true);
    }
}

// ---------- Public API ----------

/**
 * Dispatch tool call for main agent
 * 
 * Prints tool execution details to console.
 * Supports all tools including Task and MCP.
 */
export async function dispatchTool(toolUse: Anthropic.ToolUseBlock): Promise<ToolResult> {
    return dispatchToolCore(toolUse, {
        silent: false,
        allowTaskTool: true,
        allowMcpTools: true,
    });
}

/**
 * Dispatch tool call for subagent (silent mode)
 * 
 * Subagents execute tools silently without cluttering the main console.
 * Only progress updates are shown by the subagent runner itself.
 * 
 * Task tool is disabled to prevent infinite recursion.
 * MCP tools are disabled for simplicity and security.
 */
export async function dispatchToolForSubagent(toolUse: Anthropic.ToolUseBlock): Promise<ToolResult> {
    return dispatchToolCore(toolUse, {
        silent: true,
        allowTaskTool: false,
        allowMcpTools: false,
    });
}

import { prettyToolLine, prettySubLine } from '../utils/logger';
import { clampText } from '../utils/text-helpers';
import { runBash } from './bash';
import { runRead } from './readFile';
import { runWrite } from './writeFile';
import { runEdit } from './editText';
import { runTodoWrite } from './todoWrite';
import { runTaskTool } from './task';
import { mcpClientManager } from '../core/mcp-client';

// ---------- Tool Dispatcher ----------
export async function dispatchTool(toolUse: any): Promise<any> {
    try {
        const name = toolUse.name;
        const inputObj = toolUse.input || {};
        const toolUseId = toolUse.id;

        if (name === "TodoWrite") {
            prettyToolLine("Todo", `Update task list (${inputObj.items?.length || 0} items)`);
            const out = runTodoWrite(inputObj);
            prettySubLine(out);
            return { type: "tool_result", tool_use_id: toolUseId, content: out };
        }
        if (name === "bash") {
            prettyToolLine("Bash", inputObj.command);
            const out = runBash(inputObj);
            prettySubLine(clampText(out, 2000) || "(No content)");
            return { type: "tool_result", tool_use_id: toolUseId, content: out };
        }
        if (name === "read_file") {
            prettyToolLine("Read", inputObj.path);
            const out = runRead(inputObj);
            prettySubLine(clampText(out, 2000));
            return { type: "tool_result", tool_use_id: toolUseId, content: out };
        }
        if (name === "write_file") {
            prettyToolLine("Write", inputObj.path);
            const out = runWrite(inputObj);
            prettySubLine(out);
            return { type: "tool_result", tool_use_id: toolUseId, content: out };
        }
        if (name === "edit_text") {
            const action = inputObj.action;
            const pathValue = inputObj.path;
            prettyToolLine("Edit", `${action} ${pathValue}`);
            const out = runEdit(inputObj);
            prettySubLine(out);
            return { type: "tool_result", tool_use_id: toolUseId, content: out };
        }
        if (name === "Task") {
            // Task tool is handled specially - it spawns a subagent
            // Progress is displayed by the subagent itself
            const out = await runTaskTool(inputObj);
            return { type: "tool_result", tool_use_id: toolUseId, content: out };
        }
        
        // Check if it's an MCP tool (format: serverName__toolName)
        if (name.includes('__')) {
            prettyToolLine("MCP", name);
            try {
                const out = await mcpClientManager.callTool(name, inputObj);
                prettySubLine(clampText(out, 2000));
                return { type: "tool_result", tool_use_id: toolUseId, content: out };
            } catch (error: any) {
                prettySubLine(`Error: ${error.message}`);
                return {
                    type: "tool_result",
                    tool_use_id: toolUseId,
                    content: error.message,
                    is_error: true
                };
            }
        }
        
        return {
            type: "tool_result",
            tool_use_id: toolUseId,
            content: `unknown tool: ${name}`,
            is_error: true
        };
    } catch (error: any) {
        const toolUseId = toolUse.id;
        return {
            type: "tool_result",
            tool_use_id: toolUseId,
            content: error.message,
            is_error: true
        };
    }
}

// ---------- Subagent Tool Dispatcher (Silent Mode) ----------

/**
 * Dispatch tool call for subagent (no output printing)
 * 
 * Subagents execute tools silently without cluttering the main console.
 * Only progress updates are shown by the subagent runner itself.
 */
export async function dispatchToolForSubagent(toolUse: any): Promise<any> {
    try {
        const name = toolUse.name;
        const inputObj = toolUse.input || {};
        const toolUseId = toolUse.id;

        if (name === "TodoWrite") {
            const out = runTodoWrite(inputObj);
            return { type: "tool_result", tool_use_id: toolUseId, content: out };
        }
        if (name === "bash") {
            const out = runBash(inputObj);
            return { type: "tool_result", tool_use_id: toolUseId, content: out };
        }
        if (name === "read_file") {
            const out = runRead(inputObj);
            return { type: "tool_result", tool_use_id: toolUseId, content: out };
        }
        if (name === "write_file") {
            const out = runWrite(inputObj);
            return { type: "tool_result", tool_use_id: toolUseId, content: out };
        }
        if (name === "edit_text") {
            const out = runEdit(inputObj);
            return { type: "tool_result", tool_use_id: toolUseId, content: out };
        }
        
        // Note: Task tool is NOT available in subagent to prevent recursion
        // MCP tools are also not available in subagents for simplicity
        
        return {
            type: "tool_result",
            tool_use_id: toolUseId,
            content: `unknown tool: ${name}`,
            is_error: true
        };
    } catch (error: any) {
        const toolUseId = toolUse.id;
        return {
            type: "tool_result",
            tool_use_id: toolUseId,
            content: error.message,
            is_error: true
        };
    }
}
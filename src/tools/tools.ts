import Anthropic from '@anthropic-ai/sdk';
import { mcpClientManager } from '../core/mcp-client';
import { TODO_STATUSES } from '../core/todo-manager';

// ---------- Base Tool Definitions ----------
export const baseTools: Anthropic.Tool[] = [
    {
        name: "TodoWrite",
        description: (
            "Update the shared todo list. Used for task planning, progress tracking, and multi-step task management.\n" +
            "Status descriptions:\n" +
            "- pending: Not started\n" +
            "- in_progress: Currently working on (only one allowed at a time)\n" +
            "- completed: Finished\n" +
            "Maximum 20 tasks supported, task IDs must be unique."
        ),
        input_schema: {
            type: "object",
            properties: {
                items: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            id: { 
                                type: "string", 
                                description: "Unique identifier for the task" 
                            },
                            content: { 
                                type: "string", 
                                description: "Task content description" 
                            },
                            activeForm: { 
                                type: "string", 
                                description: "Active form or context information for the task" 
                            },
                            status: { 
                                type: "string", 
                                enum: [...TODO_STATUSES],
                                description: "Task status" 
                            },
                        },
                        required: ["id", "content", "status"],
                        additionalProperties: false,
                    },
                    maxItems: 20,
                    description: "Array of task items"
                }
            },
            required: ["items"],
            additionalProperties: false,
        },
    },
    {
        name: "bash",
        description: (
            "Execute a shell command inside the project workspace. " +
            "On Windows, uses PowerShell by default. On Unix-like systems (Linux, macOS), uses bash. " +
            "Use for scaffolding, formatting, running scripts, installing packages, etc. " +
            "Note: Dangerous commands (like format, rm -rf /, shutdown) are blocked for safety."
        ),
        input_schema: {
            type: "object",
            properties: {
                command: { type: "string", description: "Shell command to run (PowerShell on Windows, bash on Unix-like)" },
                timeout_ms: { type: "integer", minimum: 1000, maximum: 120000, description: "Command timeout in milliseconds (default: 30000)" },
            },
            required: ["command"],
            additionalProperties: false,
        },
    },
    {
        name: "read_file",
        description: "Read a UTF-8 text file. Optionally slice by line range or clamp length.",
        input_schema: {
            type: "object",
            properties: {
                path: { type: "string" },
                start_line: { type: "integer", minimum: 1 },
                end_line: { type: "integer", minimum: -1 },
                max_chars: { type: "integer", minimum: 1, maximum: 200000 },
            },
            required: ["path"],
            additionalProperties: false,
        },
    },
    {
        name: "write_file",
        description: "Create or overwrite/append a UTF-8 text file. Use overwrite unless explicitly asked to append.",
        input_schema: {
            type: "object",
            properties: {
                path: { type: "string" },
                content: { type: "string" },
                mode: { type: "string", enum: ["overwrite", "append"] },
            },
            required: ["path", "content"],
            additionalProperties: false,
        },
    },
    {
        name: "edit_text",
        description: "Small, precise text edits. Choose one action: replace | insert | delete_range.",
        input_schema: {
            type: "object",
            properties: {
                path: { type: "string" },
                action: { type: "string", enum: ["replace", "insert", "delete_range"] },
                find: { type: "string" },
                replace: { type: "string" },
                insert_after: { type: "integer", minimum: -1 },
                new_text: { type: "string" },
                range: {
                    type: "array",
                    items: { type: "integer" },
                    minItems: 2,
                    maxItems: 2
                },
            },
            required: ["path", "action"],
            additionalProperties: false,
        },
    },
];

/**
 * Get all available tools (including base tools and MCP tools)
 * 
 * This function dynamically combines base tools with MCP tools from connected servers.
 * It should be called each time tools are needed to ensure MCP tools are up-to-date.
 */
export function getTools(): Anthropic.Tool[] {
    const tools: Anthropic.Tool[] = [...baseTools];
    
    // Add MCP tools
    const mcpTools = mcpClientManager.getAllTools();
    for (const mcpTool of mcpTools) {
        tools.push({
            name: mcpTool.name,
            description: mcpTool.description || '',
            input_schema: mcpTool.inputSchema as any,
        });
    }
    
    return tools;
}
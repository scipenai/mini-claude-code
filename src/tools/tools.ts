import Anthropic from '@anthropic-ai/sdk';

// ---------- Tool Definitions ----------
export const tools: Anthropic.Tool[] = [
    {
        name: "bash",
        description: (
            "Execute a shell command inside the project workspace. Use for scaffolding, " +
            "formatting, running scripts, etc."
        ),
        input_schema: {
            type: "object",
            properties: {
                command: { type: "string", description: "Shell command to run" },
                timeout_ms: { type: "integer", minimum: 1000, maximum: 120000 },
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
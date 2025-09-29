export interface ToolUse {
    name: string;
    input?: any;
    id: string;
}

export interface ToolResult {
    type: "tool_result";
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}
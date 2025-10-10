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

// Todo related type definitions
export type TodoStatus = 'pending' | 'in_progress' | 'completed';

export interface TodoItem {
    id: string;
    content: string;
    status: TodoStatus;
    activeForm?: string;
}

export interface TodoStats {
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
}

export interface AgentState {
    roundsWithoutTodo: number;
    lastTodoRound: number;
    totalRounds: number;
}

export interface ContextBlock {
    type: string;
    text: string;
}
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

export interface AgentState {
    roundsWithoutTodo: number;
    lastTodoRound: number;
    totalRounds: number;
}

export interface ContextBlock {
    type: string;
    text: string;
}

// ---------- Subagent Types ----------

/**
 * Agent types for subagent system
 */
export type AgentType = 'explore' | 'code' | 'plan';

/**
 * Task input for spawning subagents
 */
export interface TaskInput {
    description: string;  // Short description (3-5 words) for progress display
    prompt: string;       // Detailed instructions for the subagent
    agent_type: AgentType;
}

/**
 * Agent type configuration
 */
export interface AgentTypeConfig {
    description: string;
    tools: '*' | string[];
    prompt: string;
}
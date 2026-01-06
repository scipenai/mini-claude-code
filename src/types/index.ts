import Anthropic from '@anthropic-ai/sdk';

// ---------- Message Types ----------

/**
 * Re-export Anthropic types for internal use
 */
export type ContentBlock = Anthropic.ContentBlock | Anthropic.ToolResultBlockParam;

/**
 * Message in conversation history - uses Anthropic SDK types
 */
export type Message = Anthropic.MessageParam;

/**
 * Conversation history type
 */
export type ConversationHistory = Message[];

// ---------- Tool Types ----------

/**
 * Tool use from API response
 */
export interface ToolUse {
    type: 'tool_use';
    name: string;
    input: Record<string, unknown>;
    id: string;
}

/**
 * Tool result to send back
 */
export interface ToolResult {
    type: 'tool_result';
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}

/**
 * Tool input for bash command
 */
export interface BashToolInput {
    command: string;
    timeout_ms?: number;
}

/**
 * Tool input for read_file
 */
export interface ReadFileToolInput {
    path: string;
    start_line?: number;
    end_line?: number;
    max_chars?: number;
}

/**
 * Tool input for write_file
 */
export interface WriteFileToolInput {
    path: string;
    content: string;
    mode?: 'overwrite' | 'append';
}

/**
 * Tool input for edit_text
 */
export interface EditTextToolInput {
    path: string;
    action: 'replace' | 'insert' | 'delete_range';
    find?: string;
    replace?: string;
    insert_after?: number;
    new_text?: string;
    range?: [number, number];
}

/**
 * Tool input for TodoWrite
 */
export interface TodoWriteToolInput {
    items: Array<{
        id: string;
        content: string;
        status: 'pending' | 'in_progress' | 'completed';
        activeForm?: string;
    }>;
}

/**
 * Union type for all tool inputs
 */
export type ToolInput = 
    | BashToolInput 
    | ReadFileToolInput 
    | WriteFileToolInput 
    | EditTextToolInput 
    | TodoWriteToolInput
    | Record<string, unknown>;

// ---------- Query Options ----------

/**
 * Options for the query function
 */
export interface QueryOptions {
    /** Callback when status needs update */
    onStatusUpdate?: () => void;
    /** Tool choice option */
    tool_choice?: Anthropic.MessageCreateParams['tool_choice'];
}

// ---------- Agent State Types ----------

/**
 * Agent state for todo reminder tracking
 */
export interface AgentState {
    roundsWithoutTodo: number;
    lastTodoRound: number;
    totalRounds: number;
}

/**
 * Context block for reminders
 */
export interface ContextBlock {
    type: string;
    text: string;
}

// ---------- Subagent Types ----------

/**
 * Agent types for subagent system
 */
export type AgentType = 'explore' | 'code' | 'plan' | string;

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

// ---------- UI Types ----------

/**
 * Tool input for display formatting
 */
export interface DisplayToolInput {
    path?: string;
    file_path?: string;
    target_file?: string;
    content?: string;
    command?: string;
    old_string?: string;
    new_string?: string;
    [key: string]: unknown;
}

/**
 * Todo statistics
 */
export interface TodoStats {
    total: number;
    completed: number;
    in_progress: number;
}

/**
 * Extended stats for status bar
 */
export interface ExtendedStats {
    skillCount: number;
    agentCount: number;
}

/**
 * Todo intelligent reminder system
 * Tracks Todo tool usage frequency and reminds when needed
 */

/**
 * Agent state interface
 */
export interface AgentState {
    roundsWithoutTodo: number;
    lastTodoRound: number;
    totalRounds: number;
}

/**
 * Pending context block interface
 */
export interface ContextBlock {
    type: string;
    text: string;
}

// Global state
export const AGENT_STATE: AgentState = {
    roundsWithoutTodo: 0,
    lastTodoRound: 0,
    totalRounds: 0,
};

// Pending context blocks list
export const PENDING_CONTEXT_BLOCKS: ContextBlock[] = [];

/**
 * Initial reminder message
 */
export const INITIAL_REMINDER = `<reminder source="system" topic="todos">
💡 Tip: For complex multi-step tasks, it's recommended to use the TodoWrite tool to plan and track task progress.

This helps to:
- Break down complex tasks into manageable steps
- Track current progress and remaining work
- Ensure tasks are not missed

Usage: Call the TodoWrite tool and pass in a task list array.
</reminder>`;

/**
 * Persistent reminder message (after 10 rounds without use)
 */
export const NAG_REMINDER = `<reminder source="system" topic="todos">
⚠️  Notice: More than 10 conversation rounds have passed without using the task management feature.

If the current task is complex or involves multiple steps, it is strongly recommended to use the TodoWrite tool to:
- Plan task steps
- Track execution progress
- Prevent missing critical steps

This will greatly improve the efficiency and reliability of task execution.
</reminder>`;

/**
 * Ensure context block is added only once
 * @param text - Text to add
 */
export function ensureContextBlock(text: string): void {
    // Check if the same reminder already exists
    const existing = new Set(PENDING_CONTEXT_BLOCKS.map(block => block.text));
    
    if (!existing.has(text)) {
        PENDING_CONTEXT_BLOCKS.push({
            type: 'text',
            text: text,
        });
    }
}

/**
 * Reset Todo usage counter
 */
export function resetTodoCounter(): void {
    AGENT_STATE.roundsWithoutTodo = 0;
    AGENT_STATE.lastTodoRound = AGENT_STATE.totalRounds;
}

/**
 * Increment conversation round count
 */
export function incrementRound(): void {
    AGENT_STATE.totalRounds++;
    AGENT_STATE.roundsWithoutTodo++;
}

/**
 * Check if reminder is needed for Todo usage
 * @returns Whether reminder is needed
 */
export function shouldRemindTodo(): boolean {
    return AGENT_STATE.roundsWithoutTodo >= 10;
}

/**
 * Get and clear pending context blocks
 * @returns Context block array
 */
export function consumePendingContextBlocks(): ContextBlock[] {
    const blocks = [...PENDING_CONTEXT_BLOCKS];
    PENDING_CONTEXT_BLOCKS.length = 0;
    return blocks;
}

/**
 * Initialize reminder system (called on system startup)
 */
export function initializeReminder(): void {
    ensureContextBlock(INITIAL_REMINDER);
}

/**
 * Check and trigger reminder (called before each conversation round)
 */
export function checkAndRemind(): void {
    if (shouldRemindTodo()) {
        ensureContextBlock(NAG_REMINDER);
        // Reset counter to avoid duplicate reminders
        AGENT_STATE.roundsWithoutTodo = 0;
    }
}

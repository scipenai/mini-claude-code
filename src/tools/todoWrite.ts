import { TODO_BOARD, TodoItem } from '../core/todo-manager';
import { resetTodoCounter } from '../core/todo-reminder';

/**
 * TodoWrite tool input parameters
 */
export interface TodoWriteInput {
    items: TodoItem[];
}

/**
 * Execute TodoWrite tool
 * @param input - Tool input parameters
 * @returns Task list view and statistics
 */
export function runTodoWrite(input: TodoWriteInput): string {
    try {
        // Update task list
        const boardView = TODO_BOARD.update(input.items || []);
        
        // Reset reminder counter (Todo tool was used)
        resetTodoCounter();
        
        // Get statistics
        const stats = TODO_BOARD.stats();
        
        // Generate statistics summary
        let summary = '';
        if (stats.total > 0) {
            const parts: string[] = [];
            
            if (stats.completed > 0) {
                parts.push(`✅ Completed: ${stats.completed}`);
            }
            if (stats.in_progress > 0) {
                parts.push(`🔵 In Progress: ${stats.in_progress}`);
            }
            if (stats.pending > 0) {
                parts.push(`⏳ Pending: ${stats.pending}`);
            }
            
            summary = `\n📊 Stats: ${parts.join(' | ')} | Total: ${stats.total}`;
        }
        
        return boardView + summary;
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Return friendly error message
        return `❌ Failed to update task list: ${errorMessage}`;
    }
}

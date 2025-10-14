import chalk from 'chalk';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { STORAGE_DIR, TODOS_FILE } from '../config/environment';
import { ensureDir } from '../utils/file-helpers';

/**
 * Todo Type Definitions
 * 
 * This is the single source of truth for Todo-related types.
 * All other modules should import these types from here.
 */

/**
 * Todo status types
 */
export const TODO_STATUSES = ['pending', 'in_progress', 'completed'] as const;
export type TodoStatus = typeof TODO_STATUSES[number];

/**
 * Todo item interface
 */
export interface TodoItem {
    id: string;
    content: string;
    status: TodoStatus;
    activeForm?: string;
}

/**
 * Todo statistics interface
 */
export interface TodoStats {
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
}

/**
 * TodoManager - Manages task list, state and display
 */
export class TodoManager {
    private items: TodoItem[] = [];
    private persistEnabled: boolean = true;

    /**
     * Constructor
     */
    constructor(persistEnabled: boolean = true) {
        this.persistEnabled = persistEnabled;
        
        // Load from persistent storage
        if (this.persistEnabled) {
            this.loadFromStorage();
        }
    }


    /**
     * Load tasks from persistent storage
     */
    private loadFromStorage(): void {
        try {
            if (!existsSync(TODOS_FILE)) {
                return;
            }

            const content = readFileSync(TODOS_FILE, 'utf-8');
            const data = JSON.parse(content);
            if (data && Array.isArray(data)) {
                this.items = data;
            }
        } catch (error) {
            console.error('[TodoManager] Failed to load from storage:', error);
        }
    }

    /**
     * Save to persistent storage
     */
    private saveToStorage(): void {
        if (!this.persistEnabled) return;

        try {
            ensureDir(STORAGE_DIR);
            writeFileSync(TODOS_FILE, JSON.stringify(this.items, null, 2), 'utf-8');
        } catch (error) {
            console.error('[TodoManager] Failed to save to storage:', error);
        }
    }

    /**
     * Update task list
     * @param items - New task list
     * @returns Rendered task view
     */
    update(items: TodoItem[]): string {
        // Validate task count limit
        if (items.length > 20) {
            throw new Error('Cannot exceed 20 tasks');
        }

        // Validate task items
        const ids = new Set<string>();
        let inProgressCount = 0;

        for (const item of items) {
            // Check required fields
            if (!item.content || item.content.trim() === '') {
                throw new Error('Task content cannot be empty');
            }

            // Check status validity
            if (!TODO_STATUSES.includes(item.status)) {
                throw new Error(`Invalid task status: ${item.status}`);
            }

            // Check ID uniqueness
            if (!item.id) {
                throw new Error('Task ID cannot be empty');
            }
            if (ids.has(item.id)) {
                throw new Error(`Duplicate task ID: ${item.id}`);
            }
            ids.add(item.id);

            // Count in-progress tasks
            if (item.status === 'in_progress') {
                inProgressCount++;
            }
        }

        // Ensure only one task is in progress
        if (inProgressCount > 1) {
            throw new Error('Only one task can be in progress at a time');
        }

        // Update task list
        this.items = items.map(item => ({
            id: item.id,
            content: item.content.trim(),
            status: item.status,
            activeForm: item.activeForm,
        }));

        // Save to persistent storage
        this.saveToStorage();

        return this.render();
    }

    /**
     * Render task list
     * @returns Formatted task list string
     */
    render(): string {
        if (this.items.length === 0) {
            return chalk.dim('📝 No tasks');
        }

        const lines: string[] = [];
        lines.push(chalk.bold('📝 Task List:'));
        lines.push('');

        for (const item of this.items) {
            const mark = item.status === 'completed' ? '☒' : '☐';
            const decoratedLine = this._decorateLine(mark, item);
            lines.push(`  ${decoratedLine}`);
        }

        return lines.join('\n');
    }

    /**
     * Get task statistics
     * @returns Task statistics
     */
    stats(): TodoStats {
        const stats: TodoStats = {
            total: this.items.length,
            completed: 0,
            in_progress: 0,
            pending: 0,
        };

        for (const item of this.items) {
            if (item.status === 'completed') {
                stats.completed++;
            } else if (item.status === 'in_progress') {
                stats.in_progress++;
            } else if (item.status === 'pending') {
                stats.pending++;
            }
        }

        return stats;
    }

    /**
     * Decorate task line (add colors and styles)
     * @param mark - Task mark (☐/☒)
     * @param todo - Task item
     * @returns Decorated string
     */
    private _decorateLine(mark: string, todo: TodoItem): string {
        const text = `${mark} ${todo.content}`;

        switch (todo.status) {
            case 'completed':
                // Green color
                return chalk.green(text);
            case 'in_progress':
                // Cyan bold
                return chalk.cyan.bold(text);
            case 'pending':
            default:
                // Gray
                return chalk.gray(text);
        }
    }

    /**
     * Get current task list (for debugging)
     */
    getItems(): TodoItem[] {
        return [...this.items];
    }

    /**
     * Clear task list
     */
    clear(): void {
        this.items = [];
        this.saveToStorage();
    }

    /**
     * Set persistence toggle
     */
    setPersistEnabled(enabled: boolean): void {
        this.persistEnabled = enabled;
        if (enabled) {
            this.loadFromStorage();
        }
    }

    /**
     * Manually trigger save
     */
    save(): void {
        this.saveToStorage();
    }

    /**
     * Manually trigger load
     */
    load(): void {
        this.loadFromStorage();
    }
}

// Global singleton
export const TODO_BOARD = new TodoManager();

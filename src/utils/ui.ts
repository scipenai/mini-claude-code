import chalk from 'chalk';
import { AUTO_COMPACT_THRESHOLD_RATIO } from '../config/environment';

/**
 * UI utilities for terminal output formatting
 */
export const ui = {
    // Color schemes
    colors: {
        user: chalk.cyan.bold,
        assistant: chalk.green,
        tool: chalk.yellow,
        toolParam: chalk.gray,
        error: chalk.red.bold,
        success: chalk.green.bold,
        warning: chalk.yellow,
        info: chalk.blue,
        dim: chalk.gray,
        highlight: chalk.magenta.bold,
    },

    // Icons
    icons: {
        user: '👤',
        assistant: '🤖',
        tool: '🔧',
        success: '✓',
        error: '✗',
        warning: '⚠️',
        info: 'ℹ️',
        bullet: '•',
        arrow: '→',
    },

    // Formatted output methods
    printBanner(version: string, workdir: string, mcpStatus: string = '') {
        console.log('\n' + chalk.cyan('═'.repeat(60)));
        console.log(chalk.cyan.bold(`  🤖 Mini Claude Code Agent`) + chalk.gray(` v${version}`));
        console.log(chalk.dim(`  📁 Working Directory: ${workdir}`));
        if (mcpStatus) {
            console.log(chalk.green(`  ${this.icons.success} ${mcpStatus}`));
        }
        console.log(chalk.cyan('═'.repeat(60)) + '\n');
    },

    printHelp() {
        console.log('\n' + chalk.bold('Available Commands:'));
        console.log(chalk.cyan('  /help    ') + chalk.dim('- Show this help message'));
        console.log(chalk.cyan('  /clear   ') + chalk.dim('- Clear screen'));
        console.log(chalk.cyan('  /history ') + chalk.dim('- Show persistent command history'));
        console.log(chalk.cyan('  /resume  ') + chalk.dim('- Resume a previous conversation'));
        console.log(chalk.cyan('  /reset   ') + chalk.dim('- Clear conversation context (current session)'));
        console.log(chalk.cyan('  /compact ') + chalk.dim('- Compress conversation to a summary (manual)'));
        console.log(chalk.cyan('  /stats   ') + chalk.dim('- Show context usage statistics'));
        console.log(chalk.cyan('  /todos   ') + chalk.dim('- Show current task list'));
        console.log(chalk.cyan('  exit/quit') + chalk.dim('- Exit the program'));
        const autoCompactPercent = Math.round(AUTO_COMPACT_THRESHOLD_RATIO * 100);
        console.log(chalk.dim(`\n💡 Tip: Context will auto-compress at ${autoCompactPercent}% capacity`));
        console.log(chalk.dim('💡 Tip: Use TodoWrite tool for complex multi-step tasks\n'));
    },

    printTips() {
        console.log(chalk.dim('💡 Tip: Type /help for help, or exit/quit to leave\n'));
    },

    printUserInput(message: string) {
        console.log(chalk.cyan.bold(`\n${this.icons.user} User: `) + message);
    },

    printAssistantText(text: string) {
        if (text.trim()) {
            const formatted = this.formatLongOutput(text, 50); // Max 50 lines
            console.log(chalk.green(`\n${this.icons.assistant} AI: `) + formatted.content);
            if (formatted.truncated) {
                console.log(chalk.dim(`   ... (${formatted.hiddenLines} more lines hidden)`));
            }
        }
    },

    printToolUse(toolName: string, toolInput: any) {
        console.log(chalk.yellow(`\n${this.icons.tool} Executing: `) + chalk.bold(toolName));
        
        // Format tool input nicely
        const formattedInput = this.formatToolInput(toolInput);
        if (formattedInput) {
            const formatted = this.formatLongOutput(formattedInput, 10); // Max 10 lines for tool input
            console.log(chalk.gray('   Input: ') + chalk.dim(formatted.content));
            if (formatted.truncated) {
                console.log(chalk.dim(`   ... (input truncated)`));
            }
        }
    },

    printToolResult(success: boolean, message: string, duration?: number) {
        const icon = success ? this.icons.success : this.icons.error;
        const color = success ? chalk.green : chalk.red;
        const durationText = duration ? chalk.dim(` (${duration}ms)`) : '';
        
        // Format long output for tool results
        const formatted = this.formatLongOutput(message, 30); // Max 30 lines for tool output
        console.log(color(`   ${icon} `) + formatted.content + durationText);
        if (formatted.truncated) {
            console.log(chalk.dim(`   ... (${formatted.hiddenLines} more lines hidden)`));
        }
    },

    printError(message: string, error?: any) {
        console.log(chalk.red.bold(`\n${this.icons.error} Error: `) + message);
        if (error && error.message) {
            const formatted = this.formatLongOutput(error.message, 20); // Max 20 lines for errors
            console.log(chalk.red(formatted.content));
            if (formatted.truncated) {
                console.log(chalk.dim(`   ... (${formatted.hiddenLines} more lines hidden)`));
            }
        }
    },

    printSuccess(message: string) {
        console.log(chalk.green.bold(`\n${this.icons.success} `) + message);
    },

    printWarning(message: string) {
        console.log(chalk.yellow(`\n${this.icons.warning} Warning: `) + message);
    },

    printInfo(message: string) {
        console.log(chalk.blue(`\n${this.icons.info} `) + message);
    },

    printHistory(history: any[]) {
        console.log(chalk.bold('\nConversation History:\n'));
        
        let userMsgCount = 0;
        for (const msg of history) {
            if (msg.role === 'user') {
                userMsgCount++;
                const content = this.extractTextFromContent(msg.content);
                console.log(chalk.cyan(`${userMsgCount}. ${this.icons.user} User: `) + chalk.dim(this.truncate(content, 80)));
            }
        }
        
        if (userMsgCount === 0) {
            console.log(chalk.dim('  (No history yet)'));
        }
        console.log();
    },

    // Helper methods
    formatToolInput(input: any): string {
        if (!input) return '';
        
        try {
            // For common tools, show key parameters
            if (input.path || input.file_path || input.target_file) {
                let result = '';
                const pathKey = input.path || input.file_path || input.target_file;
                result += `path: "${pathKey}"`;
                
                if (input.content) {
                    // Show content preview with line count if multi-line
                    const lines = String(input.content).split('\n');
                    if (lines.length > 1) {
                        result += `\n   content: (${lines.length} lines)`;
                        result += `\n${lines.slice(0, 5).join('\n')}`;
                        if (lines.length > 5) {
                            result += `\n   ...`;
                        }
                    } else {
                        result += `\n   content: "${this.truncate(input.content, 200)}"`;
                    }
                }
                if (input.command) {
                    result += `\n   command: "${input.command}"`;
                }
                if (input.old_string && input.new_string) {
                    result += `\n   replacing ${this.truncate(input.old_string, 50)} with ${this.truncate(input.new_string, 50)}`;
                }
                return result;
            }
            
            // For other tools, show formatted JSON
            const json = JSON.stringify(input, null, 2);
            return json;
        } catch (e) {
            return String(input);
        }
    },

    extractTextFromContent(content: any): string {
        if (typeof content === 'string') {
            return content;
        }
        
        if (Array.isArray(content)) {
            for (const block of content) {
                if (block.type === 'text' && block.text) {
                    return block.text;
                }
            }
        }
        
        return '';
    },

    truncate(text: string, maxLength: number): string {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + '...';
    },

    /**
     * Format long output by truncating if it exceeds maxLines
     * @param text - The text to format
     * @param maxLines - Maximum number of lines to display
     * @returns Formatted output with truncation info
     */
    formatLongOutput(text: string, maxLines: number): { content: string, truncated: boolean, hiddenLines: number } {
        const lines = text.split('\n');
        
        if (lines.length <= maxLines) {
            return { content: text, truncated: false, hiddenLines: 0 };
        }
        
        // Show first (maxLines - 5) lines and last 3 lines
        const keepTopLines = Math.max(5, maxLines - 5);
        const keepBottomLines = 3;
        
        const topLines = lines.slice(0, keepTopLines);
        const bottomLines = lines.slice(-keepBottomLines);
        const hiddenLines = lines.length - keepTopLines - keepBottomLines;
        
        let content = topLines.join('\n');
        if (bottomLines.length > 0 && hiddenLines > 0) {
            content += '\n' + chalk.dim(`   ... (${hiddenLines} lines omitted) ...`) + '\n' + bottomLines.join('\n');
        }
        
        return { content, truncated: true, hiddenLines: lines.length - maxLines };
    },

    clearScreen() {
        console.clear();
    },

    printSeparator() {
        console.log(chalk.dim('─'.repeat(60)));
    },

    /**
     * Print status bar with MCP and context compression info
     * @param mcpServerCount - Number of connected MCP servers
     * @param contextPercent - Context usage percentage (0-100)
     * @param messageCount - Number of messages in history
     */
    printStatusBar(mcpServerCount: number, contextPercent: number, messageCount: number, todoStats?: { total: number, completed: number, in_progress: number }) {
        const terminalWidth = process.stdout.columns || 80;
        
        // MCP status
        const mcpIcon = mcpServerCount > 0 ? '🔌' : '⚪';
        const mcpColor = mcpServerCount > 0 ? chalk.green : chalk.gray;
        const mcpText = mcpColor(`${mcpIcon} MCP: ${mcpServerCount}`);
        
        // Context status with color coding
        let contextColor;
        let contextIcon;
        if (contextPercent >= 92) {
            contextColor = chalk.red.bold;
            contextIcon = '🔴';
        } else if (contextPercent >= 75) {
            contextColor = chalk.yellow;
            contextIcon = '🟡';
        } else {
            contextColor = chalk.green;
            contextIcon = '🟢';
        }
        const contextText = contextColor(`${contextIcon} Context: ${contextPercent}%`);
        
        // Messages count
        const msgText = chalk.cyan(`💬 Messages: ${messageCount}`);
        
        // Todo stats (if available)
        let todoText = '';
        if (todoStats && todoStats.total > 0) {
            const todoIcon = '📝';
            const completedRatio = `${todoStats.completed}/${todoStats.total}`;
            const inProgressText = todoStats.in_progress > 0 ? ` (${todoStats.in_progress} in progress)` : '';
            todoText = chalk.magenta(`${todoIcon} Todo: ${completedRatio}${inProgressText}`);
        }
        
        // Build status bar
        const separator = chalk.dim(' │ ');
        let statusContent = `${mcpText}${separator}${contextText}${separator}${msgText}`;
        if (todoText) {
            statusContent += `${separator}${todoText}`;
        }
        
        // Remove ANSI codes to calculate actual length
        const plainText = statusContent.replace(/\u001b\[[0-9;]*m/g, '');
        const contentLength = plainText.length;
        
        // Create padding
        const padding = Math.max(0, terminalWidth - contentLength - 4);
        const paddingStr = ' '.repeat(padding);
        
        // Print status bar
        console.log(chalk.dim('┌' + '─'.repeat(terminalWidth - 2) + '┐'));
        console.log(chalk.dim('│ ') + statusContent + paddingStr + chalk.dim(' │'));
        console.log(chalk.dim('└' + '─'.repeat(terminalWidth - 2) + '┘'));
    },

    /**
     * Update status bar in place (overwrites previous lines)
     * @param mcpServerCount - Number of connected MCP servers
     * @param contextPercent - Context usage percentage (0-100)
     * @param messageCount - Number of messages in history
     * @param todoStats - Optional todo statistics
     */
    updateStatusBar(mcpServerCount: number, contextPercent: number, messageCount: number, todoStats?: { total: number, completed: number, in_progress: number }) {
        // Move cursor up 3 lines to overwrite previous status bar
        process.stdout.write('\x1b[3A');
        // Clear those lines
        process.stdout.write('\x1b[0J');
        // Print new status bar
        this.printStatusBar(mcpServerCount, contextPercent, messageCount, todoStats);
    },

    /**
     * Print todo list with formatted display
     * @param todoBoard - Todo board instance
     */
    printTodoBoard(todoBoard: any) {
        const rendered = todoBoard.render();
        if (rendered) {
            console.log('\n' + rendered + '\n');
        }
    },
};


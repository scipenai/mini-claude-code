import chalk from 'chalk';

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
        console.log(chalk.cyan('  /history ') + chalk.dim('- Show conversation history'));
        console.log(chalk.cyan('  /reset   ') + chalk.dim('- Reset conversation history'));
        console.log(chalk.cyan('  exit/quit') + chalk.dim('- Exit the program'));
        console.log(chalk.dim('\n💡 Tip: Press Enter to send your message\n'));
    },

    printTips() {
        console.log(chalk.dim('💡 Tip: Type /help for help, or exit/quit to leave\n'));
    },

    printUserInput(message: string) {
        console.log(chalk.cyan.bold(`\n${this.icons.user} User: `) + message);
    },

    printAssistantText(text: string) {
        if (text.trim()) {
            console.log(chalk.green(`\n${this.icons.assistant} AI: `) + text);
        }
    },

    printToolUse(toolName: string, toolInput: any) {
        console.log(chalk.yellow(`\n${this.icons.tool} Executing: `) + chalk.bold(toolName));
        
        // Format tool input nicely
        const formattedInput = this.formatToolInput(toolInput);
        if (formattedInput) {
            console.log(chalk.gray('   Input: ') + chalk.dim(formattedInput));
        }
    },

    printToolResult(success: boolean, message: string, duration?: number) {
        const icon = success ? this.icons.success : this.icons.error;
        const color = success ? chalk.green : chalk.red;
        const durationText = duration ? chalk.dim(` (${duration}ms)`) : '';
        console.log(color(`   ${icon} `) + message + durationText);
    },

    printError(message: string, error?: any) {
        console.log(chalk.red.bold(`\n${this.icons.error} Error: `) + message);
        if (error && error.message) {
            console.log(chalk.red(error.message));
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
            // For common tools, show key parameters only
            if (input.path) {
                let result = `path: "${input.path}"`;
                if (input.content) {
                    const preview = this.truncate(input.content, 50);
                    result += `, content: "${preview}"`;
                }
                if (input.command) {
                    result += `, command: "${input.command}"`;
                }
                return result;
            }
            
            // For other tools, show compact JSON
            const json = JSON.stringify(input, null, 0);
            return this.truncate(json, 100);
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

    clearScreen() {
        console.clear();
    },

    printSeparator() {
        console.log(chalk.dim('─'.repeat(60)));
    },
};


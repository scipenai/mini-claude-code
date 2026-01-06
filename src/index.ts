#!/usr/bin/env node

import { input, select } from '@inquirer/prompts';
import { enhancedInput, ExitSignalError } from './utils/custom-input';
import { query } from './core/agent';
import { WORKDIR, VERSION } from './config/environment';
import { mcpClientManager } from './core/mcp-client';
import { loadMCPConfig } from './config/mcp-config';
import { ui } from './utils/ui';
import { executeManualCompact, getContextStats } from './utils/context-compression';
import { TODO_BOARD } from './core/todo-manager';
import { execSync } from 'child_process';
import chalk from 'chalk';
import {
    initializeStorage,
    addToHistory as addToHistoryStorage,
    getHistory as getHistoryStorage,
    appendToLog,
    readLog,
    loadLogList,
    dateToFilename,
    getMessagesPath,
} from './utils/storage';
import { processUserInput } from './commands/command-processor';
import { shouldShowOnboarding } from './utils/project-config';
import { getCommandNames } from './commands/commands';
import { findAllSkills } from './utils/skills';
import { getCustomAgentTypeNames } from './core/agent-types';
import Anthropic from '@anthropic-ai/sdk';
import type { Message } from './types';
import type { SerializedMessage } from './types/storage';

// Fix Windows console encoding to support UTF-8
if (process.platform === 'win32') {
    try {
        execSync('chcp 65001', { stdio: 'ignore' });
    } catch {
        // Ignore encoding setup errors
    }
}

async function main() {
    // Initialize storage system
    try {
        initializeStorage();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        ui.printWarning(`Storage initialization failed: ${errorMessage}`);
    }

    // Initialize MCP client
    let mcpStatus = '';
    try {
        const mcpConfig = await loadMCPConfig();
        await mcpClientManager.initialize(mcpConfig);
        const serverCount = mcpConfig.length || 0;
        if (serverCount > 0) {
            mcpStatus = `MCP servers connected (${serverCount})`;
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        ui.printWarning(`MCP initialization failed: ${errorMessage}`);
    }

    // Print welcome banner
    ui.printBanner(VERSION, WORKDIR, mcpStatus);
    
    // Show onboarding tip if needed
    if (shouldShowOnboarding()) {
        console.log(chalk.blue('💡 Getting started:'));
        console.log(chalk.dim('   Run /init to create an AGENTS.md file with codebase documentation'));
        console.log(chalk.dim('   This helps the AI understand your project better\n'));
    }
    
    ui.printTips();

    const history: Message[] = [];
    
    // Generate log filename (can be changed when resuming a conversation)
    const currentLogName = dateToFilename(new Date());
    let currentLogPath = getMessagesPath(currentLogName);
    
    // Get MCP server count
    const mcpConfig = await loadMCPConfig().catch(() => []);
    const mcpServerCount = mcpConfig.length || 0;

    // Handle Ctrl+C gracefully
    let isExiting = false;
    process.on('SIGINT', async () => {
        if (isExiting) {
            process.exit(0);
        }
        isExiting = true;
        console.log('\n');
        try {
            const answer = await input({
                message: 'Are you sure you want to exit? (y/n)',
                default: 'n'
            });
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                console.log('\n👋 Goodbye!\n');
                await mcpClientManager.closeAll();
                process.exit(0);
            }
        } catch (e) {
            // User cancelled, continue
        }
        isExiting = false;
    });

    // Helper function to show status bar
    const showStatusBar = () => {
        const stats = getContextStats(history);
        const todoStats = TODO_BOARD.stats();
        const todoInfo = todoStats.total > 0 ? {
            total: todoStats.total,
            completed: todoStats.completed,
            in_progress: todoStats.in_progress
        } : undefined;
        
        // Get skills and custom agents count
        const skillCount = findAllSkills().length;
        const agentCount = getCustomAgentTypeNames().length;
        const extendedStats = (skillCount > 0 || agentCount > 0) 
            ? { skillCount, agentCount } 
            : undefined;
        
        ui.printStatusBar(mcpServerCount, stats.percentUsed, stats.messageCount, todoInfo, extendedStats);
    };

    // Show initial status bar
    showStatusBar();

    while (true) {
        try {
            const line = await enhancedInput({
                message: '❯',
            });

            const trimmed = line.trim();
            
            // Handle empty input
            if (!trimmed) {
                continue;
            }

            // Handle special commands
            if (trimmed === '/help') {
                const customCommandNames = getCommandNames();
                ui.printHelp(customCommandNames);
                showStatusBar();
                continue;
            }

            if (trimmed === '/clear') {
                ui.clearScreen();
                ui.printBanner(VERSION, WORKDIR, mcpStatus);
                showStatusBar();
                continue;
            }

            if (trimmed === '/history') {
                // Display persistent command history
                try {
                    const commandHistory = getHistoryStorage();
                    if (commandHistory.length === 0) {
                        ui.printInfo('📜 No command history');
                    } else {
                        console.log('\n📜 Command History (Latest first):');
                        commandHistory.forEach((cmd, index) => {
                            const number = index + 1;
                            console.log(`  ${number}. ${cmd}`);
                        });
                        console.log(`\nTotal: ${commandHistory.length} commands\n`);
                    }
                } catch (error) {
                    ui.printWarning('Failed to load command history');
                }
                showStatusBar();
                continue;
            }

            if (trimmed === '/resume') {
                // Resume previous conversation
                try {
                    const logs = await loadLogList();
                    
                    if (logs.length === 0) {
                        ui.printWarning('No conversation logs found');
                        showStatusBar();
                        continue;
                    }

                    // Let user select conversation to resume
                    const choices = [
                        ...logs.map((log, index) => ({
                            name: `${log.firstPrompt} (${log.messageCount} messages, ${new Date(log.modified).toLocaleString()})`,
                            value: index,
                            description: `Created: ${new Date(log.created).toLocaleString()}`
                        })),
                        // Add cancel option
                        {
                            name: chalk.dim('── Cancel ──'),
                            value: -1,
                            description: 'Press to cancel and return'
                        }
                    ];

                    const selectedIndex = await select({
                        message: 'Select a conversation to resume (or select Cancel):',
                        choices: choices,
                        pageSize: 10,
                    });

                    // User selected cancel
                    if (selectedIndex === -1) {
                        ui.printInfo('Resume cancelled');
                        showStatusBar();
                        continue;
                    }

                    const selectedLog = logs[selectedIndex];
                    const messages = readLog(selectedLog.fullPath);

                    if (messages.length === 0) {
                        ui.printWarning('Selected conversation is empty');
                        showStatusBar();
                        continue;
                    }

                    // Clear current history and load selected conversation
                    history.length = 0;
                    
                    // Convert message format
                    messages.forEach((msg: SerializedMessage) => {
                        if (msg.message) {
                            const content = msg.message.content;
                            // Convert to compatible format
                            if (typeof content === 'string') {
                                history.push({
                                    role: msg.type as 'user' | 'assistant',
                                    content: content
                                });
                            } else {
                                // Array content - convert to compatible block types
                                const convertedContent = content.map(block => ({
                                    type: block.type || 'text',
                                    text: block.text || ''
                                })) as Anthropic.TextBlockParam[];
                                history.push({
                                    role: msg.type as 'user' | 'assistant',
                                    content: convertedContent
                                });
                            }
                        }
                    });

                    // Update current log path to continue appending to the resumed conversation
                    currentLogPath = selectedLog!.fullPath;

                    ui.printSuccess(`Loaded ${history.length} messages from conversation`);
                    console.log(chalk.dim(`First prompt: ${selectedLog!.firstPrompt}`));
                    console.log(chalk.dim(`Last modified: ${new Date(selectedLog!.modified).toLocaleString()}`));
                    console.log(chalk.green(`✓ New messages will be appended to this conversation\n`));
                    
                } catch (error) {
                    const err = error as Error & { name?: string };
                    if (err.name === 'ExitPromptError') {
                        // User pressed Ctrl+C to cancel
                        ui.printInfo('Resume cancelled');
                    } else {
                        ui.printError('Failed to load conversation', error);
                    }
                }
                showStatusBar();
                continue;
            }

            if (trimmed === '/reset') {
                history.length = 0;
                // Create a new log file for the new conversation
                const newLogName = dateToFilename(new Date());
                currentLogPath = getMessagesPath(newLogName);
                ui.printSuccess('Conversation context has been cleared');
                console.log(chalk.dim('  • AI will start with a fresh context'));
                console.log(chalk.dim('  • A new conversation log has been created'));
                console.log(chalk.dim('  • Your command history (/history) is preserved\n'));
                showStatusBar();
                continue;
            }

            if (trimmed === '/compact') {
                if (history.length === 0) {
                    ui.printWarning('No conversation history to compress');
                } else {
                    try {
                        const compactedHistory = await executeManualCompact(history);
                        // Replace history with compacted version
                        history.length = 0;
                        history.push(...compactedHistory);
                    } catch (error) {
                        ui.printError('Failed to compress conversation', error);
                    }
                }
                showStatusBar();
                continue;
            }

            if (trimmed === '/stats') {
                const stats = getContextStats(history);
                ui.printInfo(
                    `📊 Context Statistics:\n` +
                    `   Messages: ${stats.messageCount}\n` +
                    `   Tokens: ~${stats.tokenCount} / ${stats.contextLimit}\n` +
                    `   Usage: ${stats.percentUsed}%\n` +
                    `   Remaining: ~${stats.tokensRemaining} tokens until auto-compact\n` +
                    `   Status: ${stats.isAboveAutoCompactThreshold ? '⚠️  Near limit' : '✅ OK'}`
                );
                showStatusBar();
                continue;
            }

            if (trimmed === '/todos') {
                const todoStats = TODO_BOARD.stats();
                if (todoStats.total === 0) {
                    ui.printInfo('📝 No current tasks');
                } else {
                    ui.printTodoBoard(TODO_BOARD);
                }
                showStatusBar();
                continue;
            }

            // Handle exit commands
            if (["q", "quit", "exit"].includes(trimmed.toLowerCase())) {
                console.log('\n👋 Goodbye!\n');
                // Clean up stdin to allow program exit
                if (process.stdin.isTTY) {
                    process.stdin.setRawMode(false);
                }
                process.stdin.pause();
                break;
            }

            // Print user input
            ui.printUserInput(trimmed);

            // Add to history storage 
            try {
                addToHistoryStorage(trimmed);
            } catch (error) {
                // Ignore storage errors
            }

            // Process input (check if it's a command)
            let messagesToQuery;
            let progressMessage: string | undefined;
            try {
                const processed = await processUserInput(trimmed);
                messagesToQuery = processed.messages;
                progressMessage = processed.progressMessage;
            } catch (error) {
                ui.printError('Command processing failed', error);
                showStatusBar();
                continue;
            }

            // Check if there are messages to query (local commands might return empty array)
            if (messagesToQuery.length === 0) {
                // Local command was executed, just show status bar
                showStatusBar();
                continue;
            }
            
            // Add messages to history
            for (const msg of messagesToQuery) {
                history.push(msg);
            }
            
            // Save user messages to log
            try {
                for (const msg of messagesToQuery) {
                    appendToLog(currentLogPath, {
                        type: msg.role as 'user' | 'assistant',
                        message: msg,
                    });
                }
            } catch (error) {
                // Ignore log errors
            }
            
            // Show progress message if available (for commands like /init)
            if (progressMessage) {
                console.log(chalk.dim(`\n🔍 ${progressMessage}...\n`));
            }
            
            // Show status bar before query starts
            console.log(); // Add spacing
            showStatusBar();
            console.log(); // Add spacing before execution
            
            // Pass status bar updater to query
            await query(history, {
                onStatusUpdate: () => {
                    const stats = getContextStats(history);
                    const todoStats = TODO_BOARD.stats();
                    const todoInfo = todoStats.total > 0 ? {
                        total: todoStats.total,
                        completed: todoStats.completed,
                        in_progress: todoStats.in_progress
                    } : undefined;
                    
                    // Get skills and custom agents count
                    const skillCount = findAllSkills().length;
                    const agentCount = getCustomAgentTypeNames().length;
                    const extendedStats = (skillCount > 0 || agentCount > 0) 
                        ? { skillCount, agentCount } 
                        : undefined;
                    
                    ui.updateStatusBar(mcpServerCount, stats.percentUsed, stats.messageCount, todoInfo, extendedStats);
                }
            });
            
            // Save assistant response to log
            try {
                const lastMessage = history[history.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                    appendToLog(currentLogPath, {
                        type: 'assistant',
                        message: lastMessage,
                    });
                }
            } catch (error) {
                // Ignore log errors
            }
            
            // Update status bar after query
            console.log(); // Add spacing
            showStatusBar();

        } catch (e) {
            const err = e as Error & { name?: string };
            if (err.name === 'ExitPromptError') {
                // User pressed Ctrl+C
                console.log('\n');
                continue;
            }
            if (e instanceof ExitSignalError || err.name === 'ExitSignalError') {
                // User pressed Ctrl+D twice
                console.log('\n👋 Goodbye!\n');
                // Clean up stdin to allow program exit
                if (process.stdin.isTTY) {
                    process.stdin.setRawMode(false);
                }
                process.stdin.pause();
                break;
            }
            ui.printError('An error occurred', e);
        }
    }
    
    // Close MCP connections
    await mcpClientManager.closeAll();
}

if (require.main === module) {
    main().catch(console.error);
}
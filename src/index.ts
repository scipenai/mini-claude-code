#!/usr/bin/env node

import { input } from '@inquirer/prompts';
import { query } from './core/agent';
import { WORKDIR } from './config/environment';
import { mcpClientManager } from './core/mcp-client';
import { loadMCPConfig } from './config/mcp-config';
import { ui } from './utils/ui';
import { executeManualCompact, getContextStats } from './utils/context-compression';
import { TODO_BOARD } from './core/todo-manager';
import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
    // Load package version
    const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
    const version = packageJson.version || '0.2.0';

    // Initialize MCP client
    let mcpStatus = '';
    try {
        const mcpConfig = await loadMCPConfig();
        await mcpClientManager.initialize(mcpConfig);
        const serverCount = mcpConfig.length || 0;
        if (serverCount > 0) {
            mcpStatus = `MCP servers connected (${serverCount})`;
        }
    } catch (error: any) {
        ui.printWarning(`MCP initialization failed: ${error.message}`);
    }

    // Print welcome banner
    ui.printBanner(version, WORKDIR, mcpStatus);
    ui.printTips();

    const history: any[] = [];
    
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
        ui.printStatusBar(mcpServerCount, stats.percentUsed, stats.messageCount, todoInfo);
    };

    // Show initial status bar
    showStatusBar();

    while (true) {
        try {
            const line = await input({
                message: '❯',
            });

            const trimmed = line.trim();
            
            // Handle empty input
            if (!trimmed) {
                continue;
            }

            // Handle special commands
            if (trimmed === '/help') {
                ui.printHelp();
                showStatusBar();
                continue;
            }

            if (trimmed === '/clear') {
                ui.clearScreen();
                ui.printBanner(version, WORKDIR, mcpStatus);
                showStatusBar();
                continue;
            }

            if (trimmed === '/history') {
                ui.printHistory(history);
                showStatusBar();
                continue;
            }

            if (trimmed === '/reset') {
                history.length = 0;
                ui.printSuccess('Conversation history has been reset');
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
                break;
            }

            // Print user input
            ui.printUserInput(trimmed);

            // Add to history and query
            history.push({ role: "user", content: [{ type: "text", "text": trimmed }] });
            
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
                    ui.updateStatusBar(mcpServerCount, stats.percentUsed, stats.messageCount, todoInfo);
                }
            });
            
            // Update status bar after query
            console.log(); // Add spacing
            showStatusBar();

        } catch (e: any) {
            if (e.name === 'ExitPromptError') {
                // User pressed Ctrl+C
                console.log('\n');
                continue;
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
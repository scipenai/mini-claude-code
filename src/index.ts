#!/usr/bin/env node

import { input } from '@inquirer/prompts';
import { query } from './core/agent';
import { WORKDIR } from './config/environment';
import { mcpClientManager } from './core/mcp-client';
import { loadMCPConfig } from './config/mcp-config';
import { ui } from './utils/ui';
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
                continue;
            }

            if (trimmed === '/clear') {
                ui.clearScreen();
                ui.printBanner(version, WORKDIR, mcpStatus);
                continue;
            }

            if (trimmed === '/history') {
                ui.printHistory(history);
                continue;
            }

            if (trimmed === '/reset') {
                history.length = 0;
                ui.printSuccess('Conversation history has been reset');
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
            await query(history);

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
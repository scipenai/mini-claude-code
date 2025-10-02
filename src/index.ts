#!/usr/bin/env node

import readline from 'readline';
import { query } from './core/agent';
import { WORKDIR } from './config/environment';
import { mcpClientManager } from './core/mcp-client';
import { loadMCPConfig } from './config/mcp-config';

async function main() {
    console.log(`Tiny Coding Agent — cwd: ${WORKDIR}`);
    console.log('Type "exit" or "quit" to leave.\n');

    // Initialize MCP client
    try {
        const mcpConfig = await loadMCPConfig();
        await mcpClientManager.initialize(mcpConfig);
    } catch (error: any) {
        console.error('⚠️  Failed to initialize MCP client:', error.message);
    }

    const history: any[] = [];
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = (): Promise<string> => {
        return new Promise((resolve) => {
            rl.question("User: ", (answer) => {
                resolve(answer);
            });
        });
    };

    while (true) {
        try {
            const line = await askQuestion();
            if (!line || ["q", "quit", "exit"].includes(line.trim().toLowerCase())) {
                break;
            }
            history.push({ role: "user", content: [{ type: "text", "text": line }] });
            await query(history);
        } catch (e: any) {
            console.log("Error:", e.message);
        }
    }

    rl.close();
    
    // Close MCP connections
    await mcpClientManager.closeAll();
}

if (require.main === module) {
    main().catch(console.error);
}
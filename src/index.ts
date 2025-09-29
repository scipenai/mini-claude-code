#!/usr/bin/env node

import readline from 'readline';
import { query } from './core/agent';
import { WORKDIR } from './config/environment';

async function main() {
    console.log(`Tiny Coding Agent — cwd: ${WORKDIR}`);
    console.log('Type "exit" or "quit" to leave.\n');

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
}

if (require.main === module) {
    main().catch(console.error);
}
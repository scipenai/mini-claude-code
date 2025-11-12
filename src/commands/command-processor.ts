import { hasCommand, getCommand } from './commands';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Process user input and check if it's a command
 * 
 * @param input User input string
 * @returns Object with isCommand flag and messages array
 */
export async function processUserInput(input: string): Promise<{
    isCommand: boolean;
    messages: Anthropic.MessageParam[];
    progressMessage?: string;
}> {
    const trimmed = input.trim();
    
    // Check if input starts with /
    if (!trimmed.startsWith('/')) {
        // Regular user input
        return {
            isCommand: false,
            messages: [{
                role: 'user',
                content: [{ type: 'text', text: trimmed }]
            }]
        };
    }
    
    // Parse command name and args
    const parts = trimmed.slice(1).split(' ');
    const commandName = parts[0];
    const args = trimmed.slice(commandName.length + 2); // +2 for '/' and space
    
    // Check if it's a valid command
    if (!hasCommand(commandName)) {
        // Not a command, treat as regular input
        return {
            isCommand: false,
            messages: [{
                role: 'user',
                content: [{ type: 'text', text: trimmed }]
            }]
        };
    }
    
    // Get the command
    const command = getCommand(commandName);
    if (!command) {
        // Should not happen, but handle gracefully
        return {
            isCommand: false,
            messages: [{
                role: 'user',
                content: [{ type: 'text', text: trimmed }]
            }]
        };
    }
    
    // Handle different command types
    switch (command.type) {
        case 'prompt': {
            // Prompt command: generate messages for AI
            const promptMessages = await command.getPromptForCommand(args);
            return {
                isCommand: true,
                messages: promptMessages,
                progressMessage: command.progressMessage
            };
        }
        
        case 'local': {
            // Local command: execute synchronously and display result
            try {
                const result = await command.call(args);
                // Display the result to the user
                console.log('\n' + result + '\n');
                // Return empty messages array to skip AI query
                return {
                    isCommand: true,
                    messages: []
                };
            } catch (error: any) {
                console.error(`Error executing command: ${error.message}`);
                return {
                    isCommand: true,
                    messages: []
                };
            }
        }
        
        case 'local-jsx': {
            // JSX command: render React components
            // Not applicable in this terminal-only implementation
            console.warn(`JSX commands not supported in terminal mode: ${commandName}`);
            return {
                isCommand: false,
                messages: [{
                    role: 'user',
                    content: [{ type: 'text', text: trimmed }]
                }]
            };
        }
        
        default:
            return {
                isCommand: false,
                messages: [{
                    role: 'user',
                    content: [{ type: 'text', text: trimmed }]
                }]
            };
    }
}


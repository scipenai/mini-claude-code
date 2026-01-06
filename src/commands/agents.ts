import { PromptCommand } from '../types/command';
import { STORAGE_DIR } from '../config/environment';
import { loadCustomAgentTypes, getCustomAgentTypeNames } from '../core/agent-types';
import Anthropic from '@anthropic-ai/sdk';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import chalk from 'chalk';

/**
 * Get agents directory path
 */
export function getAgentsDir(): string {
    return join(STORAGE_DIR, 'agents');
}

/**
 * List all custom agents
 */
function listCustomAgents(): string {
    const agentsDir = getAgentsDir();
    
    if (!existsSync(agentsDir)) {
        return chalk.dim('No custom agents yet. Use /agents create to create a new agent.');
    }
    
    try {
        const files = readdirSync(agentsDir).filter(f => f.endsWith('.json'));
        
        if (files.length === 0) {
            return chalk.dim('No custom agents yet. Use /agents create to create a new agent.');
        }
        
        // Load and display agents
        const customAgents = loadCustomAgentTypes();
        const lines: string[] = [
            chalk.cyan.bold('\n📦 Custom Agents:\n'),
        ];
        
        for (const [name, config] of Object.entries(customAgents)) {
            const toolsStr = config.tools === '*' ? 'All tools' : (config.tools as string[]).join(', ');
            lines.push(chalk.yellow(`  ${name}`));
            lines.push(chalk.dim(`    Description: ${config.description}`));
            lines.push(chalk.dim(`    Tools: ${toolsStr}`));
            lines.push('');
        }
        
        lines.push(chalk.dim('Use Task tool to call these agents: Task(agent_name): "your prompt"'));
        
        return lines.join('\n');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return chalk.red(`Failed to load custom agents: ${errorMessage}`);
    }
}

/**
 * /agents command - Manage custom agents
 * 
 * Subcommands:
 * - /agents list - List all custom agents
 * - /agents create - Create a new agent via natural language
 * - /agents delete <name> - Delete an agent
 */
const agentsCommand: PromptCommand = {
    type: 'prompt',
    name: 'agents',
    description: 'Manage custom agents (list, create, delete)',
    isEnabled: true,
    isHidden: false,
    progressMessage: 'processing agents command',
    aliases: ['agent'],
    
    userFacingName() {
        return 'agents';
    },
    
    async getPromptForCommand(args: string): Promise<Anthropic.MessageParam[]> {
        const trimmedArgs = args.trim().toLowerCase();
        const agentsDir = getAgentsDir();
        
        // Handle subcommands
        if (!trimmedArgs || trimmedArgs === 'list') {
            // List agents - this is a local operation, show result immediately
            console.log(listCustomAgents());
            return []; // Return empty to skip AI query
        }
        
        if (trimmedArgs === 'help') {
            console.log(chalk.cyan.bold('\n🤖 Agent Management Commands:\n'));
            console.log(chalk.yellow('  /agents') + chalk.dim(' or ') + chalk.yellow('/agents list'));
            console.log(chalk.dim('    List all custom agents\n'));
            console.log(chalk.yellow('  /agents create'));
            console.log(chalk.dim('    Create a new agent via natural language\n'));
            console.log(chalk.yellow('  /agents create <description>'));
            console.log(chalk.dim('    Create an agent with description, e.g.:'));
            console.log(chalk.dim('    /agents create a code review agent with read-only permissions\n'));
            console.log(chalk.yellow('  /agents delete <name>'));
            console.log(chalk.dim('    Delete a specified agent\n'));
            return [];
        }
        
        if (trimmedArgs.startsWith('delete ')) {
            const agentName = args.trim().slice(7).trim();
            if (!agentName) {
                console.log(chalk.red('Please specify the agent name to delete'));
                return [];
            }
            
            // Check if agent exists
            const agentFile = join(agentsDir, `${agentName}.json`);
            if (!existsSync(agentFile)) {
                console.log(chalk.red(`Agent "${agentName}" does not exist`));
                return [];
            }
            
            // Delete agent
            try {
                const fs = await import('fs');
                fs.unlinkSync(agentFile);
                console.log(chalk.green(`✓ Agent "${agentName}" deleted`));
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.log(chalk.red(`Delete failed: ${errorMessage}`));
            }
            return [];
        }
        
        // Handle create command
        if (trimmedArgs === 'create') {
            // Prompt for interactive creation
            return [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `I want to create a custom Agent. Please help me through these steps:

1. First ask me what type of Agent I want to create and its purpose
2. Based on my description, determine the following:
   - name: Unique identifier (lowercase, no spaces)
   - description: Brief description of the agent
   - tools: Tool permissions, options:
     * ["bash", "read_file"] - Read-only (for exploration, analysis)
     * "*" - Full access (for tasks requiring file modifications)
     * Custom combinations like ["bash", "read_file", "write_file"]
   - prompt: System prompt for this Agent, describing its role and behavior

3. Confirm the configuration with me
4. Use write_file tool to save the config to ${agentsDir}/<name>.json

Config file format example:
{
  "name": "reviewer",
  "description": "Code review expert, focuses on finding issues and improvements",
  "tools": ["bash", "read_file"],
  "prompt": "You are a code review expert. Analyze code for bugs, security issues, and improvements. Never modify files, only report findings."
}

Please start by asking what kind of Agent I want to create.`,
                        },
                    ],
                },
            ];
        }
        
        // Handle create with description
        if (trimmedArgs.startsWith('create ')) {
            const description = args.trim().slice(7).trim();
            
            return [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Please create a custom Agent based on the following description:

"${description}"

Complete these steps:
1. Determine the Agent configuration based on the description:
   - name: Unique identifier (lowercase, no spaces, short)
   - description: Brief description based on user input
   - tools: Tool permissions based on purpose
     * ["bash", "read_file"] - Read-only (for exploration, analysis, review)
     * "*" - Full access (for tasks requiring file modifications)
   - prompt: System prompt for this Agent (English, describing role and behavior)

2. Show me the configuration to be created
3. Use write_file tool to save the config to ${agentsDir}/<name>.json

Config file format:
{
  "name": "<name>",
  "description": "<description>",
  "tools": ["bash", "read_file"] or "*",
  "prompt": "<system prompt in English>"
}

Please start analyzing and create the Agent.`,
                        },
                    ],
                },
            ];
        }
        
        // Unknown subcommand, show help
        console.log(chalk.yellow(`Unknown subcommand: ${trimmedArgs}`));
        console.log(chalk.dim('Use /agents help to see available commands'));
        return [];
    },
};

export default agentsCommand;


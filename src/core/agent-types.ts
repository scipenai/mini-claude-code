/**
 * Agent Type Registry - Core of subagent mechanism
 * 
 * Defines different agent types with their tool permissions and specialized prompts.
 * Each agent type has:
 * - description: Human-readable description
 * - tools: Tool whitelist ("*" means all base tools, or array of specific tools)
 * - prompt: Specialized system prompt for the agent type
 */

import { WORKDIR, STORAGE_DIR } from '../config/environment';
import { join } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';

// ---------- Agent Type Configuration ----------

export interface AgentTypeConfig {
    description: string;
    tools: '*' | string[];
    prompt: string;
}

export const AGENT_TYPES: Record<string, AgentTypeConfig> = {
    // Explore: Read-only agent for searching and analyzing
    // Cannot modify files - safe for broad exploration
    explore: {
        description: 'Read-only agent for exploring code, finding files, searching',
        tools: ['bash', 'read_file'],  // No write access
        prompt: 'You are an exploration agent. Search and analyze, but never modify files. Return a concise summary of what you found.',
    },

    // Code: Full-powered agent for implementation
    // Has all tools - use for actual coding work
    code: {
        description: 'Full agent for implementing features and fixing bugs',
        tools: '*',  // All tools
        prompt: 'You are a coding agent. Implement the requested changes efficiently. Focus on the task at hand.',
    },

    // Plan: Analysis agent for design work
    // Read-only, focused on producing plans and strategies
    plan: {
        description: 'Planning agent for designing implementation strategies',
        tools: ['bash', 'read_file'],  // Read-only
        prompt: 'You are a planning agent. Analyze the codebase and output a numbered implementation plan. Do NOT make any changes to files.',
    },
};

// ---------- Agent Type Helpers ----------

/**
 * Get agent type descriptions for the Task tool description
 */
export function getAgentDescriptions(): string {
    const allTypes = getAllAgentTypes();
    return Object.entries(allTypes)
        .map(([name, cfg]) => `- ${name}: ${cfg.description}`)
        .join('\n');
}

/**
 * Get the system prompt for a specific agent type
 */
export function getSubagentSystemPrompt(agentType: string): string {
    const config = getAgentTypeConfig(agentType);
    if (!config) {
        throw new Error(`Unknown agent type: ${agentType}`);
    }

    return (
        `You are a ${agentType} subagent operating at ${WORKDIR}.\n` +
        `\n` +
        `${config.prompt}\n` +
        `\n` +
        `Complete the task and return a clear, concise summary.`
    );
}

/**
 * Get available agent type names (built-in + custom)
 */
export function getAgentTypeNames(): string[] {
    const allTypes = getAllAgentTypes();
    return Object.keys(allTypes);
}

/**
 * Check if an agent type exists (built-in or custom)
 */
export function isValidAgentType(agentType: string): boolean {
    // Check built-in types
    if (agentType in AGENT_TYPES) {
        return true;
    }
    // Check custom types
    const customTypes = loadCustomAgentTypes();
    return agentType in customTypes;
}

// ---------- Custom Agent Types ----------

/**
 * Get the agents directory path
 */
export function getAgentsDir(): string {
    return join(STORAGE_DIR, 'agents');
}

/**
 * Load custom agent types from .mini-cc/agents directory
 */
export function loadCustomAgentTypes(): Record<string, AgentTypeConfig> {
    const agentsDir = getAgentsDir();
    const customTypes: Record<string, AgentTypeConfig> = {};
    
    if (!existsSync(agentsDir)) {
        return customTypes;
    }
    
    try {
        const files = readdirSync(agentsDir).filter(f => f.endsWith('.json'));
        
        for (const file of files) {
            try {
                const filePath = join(agentsDir, file);
                const content = readFileSync(filePath, 'utf-8');
                const config = JSON.parse(content);
                
                // Validate config
                if (config.name && config.description && config.tools && config.prompt) {
                    customTypes[config.name] = {
                        description: config.description,
                        tools: config.tools,
                        prompt: config.prompt,
                    };
                }
            } catch (e) {
                // Skip invalid files
                console.warn(`Warning: Failed to load agent config ${file}`);
            }
        }
    } catch (e) {
        // Directory access error
    }
    
    return customTypes;
}

/**
 * Get all agent types (built-in + custom)
 */
export function getAllAgentTypes(): Record<string, AgentTypeConfig> {
    return {
        ...AGENT_TYPES,
        ...loadCustomAgentTypes(),
    };
}

/**
 * Get custom agent type names
 */
export function getCustomAgentTypeNames(): string[] {
    return Object.keys(loadCustomAgentTypes());
}

/**
 * Get agent type config (built-in or custom)
 */
export function getAgentTypeConfig(agentType: string): AgentTypeConfig | null {
    // Check built-in first
    if (agentType in AGENT_TYPES) {
        return AGENT_TYPES[agentType];
    }
    // Check custom types
    const customTypes = loadCustomAgentTypes();
    return customTypes[agentType] || null;
}


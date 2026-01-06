/**
 * Subagent Execution - The heart of context isolation
 * 
 * Core Philosophy: "Divide and Conquer with Context Isolation"
 * 
 * The Problem - Context Pollution:
 * When a single agent explores many files, its context fills with details,
 * leaving little room for the actual task.
 * 
 * The Solution - Subagents with Isolated Context:
 * Each subagent has:
 *   1. Its own fresh message history
 *   2. Filtered tools based on agent type
 *   3. Specialized system prompt
 *   4. Returns only final summary to parent
 */

import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_MODEL } from '../config/environment';
import { getAgentTypeConfig, getSubagentSystemPrompt, isValidAgentType, getAgentTypeNames } from './agent-types';
import { getBaseToolsForSubagent } from '../tools/tools';
import { dispatchToolForSubagent } from '../tools/dispatcher';
import { callAnthropicWithRetry } from './api-helpers';
import chalk from 'chalk';
import type { Message, ToolResult } from '../types';

// ---------- Types ----------

export interface TaskInput {
    description: string;  // Short description (3-5 words) for progress display
    prompt: string;       // Detailed instructions for the subagent
    agent_type: 'explore' | 'code' | 'plan';
}

interface SubagentProgress {
    agentType: string;
    description: string;
    toolCount: number;
    startTime: number;
}

// ---------- Progress Display ----------

/**
 * Update progress display on a single line
 */
function updateProgress(progress: SubagentProgress): void {
    const elapsed = (Date.now() - progress.startTime) / 1000;
    const text = `  [${progress.agentType}] ${progress.description} ... ${progress.toolCount} tools, ${elapsed.toFixed(1)}s`;
    
    // Use carriage return to update in-place
    process.stdout.write(`\r${chalk.dim(text)}`);
}

/**
 * Print final progress status
 */
function finishProgress(progress: SubagentProgress): void {
    const elapsed = (Date.now() - progress.startTime) / 1000;
    const text = `  [${progress.agentType}] ${progress.description} - done (${progress.toolCount} tools, ${elapsed.toFixed(1)}s)`;
    
    // Clear line and print final status
    process.stdout.write(`\r${chalk.green(text)}\n`);
}

// ---------- Tool Filtering ----------

/**
 * Get tools available for a specific agent type
 * Subagents never get the Task tool to prevent infinite recursion
 */
function getToolsForAgent(agentType: string): Anthropic.Tool[] {
    const config = getAgentTypeConfig(agentType);
    if (!config) {
        throw new Error(`Unknown agent type: ${agentType}`);
    }

    const baseTools = getBaseToolsForSubagent();

    if (config.tools === '*') {
        // All base tools (but NOT Task - subagents can't spawn more subagents)
        return baseTools;
    }

    // Filter to only allowed tools
    return baseTools.filter(tool => (config.tools as string[]).includes(tool.name));
}

// ---------- Subagent Execution ----------

/**
 * Execute a subagent task with isolated context.
 * 
 * This is the core of the subagent mechanism:
 * 1. Create isolated message history (KEY: no parent context!)
 * 2. Use agent-specific system prompt
 * 3. Filter available tools based on agent type
 * 4. Run the same query loop as main agent
 * 5. Return ONLY the final text (not intermediate details)
 * 
 * The parent agent sees just the summary, keeping its context clean.
 */
export async function runTask(input: TaskInput): Promise<string> {
    const { description, prompt, agent_type } = input;

    // Validate agent type
    if (!isValidAgentType(agent_type)) {
        const validTypes = getAgentTypeNames().join(', ');
        return `Error: Unknown agent type '${agent_type}'. Valid types: ${validTypes}`;
    }

    // Get agent-specific configuration
    const systemPrompt = getSubagentSystemPrompt(agent_type);
    const tools = getToolsForAgent(agent_type);

    // ISOLATED message history - this is the key!
    // The subagent starts fresh, doesn't see parent's conversation
    const messages: Message[] = [
        { role: 'user', content: prompt }
    ];

    // Initialize progress tracking
    const progress: SubagentProgress = {
        agentType: agent_type,
        description,
        toolCount: 0,
        startTime: Date.now(),
    };

    // Print initial progress line
    console.log(chalk.cyan(`  [${agent_type}] ${description}`));

    try {
        // Run the agent loop (silently - don't print to main chat)
        while (true) {
            const response = await callAnthropicWithRetry(
                {
                    model: ANTHROPIC_MODEL,
                    system: systemPrompt,
                    messages,
                    tools,
                    max_tokens: 8000,
                },
                { verbose: false } // Silent mode for subagents
            );

            // Check if we should continue
            if (response.stop_reason !== 'tool_use') {
                // Finish progress display
                finishProgress(progress);

                // Extract and return only the final text
                for (const block of response.content) {
                    if (block.type === 'text') {
                        return block.text || '(subagent returned no text)';
                    }
                }
                return '(subagent returned no text)';
            }

            // Extract tool calls
            const toolCalls = response.content.filter(
                (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
            );

            const results: ToolResult[] = [];

            for (const toolUse of toolCalls) {
                progress.toolCount++;
                updateProgress(progress);

                // Execute tool using subagent dispatcher (silent mode)
                const output = await dispatchToolForSubagent(toolUse);
                results.push({
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    content: output.content,
                    ...(output.is_error ? { is_error: true } : {}),
                });
            }

            // Add assistant response and tool results to history
            messages.push({ role: 'assistant', content: response.content as Anthropic.ContentBlockParam[] });
            messages.push({ role: 'user', content: results as Anthropic.ToolResultBlockParam[] });
        }
    } catch (error) {
        finishProgress(progress);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return `Error in subagent execution: ${errorMessage}`;
    }
}


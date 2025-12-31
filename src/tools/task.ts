/**
 * Task Tool - Spawn subagents for focused subtasks
 * 
 * The Task tool allows the main agent to delegate work to subagents
 * that run in isolated contexts. This keeps the main conversation clean
 * and prevents context pollution from exploration details.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getAgentDescriptions, getAgentTypeNames } from '../core/agent-types';
import { runTask, TaskInput } from '../core/subagent';

// ---------- Task Tool Definition ----------

export const taskTool: Anthropic.Tool = {
    name: 'Task',
    description: (
        `Spawn a subagent for a focused subtask.\n` +
        `\n` +
        `Subagents run in ISOLATED context - they don't see parent's history.\n` +
        `Use this to keep the main conversation clean and focused.\n` +
        `\n` +
        `Agent types:\n` +
        `${getAgentDescriptions()}\n` +
        `\n` +
        `Example uses:\n` +
        `- Task(explore): "Find all files using the auth module"\n` +
        `- Task(plan): "Design a migration strategy for the database"\n` +
        `- Task(code): "Implement the user registration form"\n` +
        `\n` +
        `When to use Task:\n` +
        `- Exploring large codebases (explore agent reads many files, returns summary)\n` +
        `- Planning complex changes (plan agent analyzes and returns strategy)\n` +
        `- Implementing isolated features (code agent makes changes, returns summary)\n` +
        `\n` +
        `The subagent's detailed work stays in its own context. Only the final ` +
        `summary returns to the main conversation.`
    ),
    input_schema: {
        type: 'object',
        properties: {
            description: {
                type: 'string',
                description: 'Short task name (3-5 words) for progress display. Example: "Find auth files"',
            },
            prompt: {
                type: 'string',
                description: 'Detailed instructions for the subagent. Be specific about what to find, analyze, or implement.',
            },
            agent_type: {
                type: 'string',
                enum: getAgentTypeNames(),
                description: 'Type of agent to spawn: explore (read-only), code (full access), plan (analysis only)',
            },
        },
        required: ['description', 'prompt', 'agent_type'],
        additionalProperties: false,
    },
};

// ---------- Task Execution ----------

/**
 * Execute the Task tool
 * This is called by the dispatcher when the model uses the Task tool
 */
export async function runTaskTool(input: TaskInput): Promise<string> {
    return runTask(input);
}


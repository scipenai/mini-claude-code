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
        return chalk.dim('暂无自定义 Agent。使用 /agents create 创建新的 Agent。');
    }
    
    try {
        const files = readdirSync(agentsDir).filter(f => f.endsWith('.json'));
        
        if (files.length === 0) {
            return chalk.dim('暂无自定义 Agent。使用 /agents create 创建新的 Agent。');
        }
        
        // Load and display agents
        const customAgents = loadCustomAgentTypes();
        const lines: string[] = [
            chalk.cyan.bold('\n📦 自定义 Agent 列表:\n'),
        ];
        
        for (const [name, config] of Object.entries(customAgents)) {
            const toolsStr = config.tools === '*' ? '全部工具' : (config.tools as string[]).join(', ');
            lines.push(chalk.yellow(`  ${name}`));
            lines.push(chalk.dim(`    描述: ${config.description}`));
            lines.push(chalk.dim(`    工具: ${toolsStr}`));
            lines.push('');
        }
        
        lines.push(chalk.dim('使用 Task 工具调用这些 Agent: Task(agent_name): "your prompt"'));
        
        return lines.join('\n');
    } catch (error: any) {
        return chalk.red(`加载自定义 Agent 失败: ${error.message}`);
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
            console.log(chalk.cyan.bold('\n🤖 Agent 管理命令:\n'));
            console.log(chalk.yellow('  /agents') + chalk.dim(' 或 ') + chalk.yellow('/agents list'));
            console.log(chalk.dim('    列出所有自定义 Agent\n'));
            console.log(chalk.yellow('  /agents create'));
            console.log(chalk.dim('    通过自然语言创建新的 Agent\n'));
            console.log(chalk.yellow('  /agents create <描述>'));
            console.log(chalk.dim('    直接使用描述创建 Agent，例如:'));
            console.log(chalk.dim('    /agents create 一个专门做代码审查的agent，只读权限，关注代码质量\n'));
            console.log(chalk.yellow('  /agents delete <name>'));
            console.log(chalk.dim('    删除指定的 Agent\n'));
            return [];
        }
        
        if (trimmedArgs.startsWith('delete ')) {
            const agentName = args.trim().slice(7).trim();
            if (!agentName) {
                console.log(chalk.red('请指定要删除的 Agent 名称'));
                return [];
            }
            
            // Check if agent exists
            const agentFile = join(agentsDir, `${agentName}.json`);
            if (!existsSync(agentFile)) {
                console.log(chalk.red(`Agent "${agentName}" 不存在`));
                return [];
            }
            
            // Delete agent
            try {
                const fs = await import('fs');
                fs.unlinkSync(agentFile);
                console.log(chalk.green(`✓ Agent "${agentName}" 已删除`));
            } catch (error: any) {
                console.log(chalk.red(`删除失败: ${error.message}`));
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
                            text: `我想创建一个自定义 Agent。请帮我完成以下步骤：

1. 首先问我想创建什么类型的 Agent，它的用途是什么
2. 根据我的描述，确定以下信息：
   - name: Agent 的唯一标识符（小写英文，无空格）
   - description: 简短的中文描述
   - tools: 工具权限，可选值：
     * ["bash", "read_file"] - 只读权限（适合探索、分析）
     * "*" - 全部权限（适合需要修改文件的任务）
     * 自定义组合如 ["bash", "read_file", "write_file"]
   - prompt: 给这个 Agent 的系统提示词，描述它的角色和行为准则

3. 向我确认配置是否正确
4. 使用 write_file 工具将配置保存到 ${agentsDir}/<name>.json

配置文件格式示例：
{
  "name": "reviewer",
  "description": "代码审查专家，专注于发现代码问题和改进建议",
  "tools": ["bash", "read_file"],
  "prompt": "You are a code review expert. Analyze code for bugs, security issues, and improvements. Never modify files, only report findings."
}

请开始询问我想创建什么样的 Agent。`,
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
                            text: `请根据以下描述创建一个自定义 Agent：

"${description}"

请完成以下步骤：
1. 根据描述确定 Agent 的配置：
   - name: Agent 的唯一标识符（小写英文，无空格，简短）
   - description: 简短的中文描述（基于用户描述）
   - tools: 根据用途确定工具权限
     * ["bash", "read_file"] - 只读权限（适合探索、分析、审查）
     * "*" - 全部权限（适合需要修改文件的任务）
   - prompt: 给这个 Agent 的系统提示词（英文，描述角色和行为准则）

2. 向我展示将要创建的配置
3. 使用 write_file 工具将配置保存到 ${agentsDir}/<name>.json

配置文件格式：
{
  "name": "<name>",
  "description": "<description>",
  "tools": ["bash", "read_file"] 或 "*",
  "prompt": "<system prompt in English>"
}

请直接开始分析并创建 Agent。`,
                        },
                    ],
                },
            ];
        }
        
        // Unknown subcommand, show help
        console.log(chalk.yellow(`未知的子命令: ${trimmedArgs}`));
        console.log(chalk.dim('使用 /agents help 查看帮助'));
        return [];
    },
};

export default agentsCommand;


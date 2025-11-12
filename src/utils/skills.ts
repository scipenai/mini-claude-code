/**
 * 技能发现和查找核心逻辑
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { getSearchDirs, isProjectLocal } from './skill-dirs';
import { extractYamlField } from './yaml';
import type { Skill, SkillLocation } from '../types/skill';

/**
 * 查找所有已安装的技能
 * 
 * 扫描所有搜索目录，发现并返回技能信息
 * 使用去重策略：高优先级目录的同名技能会覆盖低优先级的
 * 
 * @returns 技能数组
 */
export function findAllSkills(): Skill[] {
    const skills: Skill[] = [];
    const seen = new Set<string>();  // 用于去重
    const dirs = getSearchDirs();

    for (const dir of dirs) {
        // 跳过不存在的目录
        if (!existsSync(dir)) {
            continue;
        }

        // 读取目录内容
        const entries = readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            // 只处理目录
            if (!entry.isDirectory()) {
                continue;
            }

            // 去重检查：高优先级的技能已经被记录
            if (seen.has(entry.name)) {
                continue;
            }

            // 检查是否包含 SKILL.md 文件
            const skillPath = join(dir, entry.name, 'SKILL.md');
            if (existsSync(skillPath)) {
                try {
                    // 读取文件内容并提取元数据
                    const content = readFileSync(skillPath, 'utf-8');
                    const description = extractYamlField(content, 'description') || 'No description';
                    const location = isProjectLocal(dir) ? 'project' : 'global';

                    skills.push({
                        name: entry.name,
                        description,
                        location,
                        path: join(dir, entry.name),
                    });

                    // 标记为已见
                    seen.add(entry.name);
                } catch (error) {
                    // 跳过无法读取的技能
                    console.error(`Warning: Failed to read skill at ${skillPath}`);
                }
            }
        }
    }

    return skills;
}

/**
 * 查找指定名称的技能
 * 
 * 按优先级顺序搜索，返回第一个匹配的技能
 * 
 * @param skillName 技能名称
 * @returns 技能位置信息，如果未找到则返回 null
 */
export function findSkill(skillName: string): SkillLocation | null {
    const dirs = getSearchDirs();

    for (const dir of dirs) {
        const skillPath = join(dir, skillName, 'SKILL.md');
        
        if (existsSync(skillPath)) {
            return {
                path: skillPath,                    // SKILL.md 的完整路径
                baseDir: join(dir, skillName),      // 技能目录路径
                source: dir,                        // 来源目录
            };
        }
    }

    return null;  // 未找到
}

/**
 * 格式化技能列表输出
 * 
 * @param skills 技能数组
 * @returns 格式化的字符串
 */
export function formatSkillsList(skills: Skill[]): string {
    if (skills.length === 0) {
        return 'No skills found.\n\nTo install skills, place them in:\n  - .mini-cc/skills/ (project)\n  - ~/.mini-cc/skills/ (global)';
    }

    let output = 'Available Skills:\n';
    
    for (const skill of skills) {
        // 计算名称的填充长度（对齐显示）
        const namePadding = ' '.repeat(Math.max(0, 25 - skill.name.length));
        output += `\n  ${skill.name}${namePadding}(${skill.location})\n`;
        
        // 截断过长的描述
        const desc = skill.description.length > 80 
            ? skill.description.slice(0, 77) + '...'
            : skill.description;
        output += `    ${desc}\n`;
    }

    // 统计信息
    const projectCount = skills.filter(s => s.location === 'project').length;
    const globalCount = skills.filter(s => s.location === 'global').length;
    output += `\nSummary: ${projectCount} project, ${globalCount} global (${skills.length} total)`;

    return output;
}

/**
 * 生成技能的 XML 表示（用于 system prompt）
 * 
 * @param skills 技能数组
 * @returns XML 字符串
 */
export function generateSkillsXml(skills: Skill[]): string {
    if (skills.length === 0) {
        return '';
    }

    // 生成每个技能的 XML 标签
    const skillTags = skills
        .map(
            (s) => `<skill>
<name>${s.name}</name>
<description>${s.description}</description>
<location>${s.location}</location>
<path>${s.path}/SKILL.md</path>
</skill>`
        )
        .join('\n\n');

    // 完整的 XML 结构
    return `<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
1. Check if a relevant skill exists in <available_skills> below
2. Read the skill's SKILL.md file using read_file tool with the <path> provided
3. Follow the instructions in the skill closely
4. Use bundled resources from the skill's base directory (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not read a skill if it's already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

${skillTags}

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>`;
}


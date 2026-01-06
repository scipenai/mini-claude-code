/**
 * Skill discovery and lookup core logic
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { getSearchDirs, isProjectLocal } from './skill-dirs';
import { extractYamlField } from './yaml';
import type { Skill, SkillLocation } from '../types/skill';

/**
 * Find all installed skills
 * 
 * Scans all search directories and returns skill information
 * Uses deduplication strategy: higher priority directories override lower priority ones
 * 
 * @returns Array of skills
 */
export function findAllSkills(): Skill[] {
    const skills: Skill[] = [];
    const seen = new Set<string>();  // For deduplication
    const dirs = getSearchDirs();

    for (const dir of dirs) {
        // Skip non-existent directories
        if (!existsSync(dir)) {
            continue;
        }

        // Read directory contents
        const entries = readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            // Only process directories
            if (!entry.isDirectory()) {
                continue;
            }

            // Deduplication check: higher priority skill already recorded
            if (seen.has(entry.name)) {
                continue;
            }

            // Check if it contains SKILL.md file
            const skillPath = join(dir, entry.name, 'SKILL.md');
            if (existsSync(skillPath)) {
                try {
                    // Read file content and extract metadata
                    const content = readFileSync(skillPath, 'utf-8');
                    const description = extractYamlField(content, 'description') || 'No description';
                    const location = isProjectLocal(dir) ? 'project' : 'global';

                    skills.push({
                        name: entry.name,
                        description,
                        location,
                        path: join(dir, entry.name),
                    });

                    // Mark as seen
                    seen.add(entry.name);
                } catch (error) {
                    // Skip skills that cannot be read
                    console.error(`Warning: Failed to read skill at ${skillPath}`);
                }
            }
        }
    }

    return skills;
}

/**
 * Find a skill by name
 * 
 * Searches in priority order, returns first match
 * 
 * @param skillName Skill name
 * @returns Skill location info, null if not found
 */
export function findSkill(skillName: string): SkillLocation | null {
    const dirs = getSearchDirs();

    for (const dir of dirs) {
        const skillPath = join(dir, skillName, 'SKILL.md');
        
        if (existsSync(skillPath)) {
            return {
                path: skillPath,                    // Full path to SKILL.md
                baseDir: join(dir, skillName),      // Skill directory path
                source: dir,                        // Source directory
            };
        }
    }

    return null;  // Not found
}

/**
 * Format skill list output
 * 
 * @param skills Array of skills
 * @returns Formatted string
 */
export function formatSkillsList(skills: Skill[]): string {
    if (skills.length === 0) {
        return 'No skills found.\n\nTo install skills, place them in:\n  - .mini-cc/skills/ (project)\n  - ~/.mini-cc/skills/ (global)';
    }

    let output = 'Available Skills:\n';
    
    for (const skill of skills) {
        // Calculate name padding for alignment
        const namePadding = ' '.repeat(Math.max(0, 25 - skill.name.length));
        output += `\n  ${skill.name}${namePadding}(${skill.location})\n`;
        
        // Truncate long descriptions
        const desc = skill.description.length > 80 
            ? skill.description.slice(0, 77) + '...'
            : skill.description;
        output += `    ${desc}\n`;
    }

    // Summary statistics
    const projectCount = skills.filter(s => s.location === 'project').length;
    const globalCount = skills.filter(s => s.location === 'global').length;
    output += `\nSummary: ${projectCount} project, ${globalCount} global (${skills.length} total)`;

    return output;
}

/**
 * Generate XML representation of skills (for system prompt)
 * 
 * @param skills Array of skills
 * @returns XML string
 */
export function generateSkillsXml(skills: Skill[]): string {
    if (skills.length === 0) {
        return '';
    }

    // Generate XML tag for each skill
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

    // Complete XML structure
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

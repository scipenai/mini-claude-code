import { LocalCommand } from '../types/command';
import { findAllSkills, findSkill, formatSkillsList } from '../utils/skills';
import { getSearchDirs } from '../utils/skill-dirs';
import { readFileSync } from 'fs';
import chalk from 'chalk';

/**
 * /skills command - Manage and invoke skills
 * 
 * Subcommands:
 * - /skills list - List all available skills
 * - /skills read <name> - Read a skill's content
 */
const skillsCommand: LocalCommand = {
    type: 'local',
    name: 'skills',
    description: 'Manage and invoke skills',
    isEnabled: true,
    isHidden: false,

    userFacingName() {
        return 'skills';
    },

    async call(args: string): Promise<string> {
        const trimmedArgs = args.trim();

        // Parse subcommand
        const parts = trimmedArgs.split(' ');
        const subcommand = parts[0];
        const subArgs = parts.slice(1).join(' ').trim();

        // Handle subcommands
        switch (subcommand) {
            case 'list':
                return handleList();

            case 'read':
                return handleRead(subArgs);

            case '':
                // No subcommand provided
                return 'Usage:\n  /skills list - List all available skills\n  /skills read <name> - Read a skill\'s content';

            default:
                return `Unknown subcommand: ${subcommand}\n\nUsage:\n  /skills list - List all available skills\n  /skills read <name> - Read a skill's content`;
        }
    },
};

/**
 * Handle /skills list
 */
function handleList(): string {
    const skills = findAllSkills();
    return formatSkillsList(skills);
}

/**
 * Handle /skills read <name>
 */
function handleRead(skillName: string): string {
    if (!skillName) {
        return 'Error: Skill name required\n\nUsage: /skills read <skill-name>';
    }

    const skill = findSkill(skillName);

    if (!skill) {
        const searchDirs = getSearchDirs();
        let error = `Error: Skill '${skillName}' not found\n\nSearched:\n`;
        searchDirs.forEach(dir => {
            error += `  - ${dir}\n`;
        });
        error += '\nTo install skills, place them in one of the directories above.';
        error += '\nEach skill must be a directory containing a SKILL.md file.';
        return error;
    }

    try {
        const content = readFileSync(skill.path, 'utf-8');

        // Format output to match Claude Code format
        let output = '';
        output += `Reading: ${skillName}\n`;
        output += `Base directory: ${skill.baseDir}\n`;
        output += '\n';
        output += content;
        output += '\n';
        output += `Skill read: ${skillName}`;

        return output;
    } catch (error: any) {
        return `Error: Failed to read skill file\n${error.message}`;
    }
}

export default skillsCommand;


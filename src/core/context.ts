import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { WORKDIR } from '../config/environment';
import { PROJECT_FILE, CLAUDE_FILE } from '../constants/product';
import { findAllSkills, generateSkillsXml } from '../utils/skills';

/**
 * Cache for project docs to avoid repeated file reads
 */
let projectDocsCache: string | null | undefined = undefined;

/**
 * Get project documentation content (AGENTS.md and CLAUDE.md)
 * Results are cached for the session
 */
export function getProjectDocs(): string | null {
    // Return cached result if available
    if (projectDocsCache !== undefined) {
        return projectDocsCache;
    }

    try {
        const agentsPath = join(WORKDIR, PROJECT_FILE);
        const claudePath = join(WORKDIR, CLAUDE_FILE);

        const docs: string[] = [];

        // Try to read AGENTS.md
        if (existsSync(agentsPath)) {
            try {
                const content = readFileSync(agentsPath, 'utf-8');
                if (content.trim()) {
                    docs.push(`# ${PROJECT_FILE}\n\n${content}`);
                }
            } catch (e) {
                console.warn(`Failed to read ${PROJECT_FILE}:`, e);
            }
        }

        // Try to read CLAUDE.md
        if (existsSync(claudePath)) {
            try {
                const content = readFileSync(claudePath, 'utf-8');
                if (content.trim()) {
                    docs.push(`# ${CLAUDE_FILE}\n\n${content}`);
                }
            } catch (e) {
                console.warn(`Failed to read ${CLAUDE_FILE}:`, e);
            }
        }

        projectDocsCache = docs.length > 0 ? docs.join('\n\n---\n\n') : null;
        return projectDocsCache;
    } catch (e) {
        console.warn('Failed to load project docs:', e);
        projectDocsCache = null;
        return null;
    }
}

/**
 * Clear the project docs cache
 * Call this when you want to reload the docs from disk
 */
export function clearProjectDocsCache(): void {
    projectDocsCache = undefined;
}

/**
 * Get aggregated context for AI
 */
export function getContext(): Record<string, string> {
    const context: Record<string, string> = {};

    // Load project docs
    const projectDocs = getProjectDocs();
    if (projectDocs) {
        context.projectDocs = projectDocs;
    }

    // Load available skills
    try {
        const skills = findAllSkills();
        if (skills.length > 0) {
            const skillsXml = generateSkillsXml(skills);
            context.availableSkills = skillsXml;
        }
    } catch (e) {
        console.warn('Failed to load skills:', e);
    }

    // Can add more context sources here in the future
    // - Git status
    // - Directory structure
    // - README.md
    // etc.

    return context;
}

/**
 * Format context for inclusion in system prompt
 */
export function formatContextForPrompt(context: Record<string, string>): string {
    const parts: string[] = [];

    for (const [key, value] of Object.entries(context)) {
        if (value && value.trim()) {
            // Format the context section
            const title = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();

            parts.push(`## ${title}\n\n${value}`);
        }
    }

    return parts.length > 0 ? `\n\n# Project Context\n\n${parts.join('\n\n')}` : '';
}


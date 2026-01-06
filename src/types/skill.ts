/**
 * Skill-related type definitions
 */

/**
 * Skill location type
 */
export type SkillLocationType = 'project' | 'global';

/**
 * Skill information (for list display)
 */
export interface Skill {
    /** Skill name (directory name) */
    name: string;
    /** Skill description (extracted from YAML frontmatter) */
    description: string;
    /** Installation location */
    location: SkillLocationType;
    /** Full path to skill directory */
    path: string;
}

/**
 * Skill location information (for reading)
 */
export interface SkillLocation {
    /** Path to SKILL.md file */
    path: string;
    /** Skill directory path */
    baseDir: string;
    /** Source directory (one of the search directories) */
    source: string;
}

/**
 * Skill metadata (YAML frontmatter)
 */
export interface SkillMetadata {
    name: string;
    description: string;
    context?: string;
}

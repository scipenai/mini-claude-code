/**
 * Skill directory path management utility
 */

import { join } from 'path';
import { homedir } from 'os';

/**
 * Get skill search directories list (sorted by priority)
 * 
 * Priority from high to low:
 * 1. .mini-cc/skills/ (project-level directory)
 * 2. ~/.mini-cc/skills/ (global directory)
 * 
 * @returns Array of search directory paths
 */
export function getSearchDirs(): string[] {
    return [
        join(process.cwd(), '.mini-cc/skills'),   // Project-level directory
        join(homedir(), '.mini-cc/skills'),        // Global directory
    ];
}

/**
 * Check if path is project-local
 * 
 * @param path Path to check
 * @returns Whether it is a project-level path
 */
export function isProjectLocal(path: string): boolean {
    return path.includes(process.cwd());
}

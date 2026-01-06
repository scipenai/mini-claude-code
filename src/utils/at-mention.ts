/**
 * @ Mention file/folder selection feature
 * 
 * When user types @ in the input, triggers file selection menu
 * Supports:
 * - Scanning files and folders in the working directory
 * - Filtering and sorting suggestions based on input
 * - Folders displayed first
 */

import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { WORKDIR } from '../config/environment';

/**
 * File entry type
 */
export interface FileEntry {
    name: string;       // File/folder name
    path: string;       // Path relative to working directory
    type: 'file' | 'folder';
    depth: number;      // Directory depth
}

/**
 * Completion suggestion type
 */
export interface FileSuggestion {
    value: string;      // Full path value
    displayValue: string;  // Display text (with icon)
    type: 'file' | 'folder';
    score: number;      // Match score
}

/**
 * Directories to ignore
 */
const IGNORED_DIRS = new Set([
    'node_modules',
    '.git',
    '.svn',
    '.hg',
    'dist',
    'build',
    '.next',
    '.nuxt',
    '__pycache__',
    '.pytest_cache',
    '.mypy_cache',
    'venv',
    '.venv',
    '.mini-cc',
    '.cache',
    'coverage',
]);

/**
 * File extensions to ignore
 */
const IGNORED_EXTENSIONS = new Set([
    '.pyc',
    '.pyo',
    '.class',
    '.o',
    '.obj',
    '.dll',
    '.so',
    '.dylib',
    '.exe',
    '.lock',
]);

/**
 * Check if directory should be ignored
 */
function shouldIgnoreDir(name: string): boolean {
    return name.startsWith('.') || IGNORED_DIRS.has(name);
}

/**
 * Check if file should be ignored
 */
function shouldIgnoreFile(name: string): boolean {
    if (name.startsWith('.')) return true;
    for (const ext of IGNORED_EXTENSIONS) {
        if (name.endsWith(ext)) return true;
    }
    return false;
}

/**
 * Recursively scan directory
 * 
 * @param dir - Directory to scan
 * @param maxDepth - Maximum scan depth
 * @param currentDepth - Current depth
 * @returns Array of file entries
 */
export function scanDirectory(
    dir: string = WORKDIR,
    maxDepth: number = 4,
    currentDepth: number = 0
): FileEntry[] {
    const entries: FileEntry[] = [];

    if (currentDepth > maxDepth) {
        return entries;
    }

    try {
        const items = readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = join(dir, item.name);
            const relativePath = relative(WORKDIR, fullPath);

            if (item.isDirectory()) {
                if (shouldIgnoreDir(item.name)) continue;

                entries.push({
                    name: item.name,
                    path: relativePath,
                    type: 'folder',
                    depth: currentDepth,
                });

                // Recursively scan subdirectory
                const subEntries = scanDirectory(fullPath, maxDepth, currentDepth + 1);
                entries.push(...subEntries);
            } else if (item.isFile()) {
                if (shouldIgnoreFile(item.name)) continue;

                entries.push({
                    name: item.name,
                    path: relativePath,
                    type: 'file',
                    depth: currentDepth,
                });
            }
        }
    } catch (error) {
        // Ignore permission errors
    }

    return entries;
}

/**
 * Filter and sort entries based on query
 * 
 * Priority strategy:
 * - Exact name match: 100 points
 * - Name starts with query: 80 points
 * - Name contains query: 60 points
 * - Path contains query: 40 points
 * - Folders get extra 5 points
 * - Shallower depth scores higher
 * 
 * @param entries - File entries
 * @param query - Search query
 * @returns Filtered and sorted entries
 */
export function filterEntries(entries: FileEntry[], query: string): FileEntry[] {
    if (!query || query.trim() === '') {
        // When no query, sort by depth and type
        return entries
            .sort((a, b) => {
                if (a.depth !== b.depth) return a.depth - b.depth;
                if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
                return a.name.localeCompare(b.name);
            })
            .slice(0, 50);
    }

    const lowerQuery = query.toLowerCase();

    const scored = entries
        .map(entry => {
            let score = 0;
            const lowerPath = entry.path.toLowerCase();
            const lowerName = entry.name.toLowerCase();

            if (lowerName === lowerQuery) {
                score = 100;
            } else if (lowerName.startsWith(lowerQuery)) {
                score = 80;
            } else if (lowerName.includes(lowerQuery)) {
                score = 60;
            } else if (lowerPath.includes(lowerQuery)) {
                score = 40;
            } else {
                // Check path segments
                const segments = lowerPath.split('/');
                for (const segment of segments) {
                    if (segment.includes(lowerQuery)) {
                        score = 30;
                        break;
                    }
                }
            }

            // Depth penalty
            if (score > 0) {
                score -= entry.depth * 2;
            }

            // Folder bonus
            if (entry.type === 'folder' && score > 0) {
                score += 5;
            }

            return { entry, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 30)
        .map(item => item.entry);

    return scored;
}

/**
 * Format entry for display
 * 
 * @param entry - File entry
 * @returns Display text with icon
 */
export function formatEntry(entry: FileEntry): string {
    const icon = entry.type === 'folder' ? '📁' : '📄';
    return `${icon} ${entry.path}`;
}

/**
 * Get file suggestions list
 * 
 * @param query - Search query (content after @)
 * @returns Array of file suggestions
 */
export function getFileSuggestions(query: string = ''): FileSuggestion[] {
    const allEntries = scanDirectory();
    const filtered = filterEntries(allEntries, query);

    return filtered.map((entry, index) => ({
        value: entry.path,
        displayValue: formatEntry(entry),
        type: entry.type,
        score: 100 - index,  // Assign score based on sort order
    }));
}

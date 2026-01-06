/**
 * Mention processor
 * 
 * Responsible for:
 * - Parsing @ references in user input
 * - Validating if files/folders exist
 * - Generating system reminders for AI to read referenced files
 */

import { existsSync, statSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { WORKDIR } from '../config/environment';

/**
 * Parsed Mention
 */
export interface ParsedMention {
    original: string;       // Original matched text (e.g., @src/index.ts)
    path: string;           // File path
    absolutePath: string;   // Absolute path
    type: 'file' | 'folder' | 'not_found';
    valid: boolean;
}

/**
 * Processed Mention result
 */
export interface ProcessedMentions {
    mentions: ParsedMention[];
    cleanedInput: string;   // Input with @ prefix removed
    systemReminder: string | null;  // System reminder text
}

/**
 * File Mention regex pattern
 * Supports:
 * - @path/to/file
 * - @"path with space"
 * - @'path with space'
 */
const FILE_MENTION_PATTERN = /@(?:"([^"\n]+)"|'([^'\n]+)'|([a-zA-Z0-9/._~:\\\-]+))/g;

/**
 * Resolve path, supporting relative paths and special prefixes
 * 
 * @param mentionPath - Path after @
 * @returns Resolved absolute path
 */
function resolveMentionPath(mentionPath: string): string {
    // Handle home directory
    if (mentionPath.startsWith('~/')) {
        const home = process.env.HOME || process.env.USERPROFILE || '';
        return resolve(home, mentionPath.slice(2));
    }

    // Handle absolute path
    if (mentionPath.startsWith('/')) {
        return mentionPath;
    }

    // Relative to working directory
    return resolve(WORKDIR, mentionPath);
}

/**
 * Extract all mentions from user input
 * 
 * @param input - User input text
 * @returns Array of parsed mentions
 */
export function extractMentions(input: string): ParsedMention[] {
    const mentions: ParsedMention[] = [];
    let match;

    // Reset regex
    FILE_MENTION_PATTERN.lastIndex = 0;

    while ((match = FILE_MENTION_PATTERN.exec(input)) !== null) {
        // Extract path (supports quoted and unquoted)
        const path = match[1] || match[2] || match[3];
        if (!path) continue;

        // Skip email format (e.g., user@domain.com)
        const beforeAt = input.slice(0, match.index);
        if (/\w$/.test(beforeAt)) {
            continue;
        }

        const absolutePath = resolveMentionPath(path);
        let type: 'file' | 'folder' | 'not_found' = 'not_found';
        let valid = false;

        try {
            if (existsSync(absolutePath)) {
                const stats = statSync(absolutePath);
                type = stats.isDirectory() ? 'folder' : 'file';
                valid = true;
            }
        } catch (error) {
            // Ignore errors
        }

        mentions.push({
            original: match[0],
            path,
            absolutePath,
            type,
            valid,
        });
    }

    return mentions;
}

/**
 * Generate folder contents description
 */
function getFolderContents(folderPath: string, maxItems: number = 20): string {
    try {
        const items = readdirSync(folderPath, { withFileTypes: true });
        const files: string[] = [];
        const folders: string[] = [];

        for (const item of items) {
            if (item.name.startsWith('.')) continue;
            if (item.isDirectory()) {
                folders.push(`📁 ${item.name}/`);
            } else {
                files.push(`📄 ${item.name}`);
            }
        }

        const allItems = [...folders, ...files].slice(0, maxItems);
        const remaining = folders.length + files.length - allItems.length;

        let result = allItems.join('\n');
        if (remaining > 0) {
            result += `\n... and ${remaining} more items`;
        }

        return result;
    } catch (error) {
        return '(Unable to read directory contents)';
    }
}

/**
 * Generate system reminder text
 * 
 * Based on mention.md technical spec, generates instructions for AI to read referenced files
 * 
 * @param mentions - Valid mentions
 * @returns System reminder text
 */
function generateSystemReminder(mentions: ParsedMention[]): string | null {
    const validMentions = mentions.filter(m => m.valid);
    if (validMentions.length === 0) return null;

    const lines: string[] = [];
    lines.push('<system-reminder>');
    lines.push('The user referenced the following files/folders in their input:\n');

    for (const mention of validMentions) {
        if (mention.type === 'file') {
            lines.push(`• File: ${mention.path}`);
            lines.push(`  You MUST use the Read tool to read the full contents of this file: ${mention.absolutePath}`);
        } else if (mention.type === 'folder') {
            lines.push(`• Folder: ${mention.path}`);
            lines.push(`  Directory contents:\n${getFolderContents(mention.absolutePath)}`);
            lines.push(`  Use the Read tool to read any files within this folder as needed.`);
        }
        lines.push('');
    }

    lines.push('Please read the referenced files above before processing the user request to get full context.');
    lines.push('</system-reminder>');

    return lines.join('\n');
}

/**
 * Process mentions in user input
 * 
 * @param input - User input
 * @returns Processing result containing mentions, cleaned input, and system reminder
 */
export function processMentions(input: string): ProcessedMentions {
    const mentions = extractMentions(input);
    
    // Remove @ prefix, keep path
    let cleanedInput = input;
    for (const mention of mentions) {
        if (mention.valid) {
            // Keep path, only remove @ symbol
            cleanedInput = cleanedInput.replace(mention.original, mention.path);
        }
    }

    const systemReminder = generateSystemReminder(mentions);

    return {
        mentions,
        cleanedInput,
        systemReminder,
    };
}

/**
 * Check if input contains mentions
 * 
 * @param input - User input
 * @returns Whether it contains @ references
 */
export function hasMentions(input: string): boolean {
    FILE_MENTION_PATTERN.lastIndex = 0;
    return FILE_MENTION_PATTERN.test(input);
}

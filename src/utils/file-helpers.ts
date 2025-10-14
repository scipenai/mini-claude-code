import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { WORKDIR } from '../config/environment';

/**
 * Validate and resolve a path within the workspace
 * @param p - Path to validate
 * @returns Absolute path within workspace
 * @throws Error if path escapes workspace
 */
export function safePath(p: string): string {
    const absPath = path.resolve(WORKDIR, p || "");
    const relative = path.relative(WORKDIR, absPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error("Path escapes workspace");
    }
    return absPath;
}

/**
 * Permission error codes set
 */
const PERMISSION_ERROR_CODES = new Set(['EACCES', 'EPERM', 'EROFS']);

/**
 * Check if error is permission-related
 * @param error - Error to check
 * @returns True if permission error
 */
function isPermissionError(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        PERMISSION_ERROR_CODES.has((error as NodeJS.ErrnoException).code ?? '')
    );
}

/**
 * Safely create directory with error handling
 * 
 * This is the unified directory creation function used across the project.
 * It handles permission errors gracefully and creates parent directories recursively.
 * 
 * @param dir - Directory path to create
 * @returns True if directory was created or already exists, false if permission denied
 * @throws Error for non-permission errors
 */
export function ensureDir(dir: string): boolean {
    if (existsSync(dir)) return true;

    try {
        mkdirSync(dir, { recursive: true });
        return true;
    } catch (error) {
        if (isPermissionError(error)) {
            return false;
        }
        throw error;
    }
}
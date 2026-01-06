import path from 'path';
import { existsSync, mkdirSync, realpathSync, lstatSync } from 'fs';
import { WORKDIR } from '../config/environment';

/**
 * Get the real path of WORKDIR (resolved symlinks)
 * Cached for performance
 */
let _realWorkdir: string | null = null;
function getRealWorkdir(): string {
    if (_realWorkdir === null) {
        try {
            _realWorkdir = realpathSync(WORKDIR);
        } catch {
            // If WORKDIR doesn't exist or can't be resolved, use as-is
            _realWorkdir = path.resolve(WORKDIR);
        }
    }
    return _realWorkdir;
}

/**
 * Check if a resolved path is within the workspace
 * @param resolvedPath - Absolute path (with symlinks resolved)
 * @returns True if path is within workspace
 */
function isWithinWorkspace(resolvedPath: string): boolean {
    const realWorkdir = getRealWorkdir();
    const relative = path.relative(realWorkdir, resolvedPath);
    
    // Path escapes if it starts with '..' or is an absolute path
    return !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Find the nearest existing ancestor directory of a path
 * @param targetPath - Target path to check
 * @returns The nearest existing ancestor path
 */
function findNearestExistingAncestor(targetPath: string): string {
    let current = targetPath;
    
    while (current !== path.dirname(current)) {
        if (existsSync(current)) {
            return current;
        }
        current = path.dirname(current);
    }
    
    return current; // Root directory
}

/**
 * Validate and resolve a path within the workspace
 * 
 * Security features:
 * - Resolves symbolic links to prevent symlink-based path traversal
 * - Validates both logical path and real path after symlink resolution
 * - Handles non-existent paths by validating nearest existing ancestor
 * 
 * @param p - Path to validate
 * @returns Absolute path within workspace
 * @throws Error if path escapes workspace (including via symlinks)
 */
export function safePath(p: string): string {
    const inputPath = p || "";
    
    // Step 1: Resolve to absolute path (logical, before symlink resolution)
    const absPath = path.resolve(WORKDIR, inputPath);
    
    // Step 2: Check logical path first (quick check)
    const logicalRelative = path.relative(WORKDIR, absPath);
    if (logicalRelative.startsWith('..') || path.isAbsolute(logicalRelative)) {
        throw new Error("Path escapes workspace");
    }
    
    // Step 3: Check for symlinks and resolve real path
    try {
        if (existsSync(absPath)) {
            // Path exists - resolve symlinks and validate
            const realPath = realpathSync(absPath);
            
            if (!isWithinWorkspace(realPath)) {
                throw new Error("Path escapes workspace via symbolic link");
            }
        } else {
            // Path doesn't exist - check if any existing ancestor is a symlink escaping workspace
            const nearestAncestor = findNearestExistingAncestor(absPath);
            
            if (nearestAncestor && existsSync(nearestAncestor)) {
                const realAncestor = realpathSync(nearestAncestor);
                
                if (!isWithinWorkspace(realAncestor)) {
                    throw new Error("Path escapes workspace via symbolic link");
                }
                
                // Reconstruct the path with resolved ancestor
                const remainingPath = path.relative(nearestAncestor, absPath);
                const projectedRealPath = path.join(realAncestor, remainingPath);
                
                // Validate the projected path
                if (!isWithinWorkspace(projectedRealPath)) {
                    throw new Error("Path escapes workspace");
                }
            }
        }
    } catch (error) {
        // Re-throw our security errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('escapes workspace')) {
            throw error;
        }
        // For other errors (permissions, etc.), continue with the logical path check
        // The actual file operation will fail with appropriate error
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
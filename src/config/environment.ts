import { join } from 'path';
import { readFileSync } from 'fs';

export const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || "";
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "";

// Workspace configuration
export const WORKDIR = process.cwd();
export const MAX_TOOL_RESULT_CHARS = 100_000;

// Storage configuration
export const STORAGE_DIR = join(WORKDIR, '.mini-cc');
export const HISTORY_FILE = join(STORAGE_DIR, 'history.json');
export const TODOS_FILE = join(STORAGE_DIR, 'todos-simple.json');

// Context configuration
export const DEFAULT_CONTEXT_LIMIT = 200_000;
export const AUTO_COMPACT_THRESHOLD_RATIO = 0.92;  // Auto-compact at 92% capacity

// Version configuration (read from package.json)
function getVersion(): string {
    try {
        const packageJsonPath = join(__dirname, '../../package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.version || '0.0.0';
    } catch (error) {
        return '0.0.0';
    }
}

export const VERSION = getVersion();
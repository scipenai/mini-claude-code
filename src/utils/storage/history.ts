/**
 * Command History Module
 * Manages user input command history
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { STORAGE_DIR, HISTORY_FILE } from '../../config/environment';
import { ensureDir } from '../file-helpers';

// ============= Constants =============

const MAX_HISTORY_ITEMS = 100;

// ============= File Operations =============

/**
 * Read history from file
 */
function readHistoryFile(): string[] {
  if (!existsSync(HISTORY_FILE)) {
    return [];
  }

  try {
    const content = readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('[History] Failed to read history file, returning empty array');
    return [];
  }
}

/**
 * Write history to file
 */
function writeHistoryFile(history: string[]): void {
  try {
    ensureDir(STORAGE_DIR);
    writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
  } catch (error) {
    console.error('[History] Failed to write history file:', error);
  }
}

// ============= History Management =============

/**
 * Get history
 */
export function getHistory(): string[] {
  return readHistoryFile();
}

/**
 * Add to history
 * Auto-deduplication (same command won't be added repeatedly)
 */
export function addToHistory(command: string): void {
  const history = readHistoryFile();

  // Skip if the latest command is the same as current command
  if (history[0] === command) {
    return;
  }

  // Add to the beginning (LIFO stack structure)
  history.unshift(command);

  // Save with limit
  writeHistoryFile(history.slice(0, MAX_HISTORY_ITEMS));
}

/**
 * Storage System Unified Export
 */

// Log management
export * from './log';

// Command history
export * from './history';

// Initialize storage system
import { initializeLogStorage } from './log';

/**
 * Initialize all storage systems
 */
export function initializeStorage(): void {
  initializeLogStorage();
}


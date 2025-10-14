/**
 * Log Management Module
 * Handles persistent storage of conversation history
 */

import {
  existsSync,
  writeFileSync,
  readFileSync,
  promises as fsPromises,
} from 'fs';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';
import { STORAGE_DIR, VERSION, WORKDIR } from '../../config/environment';
import { ensureDir } from '../file-helpers';
import type { SerializedMessage, LogOption } from '../../types/storage';

// ============= Constants =============

// Session ID (generated on each startup)
export const SESSION_ID = randomUUID();

// ============= Path Management =============

/**
 * Storage path configuration
 */
export const CACHE_PATHS = {
  errors: () => join(STORAGE_DIR, 'errors'),
  messages: () => join(STORAGE_DIR, 'messages'),
  mcpLogs: (serverName: string) => join(STORAGE_DIR, `mcp-logs-${serverName}`),
};

// ============= File Operations =============

/**
 * Permission error codes set (for safeWriteFile)
 */
const PERMISSION_ERROR_CODES = new Set(['EACCES', 'EPERM', 'EROFS']);

/**
 * Check if error is permission-related (for safeWriteFile)
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
 * Safely write file
 */
function safeWriteFile(
  path: string,
  data: string,
  encoding: BufferEncoding = 'utf8'
): boolean {
  try {
    writeFileSync(path, data, encoding);
    return true;
  } catch (error) {
    if (isPermissionError(error)) {
      return false;
    }
    throw error;
  }
}

// ============= Log Read/Write =============

/**
 * Read log
 */
export function readLog(path: string): SerializedMessage[] {
  if (!existsSync(path)) {
    return [];
  }
  try {
    const content = readFileSync(path, 'utf8');
    return JSON.parse(content) as SerializedMessage[];
  } catch {
    return []; // Return empty array if JSON is corrupted
  }
}

/**
 * Append to log
 */
export function appendToLog(path: string, message: any): void {
  // 1. Ensure directory exists
  const dir = dirname(path);
  if (!ensureDir(dir)) {
    return; // Permission denied, graceful degradation
  }

  // 2. Create file if it doesn't exist
  if (!existsSync(path) && !safeWriteFile(path, '[]')) {
    return;
  }

  // 3. Read existing log
  const messages = readLog(path);

  // 4. Add metadata
  const messageWithMetadata = {
    ...message,
    cwd: WORKDIR,
    sessionId: SESSION_ID,
    timestamp: new Date().toISOString(),
    version: VERSION,
  };

  // 5. Append message
  messages.push(messageWithMetadata);

  // 6. Write file
  safeWriteFile(path, JSON.stringify(messages, null, 2));
}


// ============= Log File Naming =============

/**
 * Generate log filename
 * Format: 2025-01-27T12-00-00-000Z
 */
export function dateToFilename(date: Date): string {
  return date.toISOString().replace(/[:.]/g, '-');
}

/**
 * Parse ISO time string
 */
function parseISOString(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Get message log path
 * Supports fork and sidechain
 */
export function getMessagesPath(
  messageLogName: string,
  forkNumber: number = 0,
  sidechainNumber: number = 0
): string {
  const filename = `${messageLogName}${forkNumber > 0 ? `-${forkNumber}` : ''}${
    sidechainNumber > 0 ? `-sidechain-${sidechainNumber}` : ''
  }.json`;

  return join(CACHE_PATHS.messages(), filename);
}

/**
 * Parse log filename
 */
export function parseLogFilename(filename: string): {
  date: string;
  forkNumber?: number;
  sidechainNumber?: number;
} {
  const base = filename.split('.')[0]!;
  const segments = base.split('-');
  const hasSidechain = base.includes('-sidechain-');

  let date = base;
  let forkNumber: number | undefined;
  let sidechainNumber: number | undefined;

  if (hasSidechain) {
    const sidechainIndex = segments.indexOf('sidechain');
    sidechainNumber = Number(segments[sidechainIndex + 1]);

    if (sidechainIndex > 6) {
      forkNumber = Number(segments[sidechainIndex - 1]);
      date = segments.slice(0, 6).join('-');
    } else {
      date = segments.slice(0, 6).join('-');
    }
  } else if (segments.length > 6) {
    // Has fork number
    forkNumber = Number(segments[segments.length - 1]);
    date = segments.slice(0, 6).join('-');
  }

  return { date, forkNumber, sidechainNumber };
}


// ============= Log List Management =============

/**
 * Load log list (with metadata)
 */
export async function loadLogList(
  path: string = CACHE_PATHS.messages()
): Promise<LogOption[]> {
  if (!existsSync(path)) {
    return [];
  }

  try {
    // 1. Read directory
    const files = await fsPromises.readdir(path);

    // 2. Load all log files in parallel
    const logData = await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .map(async (file, i) => {
          const fullPath = join(path, file);
          try {
            const content = await fsPromises.readFile(fullPath, 'utf8');
            const messages = JSON.parse(content) as SerializedMessage[];

            const firstMessage = messages[0];
            const lastMessage = messages[messages.length - 1];

            // 3. Extract first prompt
            let firstPrompt = 'No prompt';
            if (firstMessage?.type === 'user' && firstMessage?.message?.content) {
              const content = firstMessage.message.content;
              if (typeof content === 'string') {
                firstPrompt = content;
              } else if (Array.isArray(content)) {
                // Handle array format content
                const textBlock = content.find((block: any) => block.type === 'text' || block.text);
                if (textBlock) {
                  firstPrompt = textBlock.text || textBlock.content || 'No prompt';
                }
              }
            }

            // 4. Parse filename
            const { date, forkNumber, sidechainNumber } =
              parseLogFilename(file);

            return {
              date,
              forkNumber,
              fullPath,
              messages,
              value: i,
              created: parseISOString(firstMessage?.timestamp || date),
              modified: lastMessage?.timestamp
                ? parseISOString(lastMessage.timestamp)
                : parseISOString(date),
              firstPrompt: firstPrompt.split('\n')[0]?.slice(0, 50) + '…',
              messageCount: messages.length,
              sidechainNumber,
            };
          } catch (error) {
            // Ignore corrupted log files
            return null;
          }
        })
    );

    // 5. Filter and sort (by modification time descending)
    const validLogs = logData.filter(
      (log) => log !== null && log.messages.length > 0
    ) as LogOption[];
    return sortLogs(validLogs);
  } catch (error) {
    console.error('[Storage] Failed to load log list:', error);
    return [];
  }
}

/**
 * Sort log list
 */
export function sortLogs(logs: LogOption[]): LogOption[] {
  return logs.sort((a, b) => {
    // 1. Sort by modification time
    const modifiedDiff = b.modified.getTime() - a.modified.getTime();
    if (modifiedDiff !== 0) return modifiedDiff;

    // 2. Sort by creation time
    const createdDiff = b.created.getTime() - a.created.getTime();
    if (createdDiff !== 0) return createdDiff;

    // 3. Sort by fork number
    return (b.forkNumber ?? 0) - (a.forkNumber ?? 0);
  });
}


/**
 * Initialize log storage system
 */
export function initializeLogStorage(): void {
  const messagesDir = CACHE_PATHS.messages();
  ensureDir(messagesDir);
}


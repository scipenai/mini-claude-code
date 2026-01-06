/**
 * Storage System Type Definitions
 */

// ============= Log-Related Types =============

/**
 * Content Block Type
 */
export type ContentBlock = {
  type: string;
  text?: string;
  [key: string]: unknown;
};

/**
 * Serialized Message
 */
export interface SerializedMessage {
  type: 'user' | 'assistant';
  message: {
    content: string | Array<ContentBlock>;
  };
  timestamp: string;
  sessionId: string;
  cwd: string;
  userType?: string;
  version: string;
}

/**
 * Log Option
 */
export interface LogOption {
  date: string;
  forkNumber?: number;
  sidechainNumber?: number;
  fullPath: string;
  messages: SerializedMessage[];
  value: number;
  created: Date;
  modified: Date;
  firstPrompt: string;
  messageCount: number;
}

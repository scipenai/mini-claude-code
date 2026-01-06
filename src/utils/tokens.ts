/**
 * Token counting utilities
 * Used to estimate token usage in conversation messages
 */

import { DEFAULT_CONTEXT_LIMIT, AUTO_COMPACT_THRESHOLD_RATIO } from '../config/environment';
import type { Message } from '../types';

/**
 * Estimate the number of tokens in text
 * Uses a simple heuristic: approximately 0.25 tokens per character
 * 
 * @param text - Text to estimate
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
    // Simple estimation: ~4 chars/token for English, ~1.5 chars/token for CJK
    // Using conservative estimate: 0.25 tokens per character
    return Math.ceil(text.length * 0.25);
}

/**
 * Content block interface for token counting
 */
interface TokenCountBlock {
    type: string;
    text?: string;
    input?: unknown;
    content?: unknown;
}

/**
 * Count tokens in message content
 * 
 * @param content - Message content (can be string or content array)
 * @returns Estimated token count
 */
export function countMessageTokens(content: string | TokenCountBlock[]): number {
    if (typeof content === 'string') {
        return estimateTokens(content);
    }
    
    if (Array.isArray(content)) {
        let total = 0;
        for (const block of content) {
            if (block.type === 'text' && block.text) {
                total += estimateTokens(block.text);
            } else if (block.type === 'tool_use') {
                // Tool usage also consumes tokens
                total += estimateTokens(JSON.stringify(block.input || {}));
            } else if (block.type === 'tool_result') {
                // Tool result
                const resultContent = block.content;
                if (typeof resultContent === 'string') {
                    total += estimateTokens(resultContent);
                }
            }
        }
        return total;
    }
    
    return 0;
}

/**
 * Calculate total tokens in entire conversation history
 * 
 * @param messages - Message list
 * @returns Total token count
 */
export function countTotalTokens(messages: Message[]): number {
    let total = 0;
    
    for (const message of messages) {
        if (message.role && message.content) {
            const content = message.content;
            if (typeof content === 'string') {
                total += countMessageTokens(content);
            } else if (Array.isArray(content)) {
                total += countMessageTokens(content as TokenCountBlock[]);
            }
        }
    }
    
    return total;
}

/**
 * Threshold calculation result
 */
export interface ThresholdInfo {
    isAboveAutoCompactThreshold: boolean;
    isAboveWarningThreshold: boolean;
    percentage: number;
    percentUsed: number;
    tokensRemaining: number;
    contextLimit: number;
    autoCompactThreshold: number;
}

/**
 * Calculate threshold information
 * 
 * @param tokenCount - Current token count
 * @param contextLimit - Context limit
 * @param thresholdRatio - Threshold ratio
 * @returns Threshold information object
 */
export function calculateThresholds(
    tokenCount: number,
    contextLimit: number = DEFAULT_CONTEXT_LIMIT,
    thresholdRatio: number = AUTO_COMPACT_THRESHOLD_RATIO
): ThresholdInfo {
    const autoCompactThreshold = Math.floor(contextLimit * thresholdRatio);
    const percentage = Math.round((tokenCount / contextLimit) * 100);
    const warningThreshold = 70; // Warning at 70%
    
    return {
        isAboveAutoCompactThreshold: tokenCount >= autoCompactThreshold,
        isAboveWarningThreshold: percentage >= warningThreshold,
        percentage,
        percentUsed: percentage,
        tokensRemaining: Math.max(0, autoCompactThreshold - tokenCount),
        contextLimit,
        autoCompactThreshold,
    };
}


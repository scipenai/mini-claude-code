/**
 * Token counting utilities
 * Used to estimate token usage in conversation messages
 */

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
 * Count tokens in message content
 * 
 * @param content - Message content (can be string or content array)
 * @returns Estimated token count
 */
export function countMessageTokens(content: any): number {
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
export function countTotalTokens(messages: any[]): number {
    let total = 0;
    
    for (const message of messages) {
        if (message.role && message.content) {
            total += countMessageTokens(message.content);
        }
    }
    
    return total;
}

/**
 * Calculate threshold information
 * 
 * @param tokenCount - Current token count
 * @param contextLimit - Context limit
 * @param thresholdRatio - Threshold ratio (default 0.92)
 * @returns Threshold information object
 */
export function calculateThresholds(
    tokenCount: number,
    contextLimit: number = 200_000,
    thresholdRatio: number = 0.92
) {
    const autoCompactThreshold = Math.floor(contextLimit * thresholdRatio);
    
    return {
        isAboveAutoCompactThreshold: tokenCount >= autoCompactThreshold,
        percentUsed: Math.round((tokenCount / contextLimit) * 100),
        tokensRemaining: Math.max(0, autoCompactThreshold - tokenCount),
        contextLimit,
        autoCompactThreshold,
    };
}


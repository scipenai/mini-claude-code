/**
 * Context compression core logic
 * Used for automatic and manual compression of conversation history
 */

import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_MODEL, WORKDIR, DEFAULT_CONTEXT_LIMIT, AUTO_COMPACT_THRESHOLD_RATIO } from '../config/environment';
import { countTotalTokens, calculateThresholds } from './tokens';
import { ui } from './ui';
import { anthropic } from '../core/anthropic-client';
import type { Message } from '../types';

/**
 * Compression prompt
 * Requests AI to generate structured conversation summary
 */
const COMPRESSION_PROMPT = `Please create a comprehensive summary of our conversation so far. Structure it into these sections:

## 1. Technical Context
- Development environment, tools, frameworks, and configurations discussed
- Programming languages and key technologies used

## 2. Project Overview
- Project goals and main objectives
- Key features and functionality scope

## 3. Code Changes
- Files created, modified, or analyzed
- Important code patterns or structures implemented

## 4. Debugging & Issues
- Problems encountered and solutions applied
- Error messages and their resolutions

## 5. Current Status
- What we just completed
- Current state of the project

## 6. Pending Tasks
- Remaining work items
- Priorities for next steps

## 7. User Preferences
- Coding style preferences
- Communication preferences
- Any specific requirements or constraints

## 8. Key Decisions
- Important technical decisions made
- Reasoning behind major choices

Please be thorough and preserve all context needed to continue our work seamlessly.`;

/**
 * Check if automatic compression is needed
 * 
 * @param messages - Message list
 * @param contextLimit - Context limit
 * @returns Whether compression is needed
 */
export function shouldAutoCompact(
    messages: Message[],
    contextLimit: number = DEFAULT_CONTEXT_LIMIT
): boolean {
    // Need at least 3 messages to consider compression
    if (messages.length < 3) {
        return false;
    }
    
    const tokenCount = countTotalTokens(messages);
    const { isAboveAutoCompactThreshold } = calculateThresholds(
        tokenCount,
        contextLimit,
        AUTO_COMPACT_THRESHOLD_RATIO
    );
    
    return isAboveAutoCompactThreshold;
}

/**
 * Execute automatic compression
 * Generate conversation summary, clean history, keep summary
 * 
 * @param messages - Current message list
 * @param contextLimit - Context limit
 * @returns Compressed message list
 */
export async function executeAutoCompact(
    messages: Message[],
    contextLimit: number = DEFAULT_CONTEXT_LIMIT
): Promise<Message[]> {
    try {
        ui.printInfo('🔄 Context limit approaching, initiating automatic compression...');
        
        // 1. Generate summary request
        const summaryRequest: Anthropic.MessageParam = {
            role: "user",
            content: [{ type: "text", text: COMPRESSION_PROMPT }]
        };
        
        // 2. Call LLM to generate summary
        const summaryResponse: Anthropic.Message = await anthropic.messages.create({
            model: ANTHROPIC_MODEL,
            system: (
                `You are a helpful AI assistant tasked with creating comprehensive ` +
                `conversation summaries that preserve all essential context for continuing ` +
                `development work in the project at ${WORKDIR}.`
            ),
            messages: [...messages as Anthropic.MessageParam[], summaryRequest],
            max_tokens: 8000,
        });
        
        // 3. Extract summary text
        let summaryText = '';
        for (const block of summaryResponse.content) {
            if (block.type === 'text') {
                summaryText += block.text;
            }
        }
        
        if (!summaryText.trim()) {
            throw new Error('Failed to generate summary');
        }
        
        // 4. Build compressed message list
        const compactedMessages: Message[] = [
            {
                role: "user",
                content: [{
                    type: "text",
                    text: (
                        `Context automatically compressed due to token limit. ` +
                        `Essential information preserved below.`
                    )
                }]
            },
            {
                role: "assistant",
                content: [{ type: "text", text: summaryText }]
            }
        ];
        
        const oldCount = messages.length;
        const oldTokens = countTotalTokens(messages);
        const newTokens = countTotalTokens(compactedMessages);
        
        ui.printSuccess(
            `✅ Context compressed: ${oldCount} messages → ${compactedMessages.length} messages\n` +
            `   Token usage: ${oldTokens} → ${newTokens} (saved ${oldTokens - newTokens} tokens)`
        );
        
        return compactedMessages;
    } catch (error) {
        ui.printError('Failed to compress context', error);
        // If compression fails, return original messages
        return messages;
    }
}

/**
 * Execute manual compression
 * Similar to auto-compression, but with more explicit user feedback
 * 
 * @param messages - Current message list
 * @returns Compressed message list
 */
export async function executeManualCompact(messages: Message[]): Promise<Message[]> {
    if (messages.length === 0) {
        ui.printWarning('No conversation history to compress');
        return messages;
    }
    
    try {
        const oldCount = messages.length;
        const oldTokens = countTotalTokens(messages);
        
        ui.printInfo(`📊 Current conversation: ${oldCount} messages, ~${oldTokens} tokens`);
        ui.printInfo('🔄 Compressing conversation history...');
        
        // 1. Generate summary request
        const summaryRequest: Anthropic.MessageParam = {
            role: "user",
            content: [{ type: "text", text: COMPRESSION_PROMPT }]
        };
        
        // 2. Call LLM to generate summary
        const summaryResponse: Anthropic.Message = await anthropic.messages.create({
            model: ANTHROPIC_MODEL,
            system: (
                `You are a helpful AI assistant tasked with creating comprehensive ` +
                `conversation summaries that preserve all essential context for continuing ` +
                `development work in the project at ${WORKDIR}.`
            ),
            messages: [...messages as Anthropic.MessageParam[], summaryRequest],
            max_tokens: 8000,
        });
        
        // 3. Extract summary text
        let summaryText = '';
        for (const block of summaryResponse.content) {
            if (block.type === 'text') {
                summaryText += block.text;
            }
        }
        
        if (!summaryText.trim()) {
            throw new Error('Failed to generate summary');
        }
        
        // 4. Build compressed message list
        const compactedMessages: Message[] = [
            {
                role: "user",
                content: [{
                    type: "text",
                    text: (
                        `Context has been manually compressed using structured 8-section algorithm. ` +
                        `All essential information has been preserved for seamless continuation.`
                    )
                }]
            },
            {
                role: "assistant",
                content: [{ type: "text", text: summaryText }]
            }
        ];
        
        const newTokens = countTotalTokens(compactedMessages);
        
        ui.printSuccess(
            `✅ Context compressed successfully!\n` +
            `   Messages: ${oldCount} → ${compactedMessages.length}\n` +
            `   Tokens: ~${oldTokens} → ~${newTokens} (saved ~${oldTokens - newTokens} tokens)`
        );
        
        return compactedMessages;
    } catch (error) {
        ui.printError('Failed to compress context', error);
        throw error;
    }
}

/**
 * Context statistics interface
 */
export interface ContextStats {
    messageCount: number;
    tokenCount: number;
    percentage: number;
    percentUsed: number;
    isAboveWarningThreshold: boolean;
    isAboveAutoCompactThreshold: boolean;
    tokensRemaining: number;
    contextLimit: number;
    autoCompactThreshold: number;
}

/**
 * Get context usage statistics
 * 
 * @param messages - Message list
 * @param contextLimit - Context limit
 * @returns Statistics information object
 */
export function getContextStats(
    messages: Message[],
    contextLimit: number = DEFAULT_CONTEXT_LIMIT
): ContextStats {
    const tokenCount = countTotalTokens(messages);
    const thresholds = calculateThresholds(tokenCount, contextLimit, AUTO_COMPACT_THRESHOLD_RATIO);
    
    return {
        messageCount: messages.length,
        tokenCount,
        ...thresholds
    };
}


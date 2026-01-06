/**
 * Shared API helpers for Anthropic client
 * 
 * This module provides common utilities for making API calls,
 * including retry logic with exponential backoff.
 */

import Anthropic from '@anthropic-ai/sdk';
import { anthropic } from './anthropic-client';

/**
 * Options for API retry behavior
 */
export interface RetryOptions {
    /** Maximum number of retry attempts (default: 5) */
    maxRetries?: number;
    /** Base delay in milliseconds for exponential backoff (default: 1000) */
    baseDelay?: number;
    /** Whether to log retry attempts to console (default: true) */
    verbose?: boolean;
}

/**
 * Sleep for a specified duration
 * @param ms - Duration in milliseconds
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Rate limit error structure
 */
interface RateLimitError {
    status?: number;
    message?: string;
}

/**
 * Check if an error is a rate limit (429) error
 * @param error - Error to check
 * @returns True if it's a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
    const rateLimitError = error as RateLimitError;
    return Boolean(
        rateLimitError?.status === 429 ||
        rateLimitError?.message?.includes('429') ||
        rateLimitError?.message?.includes('Request limit exceeded')
    );
}

/**
 * Non-streaming message create parameters
 */
export type MessageCreateParamsNonStreaming = Anthropic.MessageCreateParamsNonStreaming;

/**
 * Call Anthropic API with automatic retry on rate limit errors
 * 
 * Uses exponential backoff with jitter to handle 429 rate limit errors.
 * 
 * @param params - Parameters to pass to anthropic.messages.create()
 * @param options - Retry options
 * @returns API response
 * @throws Error if max retries exceeded or non-rate-limit error occurs
 */
export async function callAnthropicWithRetry(
    params: MessageCreateParamsNonStreaming,
    options: RetryOptions = {}
): Promise<Anthropic.Message> {
    const {
        maxRetries = 5,
        baseDelay = 1000,
        verbose = true,
    } = options;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await anthropic.messages.create(params) as Anthropic.Message;
        } catch (error) {
            if (isRateLimitError(error) && attempt < maxRetries) {
                // Calculate exponential backoff delay with jitter
                const delay = baseDelay * Math.pow(2, attempt);
                const jitter = Math.random() * 1000; // Add jitter to avoid thundering herd
                const totalDelay = delay + jitter;

                if (verbose) {
                    console.log(
                        `\n⚠️  Rate limit exceeded (429). Retrying in ${(totalDelay / 1000).toFixed(1)}s ` +
                        `(attempt ${attempt + 1}/${maxRetries})...`
                    );
                }

                await sleep(totalDelay);
                continue;
            }

            // If not a rate limit error or exceeded max retries, throw the error
            throw error;
        }
    }

    throw new Error('Max retries exceeded for API call');
}


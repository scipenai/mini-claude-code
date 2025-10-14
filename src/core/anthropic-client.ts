/**
 * Shared Anthropic client instance
 * Used across agent and context compression modules
 */

import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL } from '../config/environment';

// Validate API key
if (!ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY not set. Please set the ANTHROPIC_API_KEY environment variable.");
    process.exit(1);
}

// Create shared Anthropic client instance
export const anthropic = new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
    baseURL: ANTHROPIC_BASE_URL
});


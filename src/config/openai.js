/**
 * OpenAI client configuration for LiteLLM integration
 * Handles the setup and initialization of the OpenAI client with custom Bonzai API settings
 */

import { OpenAI } from 'openai';

// Log API key configuration for debugging
console.log('=== API KEY CONFIGURATION ===');
console.log('API Key present:', !!process.env.OPENAI_API_KEY);
console.log('API Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
console.log('API Key prefix:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 8) + '...' : 'N/A');
console.log('Base URL:', process.env.OPENAI_BASE_URL || 'Using default from code');

/**
 * Initialize OpenAI client configured for Bonzai v2 API
 * Custom configuration to handle LiteLLM virtual keys (which may be shorter than standard OpenAI keys)
 */
export const openai = new OpenAI({
    baseURL: process.env.BONZAI_BASE_URL ?? "https://api-v2.bonzai.iodigital.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
    // Add default headers to ensure proper authentication
    defaultHeaders: {
        'User-Agent': 'ValidAIte-LiteLLM/1.0'
    },
    // Disable client-side validation that might reject shorter keys
    dangerouslyAllowBrowser: false
});

console.log('OpenAI client initialized successfully for LiteLLM virtual key');

/**
 * Configuration constants for OpenAI API calls
 * Optimized for maximum determinism and consistency
 */
export const OPENAI_CONFIG = {
    BASE_URL: "https://api-v2.bonzai.iodigital.com/v1",
    MODEL: "claude-3-7-sonnet",
    TEST_MODEL: "gpt-3.5-turbo",
    MAX_TOKENS: 2000,
    TEMPERATURE: 0.0, // Set to 0 for maximum determinism
    SEED: 42, // Fixed seed for reproducible results
    TOP_P: 1.0, // Disable nucleus sampling for consistency
    FREQUENCY_PENALTY: 0.0,
    PRESENCE_PENALTY: 0.0
};

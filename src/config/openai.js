/**
 * OpenAI client configuration for LiteLLM integration
 * Handles the setup and initialization of the OpenAI client with custom Bonzai API settings
 */

import { OpenAI } from 'openai';

if (process.env.NODE_ENV === 'development' && !process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not found in environment variables');
}

export const openai = new OpenAI({
    baseURL: "https://api-v2.bonzai.iodigital.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
    defaultHeaders: {
        'User-Agent': 'ValidAIte-LiteLLM/1.0'
    },
    dangerouslyAllowBrowser: false
});


export const openaiClient = openai;

export const OPENAI_CONFIG = {
    BASE_URL: "https://api-v2.bonzai.iodigital.com/v1",
    MODEL: "claude-4-5-sonnet",
    TEST_MODEL: "gpt-3.5-turbo",
    MAX_TOKENS: 2000,
    TEMPERATURE: 0.1
};

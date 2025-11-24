/**
 * API testing resolver
 * Handles API key configuration testing for LiteLLM integration
 */

import { openai, OPENAI_CONFIG } from '../config/openai.js';

/**
 * Test API key configuration for LiteLLM
 * Performs a simple API call to verify connectivity and authentication
 * @param {Object} req - Forge resolver request object
 * @returns {Object} Test result with success status and details
 */
export const testApiKeyConfiguration = async (req) => {
    console.log('=== API KEY TEST CALLED ===');
    console.log('Testing LiteLLM virtual key configuration...');
    
    try {
        // Log configuration details for debugging
        console.log('API Key present:', !!process.env.OPENAI_API_KEY);
        console.log('API Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
        console.log('Base URL configured:', OPENAI_CONFIG.BASE_URL);
        console.log('OpenAI client status:', openai ? 'Initialized' : 'Not initialized');
        
        // Test a simple API call to verify connectivity
        // For LiteLLM, we use a standard model name for testing
        const testCompletion = await openai.chat.completions.create({
            model: OPENAI_CONFIG.TEST_MODEL,
            messages: [
                {
                    role: "user",
                    content: "Say 'API key test successful' if you can read this message."
                }
            ],
            max_tokens: 50,
            temperature: 0
        });
        
        console.log('API test successful!');
        console.log('Response received:', !!testCompletion);
        
        return {
            success: true,
            message: 'LiteLLM virtual key configuration is working correctly',
            apiKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
            baseURL: `${OPENAI_CONFIG.BASE_URL}/chat/completions`,
            testResponse: testCompletion.choices[0].message.content
        };
        
    } catch (error) {
        console.error('API key test failed:', error.message);
        return {
            success: false,
            error: error.message,
            apiKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
            baseURL: `${OPENAI_CONFIG.BASE_URL}/chat/completions`
        };
    }
};

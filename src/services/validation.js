/**
 * Enhanced Excel Data Validation Service
 * Provides AI-powered validation with caching, error handling, and historical insights
 */

import { openaiClient, OPENAI_CONFIG } from '../config/openai.js';
import { 
    getCachedValidationResult, 
    cacheValidationResult, 
    checkFileContentChange 
} from './fileContentCache.js';

/**
 * Makes an OpenAI API call for validation
 * @param {string} prompt - The validation prompt
 * @returns {Object} OpenAI completion response
 */
export const callOpenAIValidation = async (prompt) => {
    try {
        const completion = await openaiClient.chat.completions.create({
            model: OPENAI_CONFIG.MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an expert data analyst. Analyze the provided Excel data and return a detailed validation report in JSON format."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: OPENAI_CONFIG.MAX_TOKENS,
            temperature: OPENAI_CONFIG.TEMPERATURE
        });

        return completion;
    } catch (error) {
        console.error('❌ OpenAI API call failed:', error.message);
        throw new Error(`OpenAI API error: ${error.message}`);
    }
};

/**
 * Parses and validates the OpenAI response
 * @param {string} responseContent - Raw response content from OpenAI
 * @returns {Object} Parsed validation result
 */
export const parseValidationResponse = (responseContent) => {
    try {
        let cleanedContent = responseContent.trim();
        
        // Handle markdown code blocks
        const jsonMatch = cleanedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            cleanedContent = jsonMatch[1];
        }

        const parsedResponse = JSON.parse(cleanedContent);
        
        // Validate required structure
        if (!parsedResponse.overallScore && parsedResponse.overallScore !== 0) {
            throw new Error('Missing overallScore in response');
        }
        
        return parsedResponse;
    } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError.message);
        console.error('Raw content:', cleanedContent);
        throw new Error(`Failed to parse validation response: ${parseError.message}`);
    }
};

/**
 * Main Excel data validation function with caching and error handling
 * @param {Array} excelData - Array of Excel row objects
 * @param {string} validationRules - Validation rules to apply
 * @returns {Object} Validation result with success status and data
 */
export const validateExcelData = async (excelData, validationRules) => {
    try {
        // Check for cached result first
        const cacheCheck = await checkFileContentChange(excelData, 'validation_request');
        
        if (cacheCheck.cachedResult) {
            return {
                success: true,
                validation: cacheCheck.cachedResult.validationResult.validation,
                historicalInsights: cacheCheck.cachedResult.validationResult.historicalInsights,
                fromCache: true,
                cacheMetadata: cacheCheck.cachedResult.metadata
            };
        }

        // Create validation prompt
        const prompt = `
Please analyze this Excel data and provide a comprehensive validation report.

VALIDATION RULES: ${validationRules}

EXCEL DATA (${excelData.length} rows):
${JSON.stringify(excelData.slice(0, 100), null, 2)}

Please return a JSON response with this exact structure:
{
    "overallScore": <number 0-100>,
    "summary": "<brief summary>",
    "issues": [
        {
            "type": "<issue type>",
            "severity": "<low|medium|high>",
            "description": "<description>",
            "affectedRows": [<row numbers>],
            "suggestion": "<how to fix>"
        }
    ],
    "dataQuality": {
        "completeness": <0-100>,
        "consistency": <0-100>,
        "accuracy": <0-100>
    },
    "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}`;

        const completion = await callOpenAIValidation(prompt);
        const responseContent = completion.choices[0].message.content;
        const validationResult = parseValidationResponse(responseContent);

        // Add historical insights (mock data for now)
        const historicalInsights = {
            totalHistoricalTickets: Math.floor(Math.random() * 1000) + 100,
            averageResolutionTime: `${Math.floor(Math.random() * 48) + 1} hours`,
            commonIssuePatterns: [
                "Missing required fields",
                "Data format inconsistencies",
                "Duplicate entries"
            ]
        };

        const result = {
            success: true,
            validation: validationResult,
            historicalInsights,
            fromCache: false
        };

        // Cache the result
        if (cacheCheck.contentHash) {
            await cacheValidationResult(cacheCheck.contentHash, result, {
                validationType: 'standard',
                validationRules,
                timestamp: new Date().toISOString()
            });
        }

        return result;

    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        return {
            success: false,
            error: error.message,
            validation: null,
            historicalInsights: null
        };
    }
};

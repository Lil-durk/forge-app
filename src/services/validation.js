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
import { createLogger } from '../utils/logger.js';
import { validateExcelData as validateExcelDataInput, validateValidationRules, sanitizeString } from '../utils/inputValidation.js';
import { API_CONFIG, VALIDATION_CONFIG, ERROR_MESSAGES } from '../config/constants.js';
import { 
    AppError, 
    ERROR_CODES, 
    handleError, 
    createErrorResponse, 
    createSuccessResponse,
    validateRequiredParams 
} from '../utils/errorHandler.js';

const log = createLogger('ValidationService');

/**
 * Makes an OpenAI API call for validation with timeout and proper error handling
 * @param {string} prompt - The validation prompt
 * @returns {Object} OpenAI completion response
 */
export const callOpenAIValidation = async (prompt) => {
    const sanitizedPrompt = sanitizeString(prompt, 10000); // Limit prompt size
    
    log.debug('callOpenAIValidation', 'Starting OpenAI API call', { 
        promptLength: sanitizedPrompt.length,
        model: OPENAI_CONFIG.MODEL 
    });

    try {
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), API_CONFIG.REQUEST_TIMEOUT);
        });

        // Create API call promise
        const apiCallPromise = openaiClient.chat.completions.create({
            model: OPENAI_CONFIG.MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an expert data analyst. Analyze the provided Excel data and return a detailed validation report in JSON format."
                },
                {
                    role: "user",
                    content: sanitizedPrompt
                }
            ],
            max_tokens: OPENAI_CONFIG.MAX_TOKENS,
            temperature: OPENAI_CONFIG.TEMPERATURE
        });

        // Race between timeout and API call
        const completion = await Promise.race([apiCallPromise, timeoutPromise]);
        
        log.debug('callOpenAIValidation', 'OpenAI API call completed successfully', {
            tokensUsed: completion.usage?.total_tokens || 'unknown'
        });

        return completion;
    } catch (error) {
        log.error('callOpenAIValidation', 'OpenAI API call failed', error);
        throw new Error(`OpenAI API error: ${error.message}`);
    }
};

/**
 * Parses and validates the OpenAI response
 * @param {string} responseContent - Raw response content from OpenAI
 * @returns {Object} Parsed validation result
 */
export const parseValidationResponse = (responseContent) => {
    log.debug('parseValidationResponse', 'Parsing OpenAI response', { 
        contentLength: responseContent?.length || 0 
    });

    try {
        let cleanedContent = responseContent.trim();
        
        // Handle markdown code blocks
        const jsonMatch = cleanedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            cleanedContent = jsonMatch[1];
            log.debug('parseValidationResponse', 'Extracted JSON from code block');
        }

        const parsedResponse = JSON.parse(cleanedContent);
        
        // Validate required structure
        if (!parsedResponse.overallScore && parsedResponse.overallScore !== 0) {
            log.error('parseValidationResponse', 'Missing overallScore in response', { 
                responseKeys: Object.keys(parsedResponse)
            });
            throw new Error('Missing overallScore in response');
        }
        
        log.debug('parseValidationResponse', 'Successfully parsed validation response', {
            overallScore: parsedResponse.overallScore,
            issuesCount: parsedResponse.issues?.length || 0
        });
        
        return parsedResponse;
    } catch (parseError) {
        log.error('parseValidationResponse', 'JSON parsing failed', parseError, {
            rawContentPreview: responseContent?.substring(0, 200) + '...'
        });
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
    log.info('validateExcelData', 'Starting Excel data validation', {
        dataRows: excelData?.length || 0,
        hasRules: !!validationRules
    });

    try {
        // Input validation
        validateExcelDataInput(excelData, 'Excel validation request');
        
        if (validationRules && typeof validationRules === 'string') {
            const sanitizedRules = sanitizeString(validationRules, 1000);
            if (sanitizedRules !== validationRules) {
                log.warn('validateExcelData', 'Validation rules were sanitized', {
                    originalLength: validationRules.length,
                    sanitizedLength: sanitizedRules.length
                });
            }
            validationRules = sanitizedRules;
        }

        // Check for cached result first
        const cacheCheck = await checkFileContentChange(excelData, 'validation_request');
        
        if (cacheCheck.cachedResult) {
            log.info('validateExcelData', 'Using cached validation result', {
                cacheAge: cacheCheck.cachedResult.metadata?.timestamp
            });
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

VALIDATION RULES: ${validationRules || 'General data quality validation'}

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
        "consistency": <0-100>,
        "accuracy": <0-100>
    },
    "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}`;

        const completion = await callOpenAIValidation(prompt);
        const responseContent = completion.choices[0].message.content;
        const validationResult = parseValidationResponse(responseContent);

        // Add historical insights if available
        let historicalInsights = null;
        if (VALIDATION_CONFIG.HISTORICAL_INSIGHTS.ENABLE_MOCK) {
            historicalInsights = {
                totalHistoricalTickets: Math.floor(Math.random() * 1000) + 100,
                averageResolutionTime: `${Math.floor(Math.random() * 48) + 1} hours`,
                commonIssuePatterns: [
                    "Data format inconsistencies",
                    "Duplicate entries",
                    "Invalid data types"
                ]
            };
        } else if (VALIDATION_CONFIG.HISTORICAL_INSIGHTS.API_ENDPOINT) {
            // TODO: Implement real historical insights API call
            log.info('validateExcelData', 'Historical insights API not yet implemented');
        }

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
            log.debug('validateExcelData', 'Validation result cached successfully');
        }

        log.info('validateExcelData', 'Validation completed successfully', {
            overallScore: validationResult.overallScore,
            issuesFound: validationResult.issues?.length || 0
        });

        return result;

    } catch (error) {
        const processedError = handleError(error, 'validateExcelData', {
            dataRows: excelData?.length || 0,
            hasRules: !!validationRules
        });
        
        return createErrorResponse(
            processedError.message,
            processedError.code,
            {
                validation: null,
                historicalInsights: null
            }
        );
    }
};

/**
 * Custom Validator
 * Handles AI-powered validation using custom requirements
 */

import { openaiClient, OPENAI_CONFIG } from '../../config/openai.js';
import { parseValidationResponse } from '../ai/responseParser.js';

/**
 * Validates data using custom requirements
 * @param {Array} excelData - Excel data to validate
 * @param {Array} requirements - Custom validation requirements
 * @param {string} useCase - Use case description
 * @returns {Object} Validation result
 */
export const validateWithCustomRequirements = async (excelData, requirements, useCase) => {
  try {
    if (!openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const prompt = `
Validate this Excel data against the custom requirements.

USE CASE: ${useCase}
CUSTOM REQUIREMENTS: ${JSON.stringify(requirements, null, 2)}
EXCEL DATA: ${JSON.stringify(excelData.slice(0, 50), null, 2)}

Perform thorough validation and return detailed results.

Return JSON with this structure:
{
  "overallScore": <0-100>,
  "summary": "Validation summary",
  "requirementResults": [
    {
      "requirement": "Requirement description",
      "passed": true/false,
      "score": <0-100>,
      "issues": ["Issue 1", "Issue 2"],
      "affectedRows": [1, 2, 3]
    }
  ],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    const completion = await openaiClient.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
      messages: [
        {
          role: "system",
          content: "You are a data validation expert. Validate data against specific requirements."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: OPENAI_CONFIG.MAX_TOKENS,
      temperature: OPENAI_CONFIG.TEMPERATURE
    });

    const result = parseValidationResponse(completion.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Error validating with custom requirements:', error);
    return {
      success: false,
      error: error.message,
      overallScore: 0,
      summary: 'Validation failed',
      requirementResults: [],
      recommendations: []
    };
  }
};

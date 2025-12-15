/**
 * Requirements Generator
 * Handles AI-powered generation of custom validation requirements
 */

import { openaiClient, OPENAI_CONFIG } from '../../config/openai.js';
import { parseRequirementsResponse } from '../ai/responseParser.js';

/**
 * Generates custom validation requirements based on data purpose
 * @param {Object} purpose - Data purpose analysis result
 * @param {Array} excelData - Excel data
 * @param {string} fileName - File name
 * @param {Array} baseRequirements - Base validation requirements
 * @returns {Object} Generated custom requirements
 */
export const generateCustomRequirements = async (purpose, excelData, fileName, baseRequirements) => {
  try {
    if (!openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const prompt = `
Based on the data analysis, generate specific validation requirements.

DATA PURPOSE: ${purpose.purpose}
DATA TYPE: ${purpose.dataType}
USE CASE: ${purpose.useCase}
IDENTIFIED PATTERNS: ${purpose.patterns.join(', ')}
CONCERNS: ${purpose.concerns.join(', ')}

BASE REQUIREMENTS: ${JSON.stringify(baseRequirements, null, 2)}
SAMPLE DATA: ${JSON.stringify(excelData.slice(0, 5), null, 2)}

Generate specific, actionable validation requirements tailored to this data type and use case.

Return JSON with this structure:
{
  "requirements": [
    {
      "category": "Category name",
      "rule": "Specific validation rule",
      "priority": "high|medium|low",
      "description": "Why this rule is important"
    }
  ],
  "customChecks": [
    "Custom check 1",
    "Custom check 2"
  ],
  "businessRules": [
    "Business rule 1",
    "Business rule 2"
  ]
}`;

    const completion = await openaiClient.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
      messages: [
        {
          role: "system",
          content: "You are a data validation expert. Create specific, actionable validation requirements."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: OPENAI_CONFIG.MAX_TOKENS,
      temperature: OPENAI_CONFIG.TEMPERATURE
    });

    const result = parseRequirementsResponse(completion.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Error generating custom requirements:', error);
    return {
      success: false,
      error: error.message,
      requirements: baseRequirements || [],
      customChecks: [],
      businessRules: []
    };
  }
};

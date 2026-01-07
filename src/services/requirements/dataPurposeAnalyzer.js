/**
 * Data Purpose Analyzer
 * Handles AI-powered analysis of Excel data purpose and context
 */

import { openaiClient, OPENAI_CONFIG } from '../../config/openai.js';
import { parseDataPurposeResponse } from '../ai/responseParser.js';
import aiCache from '../ai/aiCache.js';

/**
 * Analyzes the purpose and context of uploaded Excel data
 * @param {Array} excelData - Excel data to analyze
 * @param {string} fileName - Name of the uploaded file
 * @returns {Object} Analysis result with purpose and context
 */
export const analyzeDataPurpose = async (excelData, fileName) => {
  try {
    if (!openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    // Check cache first
    const cacheContext = { fileName, operation: 'dataPurposeAnalysis' };
    const cachedResult = aiCache.get('dataPurpose', excelData, cacheContext);
    if (cachedResult) {
      return cachedResult;
    }

    const prompt = `
Analyze this Excel data and determine its likely business purpose and context.

FILE NAME: ${fileName}
DATA SAMPLE (first 10 rows): ${JSON.stringify(excelData.slice(0, 10), null, 2)}
TOTAL ROWS: ${excelData.length}
COLUMNS: ${excelData.length > 0 ? Object.keys(excelData[0]).join(', ') : 'None'}

Please identify:
1. What type of business data this appears to be
2. The likely use case or purpose
3. Key data patterns you observe
4. Potential data quality concerns

Return a JSON response with this structure:
{
  "purpose": "Brief description of data purpose",
  "dataType": "Type of business data",
  "useCase": "Likely use case",
  "patterns": ["Pattern 1", "Pattern 2"],
  "concerns": ["Concern 1", "Concern 2"]
}`;

    const completion = await openaiClient.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
      messages: [
        {
          role: "system",
          content: "You are a business data analyst expert. Analyze data patterns and business context."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: OPENAI_CONFIG.MAX_TOKENS,
      temperature: OPENAI_CONFIG.TEMPERATURE
    });

    const result = parseDataPurposeResponse(completion.choices[0].message.content);
    
    // Cache the successful result
    if (result.success !== false) {
      aiCache.set('dataPurpose', excelData, cacheContext, result);
    }
    
    return result;
  } catch (error) {
    console.error('Error analyzing data purpose:', error);
    return {
      success: false,
      error: error.message,
      purpose: 'Unknown',
      dataType: 'Unknown',
      useCase: 'General data validation',
      patterns: [],
      concerns: []
    };
  }
};

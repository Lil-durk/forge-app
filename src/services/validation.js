import { openai, OPENAI_CONFIG } from '../config/openai.js';

export const generateValidationPrompt = (dataPreview, headers, validationRules) => {
    return `
You are an Excel data validator. Please analyze the following Excel data and validate it according to these rules:

Headers: ${headers.join(', ')}

Sample Data (first 10 rows):
${JSON.stringify(dataPreview, null, 2)}

Validation Rules:
${validationRules || 'Standard data validation - check for missing values, data type consistency, and format issues'}

Please provide a validation report in the following JSON format:
{
  "isValid": boolean,
  "overallScore": number (0-100),
  "issues": [
    {
      "type": "error" | "warning" | "info",
      "field": "field_name",
      "row": row_number,
      "message": "description of the issue",
      "suggestion": "how to fix it"
    }
  ],
  "summary": "brief summary of validation results",
  "recommendations": ["list of recommendations for data improvement"]
}

Focus on:
1. Missing or empty required fields
2. Data type inconsistencies
3. Format issues (dates, emails, phone numbers, etc.)
4. Duplicate entries
5. Outliers or suspicious values
6. Data completeness and quality
`;
};

/**
 * Call OpenAI API for data validation
 * @param {string} prompt - Validation prompt
 * @returns {Object} OpenAI completion response
 */
export const callOpenAIValidation = async (prompt) => {
    console.log('Making OpenAI API call...');
    console.log('OpenAI client status:', openai ? 'Available' : 'Not available');
    console.log('Request details:', {
        model: OPENAI_CONFIG.MODEL,
        messageCount: 2,
        temperature: OPENAI_CONFIG.TEMPERATURE,
        max_tokens: OPENAI_CONFIG.MAX_TOKENS
    });
    
    const completion = await openai.chat.completions.create({
        model: OPENAI_CONFIG.MODEL,
        messages: [
            {
                role: "system",
                content: "You are a professional data validator. Always respond with valid JSON format."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: OPENAI_CONFIG.TEMPERATURE,
        max_tokens: OPENAI_CONFIG.MAX_TOKENS
    });
    
    console.log('OpenAI API call successful');
    console.log('Response received:', !!completion);
    
    return completion;
};

/**
 * Parse and clean OpenAI response
 * @param {string} responseContent - Raw response from OpenAI
 * @returns {Object} Parsed validation result
 */
export const parseValidationResponse = (responseContent) => {
    console.log('Raw OpenAI response:', responseContent);
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = responseContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
        console.log('Found JSON in markdown code block, extracting...');
        responseContent = jsonMatch[1];
    }
    
    // Clean up any remaining markdown artifacts
    responseContent = responseContent.trim();
    if (responseContent.startsWith('```json')) {
        responseContent = responseContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (responseContent.startsWith('```')) {
        responseContent = responseContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('Cleaned response for JSON parsing:', responseContent.substring(0, 200) + '...');
    
    return JSON.parse(responseContent);
};

/**
 * Validate Excel data using OpenAI
 * @param {Array} excelData - Excel data array
 * @param {string} validationRules - Custom validation rules
 * @returns {Object} Validation result with success status and data
 */
export const validateExcelData = async (excelData, validationRules) => {
    console.log('validateExcelData called');
    
    if (!excelData || !Array.isArray(excelData) || excelData.length === 0) {
        return {
            success: false,
            error: 'No Excel data provided or data is empty'
        };
    }

    // Prepare the data for OpenAI validation
    const dataPreview = excelData.slice(0, 10); // Send first 10 rows for validation
    const headers = Object.keys(excelData[0] || {});
    
    const prompt = generateValidationPrompt(dataPreview, headers, validationRules);

    try {
        const completion = await callOpenAIValidation(prompt);
        const validationResult = parseValidationResponse(completion.choices[0].message.content);
        
        return {
            success: true,
            validation: validationResult,
            dataStats: {
                totalRows: excelData.length,
                totalColumns: headers.length,
                headers: headers
            }
        };

    } catch (error) {
        console.error('validateExcelData error:', error.message);
        return {
            success: false,
            error: error.message || 'Failed to validate Excel data'
        };
    }
};

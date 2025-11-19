import Resolver from '@forge/resolver';
import OpenAI from 'openai';

const resolver = new Resolver();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Validate Excel data using OpenAI
resolver.define('validateExcelData', async (req) => {
    console.log('validateExcelData called with:', req);
    
    try {
        const { excelData, validationRules } = req.payload;
        
        if (!excelData || !Array.isArray(excelData) || excelData.length === 0) {
            return {
                success: false,
                error: 'No Excel data provided or data is empty'
            };
        }

        // Prepare the data for OpenAI validation
        const dataPreview = excelData.slice(0, 10); // Send first 10 rows for validation
        const headers = Object.keys(excelData[0] || {});
        
        const prompt = `
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

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
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
            temperature: 0.1,
            max_tokens: 2000
        });

        const validationResult = JSON.parse(completion.choices[0].message.content);
        
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
        console.error('Error validating Excel data:', error);
        return {
            success: false,
            error: error.message || 'Failed to validate Excel data'
        };
    }
});

export const handler = resolver.getDefinitions();

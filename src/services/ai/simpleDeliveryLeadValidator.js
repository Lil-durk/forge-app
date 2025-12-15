/**
 * Simple Delivery Lead Validator
 * Provides AI-powered validation specifically for delivery lead data
 */

import { openaiClient, OPENAI_CONFIG } from '../../config/openai.js';

/**
 * Validates delivery lead data using AI
 * @param {Array} excelData - Excel data to validate
 * @param {Object} pageContext - Page context information
 * @returns {Object} Validation result
 */
export const validateDeliveryLead = async (excelData, pageContext) => {
  try {
    if (!excelData || !Array.isArray(excelData) || excelData.length === 0) {
      return {
        success: false,
        error: 'No valid Excel data provided for delivery lead validation'
      };
    }

    // Create focused prompt for delivery lead validation
    const prompt = `
You are an expert delivery lead validator. Analyze this Excel data for delivery lead accuracy and completeness.

PAGE CONTEXT: ${JSON.stringify(pageContext, null, 2)}
EXCEL DATA (${excelData.length} rows): ${JSON.stringify(excelData.slice(0, 50), null, 2)}

Focus on:
1. Delivery lead time accuracy
2. Data completeness for delivery estimates
3. Consistency across delivery timeframes
4. Realistic delivery expectations

Return JSON with this structure:
{
  "overallScore": <0-100>,
  "deliveryLeadAnalysis": {
    "averageLeadTime": "<calculated average>",
    "leadTimeConsistency": "<high|medium|low>",
    "unrealisticEstimates": [<list of concerning entries>]
  },
  "issues": [
    {
      "type": "delivery_lead_issue",
      "severity": "<low|medium|high>",
      "description": "<issue description>",
      "affectedRows": [<row numbers>],
      "suggestion": "<recommendation>"
    }
  ],
  "recommendations": ["<specific delivery lead recommendations>"]
}`;

    const completion = await openaiClient.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
      messages: [
        {
          role: "system",
          content: "You are a delivery lead validation expert. Analyze delivery timeframes and provide actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: OPENAI_CONFIG.MAX_TOKENS,
      temperature: OPENAI_CONFIG.TEMPERATURE
    });

    const responseContent = completion.choices[0].message.content;

    // Parse the response
    let parsedResponse;
    try {
      let cleanedContent = responseContent.trim();
      
      // Handle markdown code blocks
      const jsonMatch = cleanedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[1];
      }
      
      parsedResponse = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('❌ Failed to parse delivery lead response:', parseError);
      return {
        success: false,
        error: 'Failed to parse AI response for delivery lead validation'
      };
    }

    return {
      success: true,
      validation: parsedResponse,
      validationType: 'delivery_lead',
      dataRowCount: excelData.length,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Simple Delivery Lead validation error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error in delivery lead validation'
    };
  }
};

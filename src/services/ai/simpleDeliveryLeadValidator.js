/**
 * Simple Delivery Lead Validation Service
 * Single-step validation without separate context analysis to avoid timeouts
 */

import { openai, OPENAI_CONFIG } from '../../config/openai.js';

/**
 * Build simplified delivery lead validation prompt
 */
function buildSimpleDeliveryLeadPrompt(pageContext, excelData) {
  const sampleData = excelData.slice(0, 5);
  const headers = Object.keys(excelData[0] || {});
  
  return `
You are a senior Delivery Lead with extensive experience across various business processes and IT operations. 

CONTEXT INFORMATION:
- Request Type: ${pageContext.requestType?.name || 'Unknown'}
- Request Description: ${pageContext.requestType?.description || 'No description available'}
- Service Desk ID: ${pageContext.requestType?.serviceDeskId || 'Unknown'}
- Module Key: ${pageContext.moduleKey || 'Unknown'}

EXCEL DATA TO REVIEW:
- Headers: ${headers.join(', ')}
- Total Records: ${excelData.length}
- Sample Data:
${JSON.stringify(sampleData, null, 2)}

As a Delivery Lead, analyze this submission and determine:
1. What type of business process this represents based on the context
2. What validation criteria should apply for this type of request
3. Whether you would approve this submission

Provide your assessment in JSON format:
{
  "processType": "what type of business process this is",
  "approvalDecision": "APPROVED" | "REJECTED" | "NEEDS_REVISION",
  "confidenceScore": number (0-100),
  "executiveSummary": "Brief summary of your decision and reasoning",
  "contextAnalysis": {
    "businessGoals": ["identified business objectives"],
    "keyStakeholders": ["relevant stakeholders"],
    "riskFactors": ["potential risks"],
    "complianceRequirements": ["regulatory requirements"]
  },
  "detailedAssessment": {
    "businessAlignment": {
      "score": number (0-100),
      "assessment": "how well this aligns with business goals"
    },
    "dataQuality": {
      "completeness": number (0-100),
      "accuracy": number (0-100),
      "consistency": number (0-100),
      "overallQuality": number (0-100)
    },
    "riskAssessment": {
      "level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "identifiedRisks": ["specific risks identified"],
      "mitigationRequired": ["mitigation strategies"]
    },
    "complianceStatus": {
      "compliant": boolean,
      "violations": ["any violations found"],
      "recommendations": ["compliance recommendations"]
    }
  },
  "criticalIssues": [
    {
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "category": "BUSINESS" | "DATA" | "COMPLIANCE" | "RISK" | "PROCESS",
      "description": "what the issue is",
      "impact": "business impact",
      "recommendation": "how to fix it"
    }
  ],
  "deliveryLeadRecommendations": [
    "specific actionable recommendations"
  ],
  "nextSteps": [
    "what needs to happen next"
  ],
  "approvalConditions": [
    "conditions for approval if NEEDS_REVISION"
  ]
}

Use your professional judgment and experience. Think like a real delivery lead who is accountable for successful outcomes and efficient resource utilization.
`;
}

/**
 * Perform simple delivery lead validation (single API call)
 */
export async function performSimpleDeliveryLeadValidation(pageContext, excelData) {
  try {
    console.log('🎯 ValidAIte - Starting Simple Delivery Lead validation');
    console.log('📋 Page Context:', pageContext);
    console.log('📊 Excel Data rows:', excelData?.length);
    
    if (!excelData || !Array.isArray(excelData) || excelData.length === 0) {
      return {
        success: false,
        error: 'No Excel data provided for delivery lead review'
      };
    }

    const prompt = buildSimpleDeliveryLeadPrompt(pageContext, excelData);

    console.log('🤖 Making single OpenAI API call for delivery lead validation...');
    
    const completion = await openai.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
      messages: [
        {
          role: "system",
          content: "You are a senior Delivery Lead with 15+ years of experience across various industries and business processes. You have excellent judgment, strong business acumen, and are known for making sound decisions that balance business needs, risk management, and operational efficiency. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for consistent business decisions
      max_tokens: OPENAI_CONFIG.MAX_TOKENS
    });

    console.log('✅ OpenAI API call successful for delivery lead validation');

    const responseContent = completion.choices[0].message.content;
    console.log('📝 Raw delivery lead response:', responseContent.substring(0, 200) + '...');

    // Parse the JSON response
    let validationResult;
    try {
      // Clean up the response if it's wrapped in markdown
      let cleanedResponse = responseContent.trim();
      const jsonMatch = cleanedResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[1];
      }
      
      validationResult = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse delivery lead response:', parseError);
      return {
        success: false,
        error: 'Failed to parse delivery lead validation response',
        rawResponse: responseContent
      };
    }

    // Add metadata to the result
    validationResult.metadata = {
      evaluationTimestamp: new Date().toISOString(),
      dataRowsEvaluated: excelData.length,
      pageContext: {
        requestTypeId: pageContext.requestType?.id,
        requestTypeName: pageContext.requestType?.name,
        serviceDeskId: pageContext.requestType?.serviceDeskId
      }
    };

    return {
      success: true,
      result: {
        deliveryLeadValidation: validationResult,
        contextAnalysis: validationResult.contextAnalysis // Embedded in the main result
      }
    };

  } catch (error) {
    console.error('❌ Simple Delivery Lead validation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to perform delivery lead validation'
    };
  }
}

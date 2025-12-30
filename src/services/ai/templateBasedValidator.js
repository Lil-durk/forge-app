/**
 * Template-Based Validation Service
 * Compares uploaded Excel files against Confluence templates and validates changed fields
 */

import { openaiClient, OPENAI_CONFIG } from '../../config/openai.js';
import { getTemplateByRequestType } from '../confluence/templateService.js';
import { 
    getCachedValidationResult, 
    cacheValidationResult, 
    checkFileContentChange 
} from '../fileContentCache.js';

/**
 * Compares uploaded Excel data with the default template
 * Identifies which fields have been modified/filled in
 * @param {Array} uploadedData - The uploaded Excel data
 * @param {Object} template - The template structure from Confluence
 * @returns {Object} Comparison result with changed fields
 */
export const compareWithTemplate = (uploadedData, template) => {
    console.log('🔍 ValidAIte - Comparing uploaded file with template...');
    
    const uploadedHeaders = Object.keys(uploadedData[0] || {});
    const templateHeaders = template.structure?.headers || template.structure?.fields || [];
    
    // Identify structural differences
    const addedFields = uploadedHeaders.filter(h => !templateHeaders.includes(h));
    const missingFields = templateHeaders.filter(h => !uploadedHeaders.includes(h));
    const commonFields = uploadedHeaders.filter(h => templateHeaders.includes(h));
    
    // Identify fields with data (changed from empty template)
    const changedFields = [];
    const fieldDataAnalysis = {};
    
    commonFields.forEach(field => {
        const fieldData = uploadedData.map(row => row[field]).filter(val => val !== null && val !== undefined && val !== '');
        
        if (fieldData.length > 0) {
            changedFields.push(field);
            fieldDataAnalysis[field] = {
                totalRows: uploadedData.length,
                filledRows: fieldData.length,
                emptyRows: uploadedData.length - fieldData.length,
                fillRate: ((fieldData.length / uploadedData.length) * 100).toFixed(2) + '%',
                sampleValues: fieldData.slice(0, 3),
                dataTypes: [...new Set(fieldData.map(v => typeof v))]
            };
        }
    });
    
    console.log(`✅ ValidAIte - Comparison complete: ${changedFields.length} fields modified`);
    
    return {
        structuralChanges: {
            addedFields,
            missingFields,
            commonFields,
            totalTemplateFields: templateHeaders.length,
            totalUploadedFields: uploadedHeaders.length
        },
        changedFields,
        fieldDataAnalysis,
        comparisonSummary: {
            fieldsAdded: addedFields.length,
            fieldsMissing: missingFields.length,
            fieldsModified: changedFields.length,
            structureMatch: addedFields.length === 0 && missingFields.length === 0
        }
    };
};

/**
 * Validates uploaded Excel file using template-based approach
 * @param {Array} excelData - Uploaded Excel data
 * @param {string} requestTypeId - Jira request type ID
 * @param {string} requirementsList - Requirements to validate against
 * @returns {Object} Validation result
 */
export const validateWithTemplate = async (excelData, requestTypeId, requirementsList) => {
    try {
        console.log(`🚀 ValidAIte - Starting template-based validation for request type: ${requestTypeId}`);
        
        // Check cache first
        const cacheCheck = await checkFileContentChange(excelData, `template_validation_${requestTypeId}`);
        
        if (cacheCheck.cachedResult) {
            console.log('✅ ValidAIte - Returning cached validation result');
            return {
                success: true,
                ...cacheCheck.cachedResult.validationResult,
                fromCache: true,
                cacheMetadata: cacheCheck.cachedResult.metadata
            };
        }
        
        // Step 1: Fetch the template from Confluence
        console.log('📥 ValidAIte - Fetching template from Confluence...');
        const templateResult = await getTemplateByRequestType(requestTypeId);
        
        if (!templateResult.success) {
            throw new Error(`Failed to fetch template: ${templateResult.error}`);
        }
        
        const template = templateResult.template;
        console.log('✅ ValidAIte - Template fetched successfully');
        
        // Step 2: Compare uploaded file with template
        const comparison = compareWithTemplate(excelData, template);
        
        // Step 3: Build AI prompt focusing on changed fields
        const validationPrompt = buildTemplateValidationPrompt(
            excelData,
            template,
            comparison,
            requirementsList
        );
        
        // Step 4: Call OpenAI for validation
        console.log('🤖 ValidAIte - Calling AI for validation...');
        const completion = await openaiClient.chat.completions.create({
            model: OPENAI_CONFIG.MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an expert data validation analyst. You compare uploaded Excel files against standard templates and validate that filled-in fields meet business requirements."
                },
                {
                    role: "user",
                    content: validationPrompt
                }
            ],
            max_tokens: OPENAI_CONFIG.MAX_TOKENS,
            temperature: OPENAI_CONFIG.TEMPERATURE
        });
        
        const responseContent = completion.choices[0].message.content;
        const validationResult = parseValidationResponse(responseContent);
        
        // Step 5: Enhance result with template comparison data
        const enhancedResult = {
            success: true,
            validation: validationResult,
            templateComparison: comparison,
            templateMetadata: templateResult.metadata,
            fromCache: false,
            validationApproach: 'template-based'
        };
        
        // Cache the result
        if (cacheCheck.contentHash) {
            await cacheValidationResult(cacheCheck.contentHash, enhancedResult, {
                validationType: 'template-based',
                requestTypeId,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log('✅ ValidAIte - Template-based validation complete');
        return enhancedResult;
        
    } catch (error) {
        console.error('❌ ValidAIte - Template-based validation failed:', error.message);
        return {
            success: false,
            error: error.message,
            validation: null,
            templateComparison: null
        };
    }
};

/**
 * Builds AI validation prompt focused on template comparison
 * @param {Array} excelData - Uploaded Excel data
 * @param {Object} template - Template structure
 * @param {Object} comparison - Comparison result
 * @param {string} requirementsList - Requirements to validate
 * @returns {string} AI prompt
 */
const buildTemplateValidationPrompt = (excelData, template, comparison, requirementsList) => {
    const { changedFields, fieldDataAnalysis, structuralChanges, comparisonSummary } = comparison;
    
    return `
You are validating an uploaded Excel file against a standard template and business requirements.

## TEMPLATE INFORMATION
Template Type: ${template.type}
Total Template Fields: ${structuralChanges.totalTemplateFields}
Template Fields: ${structuralChanges.commonFields.join(', ')}

## STRUCTURAL COMPARISON
✅ Fields Matching Template: ${structuralChanges.commonFields.length}
➕ Extra Fields Added: ${structuralChanges.addedFields.length > 0 ? structuralChanges.addedFields.join(', ') : 'None'}
❌ Template Fields Missing: ${structuralChanges.fieldsMissing.length > 0 ? structuralChanges.fieldsMissing.join(', ') : 'None'}
Structure Match: ${comparisonSummary.structureMatch ? 'YES' : 'NO'}

## CHANGED FIELDS (Fields filled in from empty template)
The following ${changedFields.length} fields have been modified from the empty template:

${changedFields.map(field => `
### ${field}
- Fill Rate: ${fieldDataAnalysis[field].fillRate}
- Filled Rows: ${fieldDataAnalysis[field].filledRows}/${fieldDataAnalysis[field].totalRows}
- Data Types: ${fieldDataAnalysis[field].dataTypes.join(', ')}
- Sample Values: ${JSON.stringify(fieldDataAnalysis[field].sampleValues)}
`).join('\n')}

## BUSINESS REQUIREMENTS TO VALIDATE
${requirementsList}

## UPLOADED DATA SAMPLE
${JSON.stringify(excelData.slice(0, 5), null, 2)}
... (${excelData.length} total rows)

## YOUR TASK
1. **Validate Structure**: Check if the file structure matches the template (flag any missing or extra fields)
2. **Validate Changed Fields**: For each field that was filled in, validate against the requirements list
3. **Data Quality**: Assess completeness, consistency, and accuracy of the filled-in data
4. **Business Rules**: Check if the data meets business requirements

Focus your validation primarily on the ${changedFields.length} fields that were modified from the template.

## REQUIRED JSON RESPONSE FORMAT
{
    "overallScore": <number 0-100>,
    "summary": "<brief summary of validation>",
    "templateMatch": {
        "structureValid": <boolean>,
        "missingRequiredFields": ["<field1>", "<field2>"],
        "unexpectedFields": ["<field1>", "<field2>"]
    },
    "changedFieldsValidation": [
        {
            "fieldName": "<field name>",
            "valid": <boolean>,
            "fillRate": "<percentage>",
            "issues": ["<issue1>", "<issue2>"],
            "meetsRequirements": <boolean>,
            "suggestion": "<how to fix if invalid>"
        }
    ],
    "issues": [
        {
            "type": "<issue type>",
            "severity": "<low|medium|high>",
            "description": "<description>",
            "affectedFields": ["<field1>", "<field2>"],
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
};

/**
 * Parses AI validation response
 * @param {string} responseContent - Raw AI response
 * @returns {Object} Parsed validation result
 */
const parseValidationResponse = (responseContent) => {
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
        console.error('❌ ValidAIte - JSON parsing failed:', parseError.message);
        throw new Error(`Failed to parse validation response: ${parseError.message}`);
    }
};

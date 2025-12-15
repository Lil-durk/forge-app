/**
 * Delivery Lead Service
 * Handles delivery lead validation and context analysis business logic
 */

import { validateDeliveryLead } from './ai/simpleDeliveryLeadValidator.js';

/**
 * Validates Excel data payload for delivery lead operations
 * @param {Array} excelData - Excel data array
 * @param {string} operation - Operation name for error messages
 * @returns {Object|null} Error object if validation fails, null if valid
 */
const validateExcelDataPayload = (excelData, operation) => {
    if (!excelData || !Array.isArray(excelData) || excelData.length === 0) {
        return {
            success: false,
            error: `No Excel data provided for ${operation}`
        };
    }
    return null;
};

/**
 * Performs delivery lead validation using AI analysis
 * @param {Array} excelData - Excel data to validate
 * @param {Object} pageContext - Page context information
 * @returns {Object} Validation result with delivery lead analysis
 */
export const performDeliveryLeadValidation = async (excelData, pageContext) => {
    try {
        // Validate input data
        const validationError = validateExcelDataPayload(excelData, 'delivery lead validation');
        if (validationError) return validationError;

        // Perform AI-powered delivery lead validation
        const validationResult = await validateDeliveryLead(excelData, pageContext);
        
        if (!validationResult.success) {
            return validationResult;
        }

        // Structure the response for consistency
        return {
            success: true,
            result: {
                deliveryLeadValidation: validationResult.validation,
                contextAnalysis: validationResult.validation?.contextAnalysis,
                processType: validationResult.validation?.processType,
                confidenceScore: validationResult.validation?.confidenceScore,
                approvalDecision: validationResult.validation?.approvalDecision
            },
            metadata: {
                validationType: 'delivery_lead',
                dataRowCount: excelData.length,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('❌ Delivery lead validation service error:', error);
        return {
            success: false,
            error: error.message || 'Failed to perform delivery lead validation'
        };
    }
};

/**
 * Analyzes context from Excel data and page information
 * @param {Array} excelData - Excel data to analyze
 * @param {Object} pageContext - Page context information
 * @returns {Object} Context analysis result
 */
export const analyzeContext = async (excelData, pageContext) => {
    try {
        // Validate input data
        const validationError = validateExcelDataPayload(excelData, 'context analysis');
        if (validationError) return validationError;

        // Use delivery lead validation to extract context
        const validationResult = await validateDeliveryLead(excelData, pageContext);
        
        if (!validationResult.success) {
            return validationResult;
        }

        // Extract context analysis from validation result
        const contextAnalysis = validationResult.validation?.contextAnalysis;
        
        if (!contextAnalysis) {
            return {
                success: false,
                error: 'Context analysis not available in validation result'
            };
        }

        // Enrich context analysis with additional metadata
        const enrichedContextAnalysis = {
            ...contextAnalysis,
            processType: validationResult.validation?.processType,
            confidence: validationResult.validation?.confidenceScore,
            typicalRequiredFields: contextAnalysis.complianceRequirements || [],
            businessGoals: contextAnalysis.businessGoals || [],
            keyStakeholders: contextAnalysis.keyStakeholders || [],
            riskFactors: contextAnalysis.riskFactors || []
        };

        return {
            success: true,
            contextAnalysis: enrichedContextAnalysis,
            metadata: {
                analysisType: 'context_extraction',
                dataRowCount: excelData.length,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('❌ Context analysis service error:', error);
        return {
            success: false,
            error: error.message || 'Failed to analyze context'
        };
    }
};

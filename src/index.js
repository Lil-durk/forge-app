/**
 * Main Forge resolver entry point
 * Coordinates all resolver functions and imports modular services
 */

import Resolver from '@forge/resolver';
import { validateExcelData } from './services/validation.js';
import { monitorFileUpload, getRecentUploads, updateFileValidationStatus } from './services/storage.js';
import { getIssueAttachments, processExcelAttachment } from './services/jira.js';
import { analyzeDataPurpose, generateCustomRequirements, validateWithCustomRequirements } from './services/requirementsWizard.js';
import { checkFileContentChange, cacheValidationResult, getCachedValidationResult, clearValidationCache, getCacheStatistics } from './services/fileContentCache.js';
import { testApiKeyConfiguration } from './resolvers/apiTest.js';
import { performSimpleDeliveryLeadValidation } from './services/ai/simpleDeliveryLeadValidator.js';

const resolver = new Resolver();

// API Configuration
resolver.define('testApiKeyConfiguration', testApiKeyConfiguration);



// Basic Validation
resolver.define('validateExcelData', async (req) => {
    const { excelData, validationRules } = req.payload;
    return await validateExcelData(excelData, validationRules);
});



// File Management
resolver.define('monitorFileUpload', async (req) => {
    return await monitorFileUpload(req.payload);
});

resolver.define('getRecentUploads', async (req) => {
    return await getRecentUploads();
});

resolver.define('updateFileValidationStatus', async (req) => {
    const { fileId, validationResult } = req.payload;
    return await updateFileValidationStatus(fileId, validationResult);
});


// Jira Integration
resolver.define('getIssueAttachments', async (req) => {
    const { issueKey } = req.payload;
    return await getIssueAttachments(issueKey);
});

resolver.define('processExcelAttachment', async (req) => {
    const { attachmentId, filename } = req.payload;
    return await processExcelAttachment(attachmentId, filename);
});


// Requirements Wizard
resolver.define('analyzeDataPurpose', async (req) => {
    const { excelData, fileName } = req.payload;
    return await analyzeDataPurpose(excelData, fileName);
});

resolver.define('generateCustomRequirements', async (req) => {
    const { purpose, excelData, fileName, baseRequirements } = req.payload;
    return await generateCustomRequirements(purpose, excelData, fileName, baseRequirements);
});

resolver.define('validateWithCustomRequirements', async (req) => {
    const { excelData, requirements, useCase } = req.payload;
    return await validateWithCustomRequirements(excelData, requirements, useCase);
});


// File Content Caching
resolver.define('checkFileContentChange', async (req) => {
    const { excelData, fileName } = req.payload;
    return await checkFileContentChange(excelData, fileName);
});

resolver.define('cacheValidationResult', async (req) => {
    const { contentHash, validationResult, metadata } = req.payload;
    return await cacheValidationResult(contentHash, validationResult, metadata);
});

resolver.define('getCachedValidationResult', async (req) => {
    const { contentHash } = req.payload;
    return await getCachedValidationResult(contentHash);
});

resolver.define('clearValidationCache', async (req) => {
    return await clearValidationCache();
});

resolver.define('getCacheStatistics', async (req) => {
    return await getCacheStatistics();
});


// Delivery Lead Validation
resolver.define('performDeliveryLeadValidation', async (req) => {
    console.log('ValidAIte - Delivery Lead Validation resolver called');
    
    try {
        const { excelData, pageContext } = req.payload;
        
        console.log('Received data:', {
            excelDataRows: excelData?.length,
            pageContextKeys: Object.keys(pageContext || {})
        });

        if (!excelData || !Array.isArray(excelData) || excelData.length === 0) {
            return {
                success: false,
                error: 'No Excel data provided'
            };
        }

        // Perform the simple delivery lead validation (single API call to avoid timeouts)
        const validationResult = await performSimpleDeliveryLeadValidation(pageContext, excelData);
        
        console.log('� Validation result:', {
            success: validationResult.success,
            approvalDecision: validationResult.result?.deliveryLeadValidation?.approvalDecision,
            processType: validationResult.result?.contextAnalysis?.processType
        });

        return validationResult;

    } catch (error) {
        console.error('❌ Delivery Lead Validation resolver error:', error);
        return {
            success: false,
            error: error.message || 'Failed to perform delivery lead validation'
        };
    }
});

// Context Analysis (extracted from delivery lead validation)
resolver.define('analyzeContext', async (req) => {
    console.log('ValidAIte - Context Analysis resolver called');
    
    try {
        const { excelData, pageContext } = req.payload;
        
        console.log('Received data for context analysis:', {
            excelDataRows: excelData?.length,
            pageContextKeys: Object.keys(pageContext || {})
        });

        if (!excelData || !Array.isArray(excelData) || excelData.length === 0) {
            return {
                success: false,
                error: 'No Excel data provided for context analysis'
            };
        }

        // Use the existing delivery lead validation service to get context analysis
        const validationResult = await performSimpleDeliveryLeadValidation(pageContext, excelData);
        
        if (!validationResult.success) {
            return validationResult;
        }

        // Extract just the context analysis part
        const contextAnalysis = validationResult.result?.deliveryLeadValidation?.contextAnalysis;
        
        if (!contextAnalysis) {
            return {
                success: false,
                error: 'Context analysis not available in validation result'
            };
        }

        // Add additional context information from the validation
        const enrichedContextAnalysis = {
            ...contextAnalysis,
            processType: validationResult.result?.deliveryLeadValidation?.processType,
            confidence: validationResult.result?.deliveryLeadValidation?.confidenceScore,
            typicalRequiredFields: contextAnalysis.complianceRequirements || [],
            businessGoals: contextAnalysis.businessGoals || [],
            keyStakeholders: contextAnalysis.keyStakeholders || [],
            riskFactors: contextAnalysis.riskFactors || []
        };

        console.log('✅ Context analysis extracted successfully');

        return {
            success: true,
            contextAnalysis: enrichedContextAnalysis
        };

    } catch (error) {
        console.error('❌ Context Analysis resolver error:', error);
        return {
            success: false,
            error: error.message || 'Failed to perform context analysis'
        };
    }
});


export const handler = resolver.getDefinitions();

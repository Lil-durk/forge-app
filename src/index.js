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
import { createLogger } from './utils/logger.js';
import { validatePayload } from './utils/inputValidation.js';

const log = createLogger('ResolverIndex');

const resolver = new Resolver();

/**
 * Generic error handler for resolver functions with input validation
 * @param {Function} handler - The resolver function to wrap
 * @param {string} operationName - Name of the operation for logging
 * @param {Array<string>} requiredFields - Required fields in payload
 * @returns {Function} Wrapped resolver function with error handling
 */
const withErrorHandling = (handler, operationName, requiredFields = []) => async (req) => {
    const startTime = Date.now();
    
    log.debug('withErrorHandling', `Starting ${operationName}`, {
        operation: operationName,
        hasPayload: !!req.payload,
        payloadKeys: req.payload ? Object.keys(req.payload) : []
    });

    try {
        // Validate payload structure
        if (req.payload && requiredFields.length > 0) {
            validatePayload(req.payload, requiredFields);
        }

        const result = await handler(req);
        
        const duration = Date.now() - startTime;
        log.info('withErrorHandling', `${operationName} completed successfully`, {
            operation: operationName,
            duration: `${duration}ms`,
            success: result?.success !== false
        });

        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        log.error('withErrorHandling', `${operationName} failed`, error, {
            operation: operationName,
            duration: `${duration}ms`,
            payloadKeys: req.payload ? Object.keys(req.payload) : []
        });
        
        return {
            success: false,
            error: error.message || `Failed to ${operationName.toLowerCase()}`
        };
    }
};

// Basic Validation
resolver.define('validateExcelData', withErrorHandling(async (req) => {
    const { excelData, validationRules } = req.payload;
    return await validateExcelData(excelData, validationRules);
}, 'Excel Data Validation', ['excelData']));

// File Management
resolver.define('monitorFileUpload', withErrorHandling(async (req) => {
    return await monitorFileUpload(req.payload);
}, 'File Upload Monitoring'));

resolver.define('getRecentUploads', withErrorHandling(async (req) => {
    return await getRecentUploads();
}, 'Get Recent Uploads'));

resolver.define('updateFileValidationStatus', withErrorHandling(async (req) => {
    const { fileId, validationResult } = req.payload;
    return await updateFileValidationStatus(fileId, validationResult);
}, 'Update File Validation Status', ['fileId', 'validationResult']));

// Jira Integration
resolver.define('getIssueAttachments', withErrorHandling(async (req) => {
    const { issueKey } = req.payload;
    return await getIssueAttachments(issueKey);
}, 'Get Issue Attachments', ['issueKey']));

resolver.define('processExcelAttachment', withErrorHandling(async (req) => {
    const { attachmentId, filename } = req.payload;
    return await processExcelAttachment(attachmentId, filename);
}, 'Process Excel Attachment', ['attachmentId', 'filename']));

// Requirements Wizard
resolver.define('analyzeDataPurpose', withErrorHandling(async (req) => {
    const { excelData, fileName } = req.payload;
    return await analyzeDataPurpose(excelData, fileName);
}, 'Analyze Data Purpose'));

resolver.define('generateCustomRequirements', withErrorHandling(async (req) => {
    const { purpose, excelData, fileName, baseRequirements } = req.payload;
    return await generateCustomRequirements(purpose, excelData, fileName, baseRequirements);
}, 'Generate Custom Requirements'));

resolver.define('validateWithCustomRequirements', withErrorHandling(async (req) => {
    const { excelData, requirements, useCase } = req.payload;
    return await validateWithCustomRequirements(excelData, requirements, useCase);
}, 'Validate With Custom Requirements'));

// File Content Caching
resolver.define('checkFileContentChange', withErrorHandling(async (req) => {
    const { excelData, fileName } = req.payload;
    return await checkFileContentChange(excelData, fileName);
}, 'Check File Content Change'));

resolver.define('cacheValidationResult', withErrorHandling(async (req) => {
    const { contentHash, validationResult, metadata } = req.payload;
    return await cacheValidationResult(contentHash, validationResult, metadata);
}, 'Cache Validation Result'));

resolver.define('getCachedValidationResult', withErrorHandling(async (req) => {
    const { contentHash } = req.payload;
    return await getCachedValidationResult(contentHash);
}, 'Get Cached Validation Result'));

resolver.define('clearValidationCache', withErrorHandling(async (req) => {
    return await clearValidationCache();
}, 'Clear Validation Cache'));

resolver.define('getCacheStatistics', withErrorHandling(async (req) => {
    return await getCacheStatistics();
}, 'Get Cache Statistics'));


export const handler = resolver.getDefinitions();

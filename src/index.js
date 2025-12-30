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
import { performDeliveryLeadValidation, analyzeContext } from './services/deliveryLeadService.js';

const resolver = new Resolver();

/**
 * Generic error handler for resolver functions
 * @param {Function} handler - The resolver function to wrap
 * @param {string} operationName - Name of the operation for logging
 * @returns {Function} Wrapped resolver function with error handling
 */
const withErrorHandling = (handler, operationName) => async (req) => {
    try {
        return await handler(req);
    } catch (error) {
        console.error(`${operationName} resolver error:`, error);
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
}, 'Excel Data Validation'));

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
}, 'Update File Validation Status'));

// Jira Integration
resolver.define('getIssueAttachments', withErrorHandling(async (req) => {
    const { issueKey } = req.payload;
    return await getIssueAttachments(issueKey);
}, 'Get Issue Attachments'));

resolver.define('processExcelAttachment', withErrorHandling(async (req) => {
    const { attachmentId, filename } = req.payload;
    return await processExcelAttachment(attachmentId, filename);
}, 'Process Excel Attachment'));

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

// Delivery Lead Validation
resolver.define('performDeliveryLeadValidation', withErrorHandling(async (req) => {
    const { excelData, pageContext } = req.payload;
    return await performDeliveryLeadValidation(excelData, pageContext);
}, 'Delivery Lead Validation'));

// Context Analysis
resolver.define('analyzeContext', withErrorHandling(async (req) => {
    const { excelData, pageContext } = req.payload;
    return await analyzeContext(excelData, pageContext);
}, 'Context Analysis'));

export const handler = resolver.getDefinitions();

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


export const handler = resolver.getDefinitions();

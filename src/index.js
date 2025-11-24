/**
 * Main Forge resolver entry point
 * Coordinates all resolver functions and imports modular services
 */

import Resolver from '@forge/resolver';
import { validateExcelData } from './services/validation.js';
import { monitorFileUpload, getRecentUploads, updateFileValidationStatus } from './services/storage.js';
import { getIssueAttachments, processExcelAttachment } from './services/jira.js';
import { testApiKeyConfiguration } from './resolvers/apiTest.js';

// Initialize the Forge resolver
const resolver = new Resolver();

/**
 * Test API key configuration for LiteLLM
 * Verifies that the OpenAI client is properly configured and can make API calls
 */
resolver.define('testApiKeyConfiguration', testApiKeyConfiguration);

/**
 * Validate Excel data using OpenAI
 * Takes Excel data and validation rules, returns AI-powered validation results
 */
resolver.define('validateExcelData', async (req) => {
    console.log('validateExcelData resolver called');
    const { excelData, validationRules } = req.payload;
    return await validateExcelData(excelData, validationRules);
});

/**
 * Monitor file uploads and store file information
 * Detects Excel file uploads and stores metadata for tracking
 */
resolver.define('monitorFileUpload', async (req) => {
    console.log('monitorFileUpload resolver called');
    return await monitorFileUpload(req.payload);
});

/**
 * Get recent file uploads from storage
 * Returns list of recently uploaded files with their validation status
 */
resolver.define('getRecentUploads', async (req) => {
    console.log('getRecentUploads resolver called');
    return await getRecentUploads();
});

/**
 * Update file validation status in storage
 * Updates the validation status and results for a specific file
 */
resolver.define('updateFileValidationStatus', async (req) => {
    console.log('updateFileValidationStatus resolver called');
    const { fileId, validationResult } = req.payload;
    return await updateFileValidationStatus(fileId, validationResult);
});

/**
 * Get attachments from current Jira issue
 * Fetches and filters Excel attachments from a Jira issue
 */
resolver.define('getIssueAttachments', async (req) => {
    console.log('getIssueAttachments resolver called');
    const { issueKey } = req.payload;
    return await getIssueAttachments(issueKey);
});

/**
 * Download and process Excel attachment from Jira
 * Downloads an Excel attachment and prepares it for validation
 */
resolver.define('processExcelAttachment', async (req) => {
    console.log('processExcelAttachment resolver called');
    const { attachmentId, filename } = req.payload;
    return await processExcelAttachment(attachmentId, filename);
});

// Export the resolver handler for Forge
export const handler = resolver.getDefinitions();

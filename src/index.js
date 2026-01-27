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

// Issue Created Handler - Triggered when a new issue is created
export const issueCreatedHandler = async (event, context) => {
    const log = createLogger('IssueCreatedHandler');
    
    try {
        log.info('issueCreatedHandler', 'Issue created event received', {
            issueKey: event.issue?.key,
            issueType: event.issue?.fields?.issuetype?.name,
            eventType: event.eventType
        });

        const { issue } = event;
        
        if (!issue) {
            log.warn('issueCreatedHandler', 'No issue data in event');
            return { success: false, error: 'No issue data provided' };
        }

        // You can add custom logic here for when issues are created
        // For example: auto-attach validation rules, initialize file monitoring, etc.
        
        log.info('issueCreatedHandler', 'Issue creation handled successfully', {
            issueKey: issue.key
        });

        return { 
            success: true, 
            message: `Issue ${issue.key} creation handled successfully` 
        };
        
    } catch (error) {
        log.error('issueCreatedHandler', 'Error handling issue creation', error);
        return { 
            success: false, 
            error: error.message || 'Failed to handle issue creation' 
        };
    }
};

// File Upload Trigger - Web trigger for handling file uploads
export const fileUploadTrigger = async (payload, context) => {
    const log = createLogger('FileUploadTrigger');
    
    try {
        log.info('fileUploadTrigger', 'File upload trigger received', {
            method: payload.method,
            path: payload.path,
            hasBody: !!payload.body
        });

        if (payload.method === 'POST') {
            const requestBody = JSON.parse(payload.body);
            const { fileData, fileName, fileType, issueKey } = requestBody;
            
            log.info('fileUploadTrigger', 'Processing file upload', {
                fileName,
                fileType,
                issueKey,
                hasFileData: !!fileData
            });

            // Monitor the file upload
            const monitorResult = await monitorFileUpload({
                fileName,
                fileType,
                fileData,
                issueKey,
                uploadTime: new Date().toISOString()
            });

            return {
                statusCode: monitorResult.success ? 200 : 400,
                headers: {
                    'Content-Type': ['application/json']
                },
                body: JSON.stringify(monitorResult)
            };
        }

        // Handle GET requests for file upload status
        if (payload.method === 'GET') {
            const recentUploads = await getRecentUploads();
            
            return {
                statusCode: recentUploads.success ? 200 : 400,
                headers: {
                    'Content-Type': ['application/json']
                },
                body: JSON.stringify(recentUploads)
            };
        }

        return {
            statusCode: 405,
            headers: {
                'Content-Type': ['application/json']
            },
            body: JSON.stringify({
                success: false,
                error: 'Method not allowed'
            })
        };
        
    } catch (error) {
        log.error('fileUploadTrigger', 'Error in file upload trigger', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': ['application/json']
            },
            body: JSON.stringify({
                success: false,
                error: error.message || 'Failed to process file upload'
            })
        };
    }
};

export const createIssueTrigger = async (payload, context) => {
    try {
        const requestBody = JSON.parse(payload.body);
        const { summary, description, fileIds } = requestBody;
        
        // Call the resolver function instead of direct API calls
        // This avoids the webtrigger context issues
        const result = await resolver.resolve('createIssueWithFileInfo', {
            payload: { summary, description, fileIds }
        });
        
        return {
            statusCode: result.success ? 200 : 400,
            headers: {
                'Content-Type': ['application/json']
            },
            body: JSON.stringify(result)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': ['application/json']
            },
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};

export const pendingFilesTrigger = async (payload, context) => {
    try {
        const result = await getPendingFiles();
        
        return {
            statusCode: result.success ? 200 : 400,
            headers: {
                'Content-Type': ['application/json']
            },
            body: JSON.stringify(result)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': ['application/json']
            },
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};

export const attachFileTrigger = async (payload, context) => {
    try {
        const requestBody = JSON.parse(payload.body);
        const { issueKey, fileId } = requestBody;
        const result = await attachFileToIssue(issueKey, fileId);
        
        return {
            statusCode: result.success ? 200 : 400,
            headers: {
                'Content-Type': ['application/json']
            },
            body: JSON.stringify(result)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': ['application/json']
            },
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};

// NEW: File download route handler using route API
export const downloadFileHandler = async (req, context) => {
    try {
        const fileId = req.pathParameters.fileId;
        console.log('Download request for file:', fileId);
        
        const fileResult = await getFileContent(fileId);
        
        if (!fileResult.success) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': ['application/json']
                },
                body: JSON.stringify({
                    error: 'File not found'
                })
            };
        }
        
        // Convert base64 content to binary
        const fileBuffer = Buffer.from(fileResult.content, 'base64');
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': [fileResult.mimeType],
                'Content-Disposition': [`attachment; filename="${fileResult.fileName}"`],
                'Content-Length': [fileBuffer.length.toString()]
            },
            body: fileBuffer.toString('base64'),
            isBase64Encoded: true
        };
        
    } catch (error) {
        console.error('Error in downloadFileHandler:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': ['application/json']
            },
            body: JSON.stringify({
                error: 'Internal server error'
            })
        };
    }
};

// NEW: Web trigger for downloadable files creation
export const createIssueWithDownloadableFilesTrigger = async (payload, context) => {
    try {
        const requestBody = JSON.parse(payload.body);
        const { summary, description, fileIds } = requestBody;
        
        // Call the resolver function for downloadable files
        const result = await resolver.resolve('createIssueWithDownloadableFiles', {
            payload: { summary, description, fileIds }
        });
        
        return {
            statusCode: result.success ? 200 : 400,
            headers: {
                'Content-Type': ['application/json']
            },
            body: JSON.stringify(result)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': ['application/json']
            },
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};

// NEW: Web trigger for analysis reporting (comprehensive Excel reports)
export const createIssueWithAnalysisReportTrigger = async (payload, context) => {
    try {
        const requestBody = JSON.parse(payload.body);
        const { summary, description, fileIds } = requestBody;
        
        console.log('Creating issue with analysis report for files:', fileIds);
        
        // Call the resolver function for analysis reporting
        const result = await resolver.resolve('createIssueWithAnalysisReport', {
            payload: { summary, description, fileIds }
        });
        
        return {
            statusCode: result.success ? 200 : 400,
            headers: {
                'Content-Type': ['application/json']
            },
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error('Error in createIssueWithAnalysisReportTrigger:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': ['application/json']
            },
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};

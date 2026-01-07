import Resolver from '@forge/resolver';
import { validateExcelData } from './services/validation.js';
import { monitorFileUpload, getRecentUploads, updateFileValidationStatus } from './services/storage.js';
import { getIssueAttachments, processExcelAttachment } from './services/jira.js';
<<<<<<< HEAD
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
=======
import { testApiKeyConfiguration } from './resolvers/apiTest.js';
import { 
    storeUploadedFile, 
    getPendingFiles, 
    attachFileToIssue, 
    attachAllPendingFiles, 
    removePendingFile,
    createIssueWithFiles
} from './services/fileAttachment.js';
import { 
    createIssueWithFileInfo,
    createIssueWithDownloadableFiles,
    attemptPostCreationAttachment,
    getFileContent,
    cleanupOldFiles
} from './services/fileAttachmentFixed.js';
import { 
    createIssueWithRealFileAttachment,
    createIssueWithAlternativeAttachment
} from './services/realFileAttachment.js';
import { createIssueWithAnalysisReport } from './services/analysisReporting.js';
import {
    storeFilesForPostAttachment,
    processPostCreationAttachments,
    getPendingAttachments,
    getIssueCommentData,
    cleanupOldAttachmentRequests
} from './services/postCreationAttachment.js';

const resolver = new Resolver();

resolver.define('testApiKeyConfiguration', testApiKeyConfiguration);

resolver.define('validateExcelData', async (req) => {
>>>>>>> main
    const { excelData, validationRules } = req.payload;
    return await validateExcelData(excelData, validationRules);
}, 'Excel Data Validation', ['excelData']));

<<<<<<< HEAD
// File Management
resolver.define('monitorFileUpload', withErrorHandling(async (req) => {
=======
resolver.define('monitorFileUpload', async (req) => {
>>>>>>> main
    return await monitorFileUpload(req.payload);
}, 'File Upload Monitoring'));

<<<<<<< HEAD
resolver.define('getRecentUploads', withErrorHandling(async (req) => {
=======
resolver.define('getRecentUploads', async (req) => {
>>>>>>> main
    return await getRecentUploads();
}, 'Get Recent Uploads'));

<<<<<<< HEAD
resolver.define('updateFileValidationStatus', withErrorHandling(async (req) => {
=======
resolver.define('updateFileValidationStatus', async (req) => {
>>>>>>> main
    const { fileId, validationResult } = req.payload;
    return await updateFileValidationStatus(fileId, validationResult);
}, 'Update File Validation Status', ['fileId', 'validationResult']));

<<<<<<< HEAD
// Jira Integration
resolver.define('getIssueAttachments', withErrorHandling(async (req) => {
=======
resolver.define('getIssueAttachments', async (req) => {
>>>>>>> main
    const { issueKey } = req.payload;
    return await getIssueAttachments(issueKey);
}, 'Get Issue Attachments', ['issueKey']));

<<<<<<< HEAD
resolver.define('processExcelAttachment', withErrorHandling(async (req) => {
=======
resolver.define('processExcelAttachment', async (req) => {
>>>>>>> main
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


<<<<<<< HEAD
=======
resolver.define('storeUploadedFile', async (req) => {
    const { fileData, validationResult } = req.payload;
    return await storeUploadedFile(fileData, validationResult);
});

resolver.define('getPendingFiles', async (req) => {
    return await getPendingFiles();
});

resolver.define('attachFileToIssue', async (req) => {
    const { issueKey, fileId } = req.payload;
    return await attachFileToIssue(issueKey, fileId);
});

resolver.define('attachAllPendingFiles', async (req) => {
    const { issueKey } = req.payload;
    return await attachAllPendingFiles(issueKey);
});

resolver.define('removePendingFile', async (req) => {
    const { fileId } = req.payload;
    return await removePendingFile(fileId);
});

resolver.define('createIssueWithFiles', async (req) => {
    const { summary, description, fileIds } = req.payload;
    return await createIssueWithFiles(summary, description, fileIds);
});

// NEW: Improved file attachment methods
resolver.define('createIssueWithFileInfo', async (req) => {
    const { summary, description, fileIds } = req.payload;
    return await createIssueWithFileInfo(summary, description, fileIds);
});

resolver.define('createIssueWithDownloadableFiles', async (req) => {
    const { summary, description, fileIds } = req.payload;
    return await createIssueWithDownloadableFiles(summary, description, fileIds);
});

resolver.define('attemptPostCreationAttachment', async (req) => {
    const { issueKey, fileIds } = req.payload;
    return await attemptPostCreationAttachment(issueKey, fileIds);
});

resolver.define('getFileContent', async (req) => {
    const { fileId } = req.payload;
    return await getFileContent(fileId);
});

resolver.define('cleanupOldFiles', async (req) => {
    const { maxAgeHours } = req.payload;
    return await cleanupOldFiles(maxAgeHours);
});

// NEW: Post-creation attachment methods
resolver.define('storeFilesForPostAttachment', async (req) => {
    const { fileIds, issueContext } = req.payload;
    return await storeFilesForPostAttachment(fileIds, issueContext);
});

resolver.define('processPostCreationAttachments', async (req) => {
    const { issueKey } = req.payload;
    return await processPostCreationAttachments(issueKey);
});

resolver.define('getPendingAttachments', async (req) => {
    return await getPendingAttachments();
});

resolver.define('getIssueCommentData', async (req) => {
    const { issueKey } = req.payload;
    return await getIssueCommentData(issueKey);
});

resolver.define('cleanupOldAttachmentRequests', async (req) => {
    const { maxAgeHours } = req.payload;
    return await cleanupOldAttachmentRequests(maxAgeHours);
});

// NEW: Analysis reporting method
resolver.define('createIssueWithAnalysisReport', async (req) => {
    const { summary, description, fileIds } = req.payload;
    return await createIssueWithAnalysisReport(summary, description, fileIds);
});

// NEW: Real file attachment methods
resolver.define('createIssueWithRealAttachment', async (req) => {
    const { summary, description, fileIds } = req.payload;
    return await createIssueWithRealFileAttachment(summary, description, fileIds);
});

resolver.define('createIssueWithAlternativeAttachment', async (req) => {
    const { summary, description, fileIds } = req.payload;
    return await createIssueWithAlternativeAttachment(summary, description, fileIds);
});

// Issue created handler - automatically attach pending files
export const issueCreatedHandler = async (event, context) => {
    console.log('=== ISSUE CREATED HANDLER ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    try {
        const issueKey = event.issue.key;
        console.log('New issue created:', issueKey);
        
        // Get all pending files
        const pendingFilesResult = await getPendingFiles();
        
        if (pendingFilesResult.success && pendingFilesResult.files.length > 0) {
            console.log(`Found ${pendingFilesResult.files.length} pending files to attach`);
            
            // Attach all pending files to the new issue
            const attachResult = await attachAllPendingFiles(issueKey);
            
            if (attachResult.success) {
                console.log(`Successfully attached files to issue ${issueKey}`);
            } else {
                console.error('Failed to attach files:', attachResult.error);
            }
        } else {
            console.log('No pending files to attach');
        }
        
    } catch (error) {
        console.error('Error in issue created handler:', error);
    }
};

// Web trigger handlers for file operations
export const fileUploadTrigger = async (payload, context) => {
    try {
        const requestBody = JSON.parse(payload.body);
        const { fileData, validationResult } = requestBody;
        const result = await storeUploadedFile(fileData, validationResult);
        
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

>>>>>>> main
export const handler = resolver.getDefinitions();

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

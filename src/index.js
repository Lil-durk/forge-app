import Resolver from '@forge/resolver';
import { validateExcelData } from './services/validation.js';
import { monitorFileUpload, getRecentUploads, updateFileValidationStatus } from './services/storage.js';
import { getIssueAttachments, processExcelAttachment } from './services/jira.js';
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
    const { excelData, validationRules } = req.payload;
    return await validateExcelData(excelData, validationRules);
});

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

resolver.define('getIssueAttachments', async (req) => {
    const { issueKey } = req.payload;
    return await getIssueAttachments(issueKey);
});

resolver.define('processExcelAttachment', async (req) => {
    const { attachmentId, filename } = req.payload;
    return await processExcelAttachment(attachmentId, filename);
});

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

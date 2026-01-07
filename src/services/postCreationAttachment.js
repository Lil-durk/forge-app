import { storage } from '@forge/api';

/**
 * POST-CREATION ATTACHMENT SOLUTION
 * 1. Create issue first (without files)
 * 2. Monitor for issue creation
 * 3. Attach files after issue exists using issue key
 */

/**
 * Store files for post-creation attachment
 */
export const storeFilesForPostAttachment = async (fileIds, issueContext) => {
    try {
        console.log('Storing files for post-creation attachment:', { fileIds, issueContext });
        
        // Store the pending attachment request
        const attachmentRequest = {
            fileIds: fileIds,
            issueContext: issueContext,
            status: 'pending',
            createdAt: new Date().toISOString(),
            requestId: `attach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        // Store in pending attachments queue
        const pendingAttachments = await storage.get('pending_attachments') || [];
        pendingAttachments.push(attachmentRequest);
        await storage.set('pending_attachments', pendingAttachments);
        
        // Store individual file info for later reference
        for (const fileId of fileIds) {
            const fileInfo = await storage.get(`pending_file_${fileId}`);
            if (fileInfo) {
                fileInfo.status = 'awaiting_attachment';
                fileInfo.attachmentRequestId = attachmentRequest.requestId;
                await storage.set(`pending_file_${fileId}`, fileInfo);
            }
        }
        
        return {
            success: true,
            requestId: attachmentRequest.requestId,
            message: 'Files stored for post-creation attachment'
        };
        
    } catch (error) {
        console.error('Error storing files for post-attachment:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Process pending attachments when issue key becomes available
 */
export const processPostCreationAttachments = async (issueKey) => {
    try {
        console.log('Processing post-creation attachments for issue:', issueKey);
        
        const pendingAttachments = await storage.get('pending_attachments') || [];
        const processedRequests = [];
        
        for (const request of pendingAttachments) {
            if (request.status === 'pending') {
                console.log('Processing attachment request:', request.requestId);
                
                // Create rich comments with file information
                const commentResult = await createFileCommentsForIssue(issueKey, request.fileIds);
                
                if (commentResult.success) {
                    request.status = 'completed';
                    request.processedAt = new Date().toISOString();
                    request.issueKey = issueKey;
                    
                    // Mark files as attached
                    for (const fileId of request.fileIds) {
                        const fileInfo = await storage.get(`pending_file_${fileId}`);
                        if (fileInfo) {
                            fileInfo.status = 'attached_to_issue';
                            fileInfo.attachedToIssue = issueKey;
                            fileInfo.attachedAt = new Date().toISOString();
                            await storage.set(`pending_file_${fileId}`, fileInfo);
                        }
                    }
                    
                    processedRequests.push({
                        requestId: request.requestId,
                        success: true,
                        issueKey: issueKey,
                        fileCount: request.fileIds.length
                    });
                } else {
                    processedRequests.push({
                        requestId: request.requestId,
                        success: false,
                        error: commentResult.error
                    });
                }
            }
        }
        
        // Update pending attachments list
        await storage.set('pending_attachments', pendingAttachments);
        
        return {
            success: true,
            processedCount: processedRequests.length,
            results: processedRequests
        };
        
    } catch (error) {
        console.error('Error processing post-creation attachments:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Create file comments for an issue (no API calls, just data preparation)
 */
const createFileCommentsForIssue = async (issueKey, fileIds) => {
    try {
        const commentData = [];
        
        for (const fileId of fileIds) {
            const fileInfo = await storage.get(`pending_file_${fileId}`);
            if (fileInfo) {
                const comment = generateFileCommentData(fileInfo);
                commentData.push({
                    fileId: fileId,
                    fileName: fileInfo.fileName,
                    commentBody: comment,
                    fileInfo: fileInfo
                });
            }
        }
        
        // Store comment data for frontend to process
        await storage.set(`issue_comments_${issueKey}`, {
            issueKey: issueKey,
            comments: commentData,
            createdAt: new Date().toISOString(),
            status: 'ready_for_frontend'
        });
        
        return {
            success: true,
            commentCount: commentData.length,
            message: 'File comment data prepared for frontend processing'
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Generate rich comment content for a file
 */
const generateFileCommentData = (fileInfo) => {
    const validationStatus = fileInfo.validationResult?.success ? '✅ Valid' : '⚠️ Has Issues';
    const fileSize = Math.round(fileInfo.size / 1024);
    const uploadDate = new Date(fileInfo.uploadedAt).toLocaleString();
    
    let commentBody = `## 📎 Attached File: ${fileInfo.fileName}\n\n`;
    
    // Basic file information
    commentBody += `**File Details:**\n`;
    commentBody += `• **Size:** ${fileSize} KB\n`;
    commentBody += `• **Type:** ${fileInfo.mimeType || 'Excel file'}\n`;
    commentBody += `• **Uploaded:** ${uploadDate}\n`;
    commentBody += `• **Validation Status:** ${validationStatus}\n\n`;
    
    // Validation results
    if (fileInfo.validationResult) {
        commentBody += `**📊 Validation Results:**\n`;
        
        if (fileInfo.validationResult.success) {
            commentBody += `✅ **All validations passed successfully**\n\n`;
        } else {
            commentBody += `⚠️ **Validation issues detected:**\n`;
            if (fileInfo.validationResult.issues && fileInfo.validationResult.issues.length > 0) {
                fileInfo.validationResult.issues.forEach((issue, index) => {
                    const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
                    commentBody += `${index + 1}. ${icon} **${issue.field}** (Row ${issue.row}): ${issue.message}\n`;
                    if (issue.suggestion) {
                        commentBody += `   💡 *Suggestion: ${issue.suggestion}*\n`;
                    }
                });
            }
            commentBody += `\n`;
        }
        
        // Data summary if available
        if (fileInfo.validationResult.summary) {
            commentBody += `**📈 Data Summary:**\n`;
            commentBody += `• **Overall Score:** ${fileInfo.validationResult.overallScore || 'N/A'}/100\n`;
            commentBody += `• **Total Issues:** ${fileInfo.validationResult.issues?.length || 0}\n`;
            
            // Count issue types
            const errors = fileInfo.validationResult.issues?.filter(i => i.type === 'error').length || 0;
            const warnings = fileInfo.validationResult.issues?.filter(i => i.type === 'warning').length || 0;
            const infos = fileInfo.validationResult.issues?.filter(i => i.type === 'info').length || 0;
            
            if (errors > 0) commentBody += `• **Errors:** ${errors}\n`;
            if (warnings > 0) commentBody += `• **Warnings:** ${warnings}\n`;
            if (infos > 0) commentBody += `• **Info:** ${infos}\n`;
            
            commentBody += `\n`;
        }
        
        // Recommendations
        if (fileInfo.validationResult.recommendations && fileInfo.validationResult.recommendations.length > 0) {
            commentBody += `**💡 Recommendations:**\n`;
            fileInfo.validationResult.recommendations.forEach((rec, index) => {
                commentBody += `${index + 1}. ${rec}\n`;
            });
            commentBody += `\n`;
        }
    }
    
    commentBody += `---\n`;
    commentBody += `*File processed by ValidAIte • File ID: ${fileInfo.fileId || 'unknown'}*`;
    
    return commentBody;
};

/**
 * Get pending attachments for monitoring
 */
export const getPendingAttachments = async () => {
    try {
        const pendingAttachments = await storage.get('pending_attachments') || [];
        return {
            success: true,
            attachments: pendingAttachments.filter(a => a.status === 'pending'),
            totalPending: pendingAttachments.filter(a => a.status === 'pending').length
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get comment data for an issue (for frontend processing)
 */
export const getIssueCommentData = async (issueKey) => {
    try {
        const commentData = await storage.get(`issue_comments_${issueKey}`);
        if (!commentData) {
            return {
                success: false,
                error: 'No comment data found for this issue'
            };
        }
        
        return {
            success: true,
            issueKey: issueKey,
            comments: commentData.comments,
            createdAt: commentData.createdAt
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Clean up old attachment requests
 */
export const cleanupOldAttachmentRequests = async (maxAgeHours = 24) => {
    try {
        const pendingAttachments = await storage.get('pending_attachments') || [];
        const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
        
        const activeRequests = pendingAttachments.filter(request => {
            const requestTime = new Date(request.createdAt);
            return requestTime > cutoffTime || request.status === 'completed';
        });
        
        await storage.set('pending_attachments', activeRequests);
        
        const cleanedCount = pendingAttachments.length - activeRequests.length;
        
        return {
            success: true,
            cleanedCount,
            remainingCount: activeRequests.length
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

import api, { route, storage } from '@forge/api';
import { createFileInfoADF } from './adfHelper.js';

/**
 * ULTIMATE SOLUTION: Create issue with file information AND attempt real file attachment
 * This combines ADF description with post-creation file attachment attempts
 */
export const createIssueWithRealFileAttachment = async (summary, description, fileIds) => {
    try {
        console.log('Creating issue with real file attachment attempt:', { summary, fileIds });
        
        // Get file information for ADF
        const fileInfos = [];
        if (fileIds && fileIds.length > 0) {
            for (const fileId of fileIds) {
                const fileInfo = await storage.get(`pending_file_${fileId}`);
                if (fileInfo) {
                    fileInfos.push(fileInfo);
                }
            }
        }

        // Create ADF description
        const adfDescription = createFileInfoADF(description, fileInfos);

        // Create the issue first
        const issuePayload = {
            fields: {
                project: {
                    key: 'VAL'
                },
                summary: summary,
                description: adfDescription,
                issuetype: {
                    name: 'Task'
                }
            }
        };
        
        const createResponse = await api.asUser().requestJira(route`/rest/api/3/issue`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(issuePayload)
        });
        
        if (createResponse.status !== 201) {
            const errorText = await createResponse.text();
            return {
                success: false,
                error: `Failed to create issue: ${createResponse.status} ${errorText}`
            };
        }
        
        const issueData = await createResponse.json();
        const issueKey = issueData.key;
        console.log('Issue created successfully:', issueKey);
        
        // Now attempt to attach the actual files
        const attachmentResults = [];
        
        for (const fileId of fileIds) {
            const fileInfo = await storage.get(`pending_file_${fileId}`);
            if (fileInfo) {
                console.log(`Attempting to attach file: ${fileInfo.fileName}`);
                
                try {
                    // Convert base64 to buffer
                    const fileBuffer = Buffer.from(fileInfo.fileContent, 'base64');
                    
                    // Create FormData for file upload
                    const formData = new FormData();
                    const blob = new Blob([fileBuffer], { type: fileInfo.mimeType });
                    formData.append('file', blob, fileInfo.fileName);
                    
                    // Attempt to attach file to issue
                    const attachResponse = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/attachments`, {
                        method: 'POST',
                        headers: {
                            'X-Atlassian-Token': 'no-check'
                        },
                        body: formData
                    });
                    
                    if (attachResponse.status === 200 || attachResponse.status === 201) {
                        const attachmentData = await attachResponse.json();
                        attachmentResults.push({
                            fileId,
                            fileName: fileInfo.fileName,
                            success: true,
                            attachmentId: attachmentData[0]?.id,
                            message: 'File successfully attached'
                        });
                        
                        // Update file status
                        fileInfo.status = 'attached_to_issue';
                        fileInfo.attachmentId = attachmentData[0]?.id;
                        fileInfo.attachedAt = new Date().toISOString();
                        await storage.set(`pending_file_${fileId}`, fileInfo);
                        
                    } else {
                        const errorText = await attachResponse.text();
                        console.log(`Attachment failed for ${fileInfo.fileName}:`, errorText);
                        attachmentResults.push({
                            fileId,
                            fileName: fileInfo.fileName,
                            success: false,
                            error: `Attachment failed: ${attachResponse.status} ${errorText}`
                        });
                    }
                    
                } catch (attachError) {
                    console.error(`Error attaching file ${fileInfo.fileName}:`, attachError);
                    attachmentResults.push({
                        fileId,
                        fileName: fileInfo.fileName,
                        success: false,
                        error: `Attachment error: ${attachError.message}`
                    });
                }
            }
        }
        
        // Mark files as processed
        for (const fileId of fileIds) {
            const fileInfo = await storage.get(`pending_file_${fileId}`);
            if (fileInfo && !fileInfo.status) {
                fileInfo.status = 'referenced_in_issue';
                fileInfo.referencedInIssue = issueKey;
                fileInfo.referencedAt = new Date().toISOString();
                await storage.set(`pending_file_${fileId}`, fileInfo);
            }
        }
        
        // Clear pending files list
        await storage.set('pending_files', []);
        
        // Add comment about attachment results
        await addAttachmentResultsComment(issueKey, attachmentResults);
        
        const successfulAttachments = attachmentResults.filter(r => r.success).length;
        const totalFiles = attachmentResults.length;
        
        return {
            success: true,
            issueKey: issueKey,
            issueUrl: `https://io-test.atlassian.net/browse/${issueKey}`,
            totalFiles: totalFiles,
            attachedFiles: successfulAttachments,
            attachmentResults: attachmentResults,
            message: `Successfully created issue ${issueKey}. ${successfulAttachments}/${totalFiles} files attached as real attachments.`
        };
        
    } catch (error) {
        console.error('Error in createIssueWithRealFileAttachment:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Add comment about attachment results
 */
const addAttachmentResultsComment = async (issueKey, attachmentResults) => {
    try {
        if (!attachmentResults || attachmentResults.length === 0) return;
        
        let commentBody = '## 📎 File Attachment Results\n\n';
        
        const successful = attachmentResults.filter(r => r.success);
        const failed = attachmentResults.filter(r => !r.success);
        
        if (successful.length > 0) {
            commentBody += `✅ **Successfully attached ${successful.length} file(s):**\n`;
            successful.forEach(result => {
                commentBody += `- ${result.fileName}\n`;
            });
            commentBody += '\n';
        }
        
        if (failed.length > 0) {
            commentBody += `⚠️ **Failed to attach ${failed.length} file(s):**\n`;
            failed.forEach(result => {
                commentBody += `- ${result.fileName}: ${result.error}\n`;
            });
            commentBody += '\n';
        }
        
        if (failed.length > 0) {
            commentBody += '*Note: File information is still available in the issue description above.*\n';
        }
        
        const commentPayload = {
            body: commentBody
        };
        
        await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(commentPayload)
        });
        
    } catch (error) {
        console.error('Error adding attachment results comment:', error);
        // Don't fail the whole process if comment fails
    }
};

/**
 * Alternative approach using different attachment method
 */
export const createIssueWithAlternativeAttachment = async (summary, description, fileIds) => {
    try {
        console.log('Creating issue with alternative attachment method:', { summary, fileIds });
        
        // Get file information for ADF
        const fileInfos = [];
        if (fileIds && fileIds.length > 0) {
            for (const fileId of fileIds) {
                const fileInfo = await storage.get(`pending_file_${fileId}`);
                if (fileInfo) {
                    fileInfos.push(fileInfo);
                }
            }
        }

        // Create ADF description
        const adfDescription = createFileInfoADF(description, fileInfos);

        // Create the issue first
        const issuePayload = {
            fields: {
                project: {
                    key: 'VAL'
                },
                summary: summary,
                description: adfDescription,
                issuetype: {
                    name: 'Task'
                }
            }
        };
        
        const createResponse = await api.asUser().requestJira(route`/rest/api/3/issue`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(issuePayload)
        });
        
        if (createResponse.status !== 201) {
            const errorText = await createResponse.text();
            return {
                success: false,
                error: `Failed to create issue: ${createResponse.status} ${errorText}`
            };
        }
        
        const issueData = await createResponse.json();
        const issueKey = issueData.key;
        console.log('Issue created successfully:', issueKey);
        
        // Try alternative attachment method using multipart/form-data
        const attachmentResults = [];
        
        for (const fileId of fileIds) {
            const fileInfo = await storage.get(`pending_file_${fileId}`);
            if (fileInfo) {
                try {
                    // Create attachment using raw binary data
                    const fileBuffer = Buffer.from(fileInfo.fileContent, 'base64');
                    
                    const attachResponse = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/attachments`, {
                        method: 'POST',
                        headers: {
                            'X-Atlassian-Token': 'no-check',
                            'Content-Type': 'multipart/form-data'
                        },
                        body: {
                            file: {
                                filename: fileInfo.fileName,
                                content: fileBuffer,
                                contentType: fileInfo.mimeType
                            }
                        }
                    });
                    
                    if (attachResponse.status === 200 || attachResponse.status === 201) {
                        attachmentResults.push({
                            fileId,
                            fileName: fileInfo.fileName,
                            success: true,
                            message: 'File attached using alternative method'
                        });
                    } else {
                        const errorText = await attachResponse.text();
                        attachmentResults.push({
                            fileId,
                            fileName: fileInfo.fileName,
                            success: false,
                            error: `Alternative attachment failed: ${attachResponse.status} ${errorText}`
                        });
                    }
                    
                } catch (attachError) {
                    attachmentResults.push({
                        fileId,
                        fileName: fileInfo.fileName,
                        success: false,
                        error: `Alternative attachment error: ${attachError.message}`
                    });
                }
            }
        }
        
        // Add comment about results
        await addAttachmentResultsComment(issueKey, attachmentResults);
        
        const successfulAttachments = attachmentResults.filter(r => r.success).length;
        
        return {
            success: true,
            issueKey: issueKey,
            issueUrl: `https://io-test.atlassian.net/browse/${issueKey}`,
            totalFiles: attachmentResults.length,
            attachedFiles: successfulAttachments,
            attachmentResults: attachmentResults,
            message: `Issue created. Alternative attachment method: ${successfulAttachments}/${attachmentResults.length} files attached.`
        };
        
    } catch (error) {
        console.error('Error in createIssueWithAlternativeAttachment:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

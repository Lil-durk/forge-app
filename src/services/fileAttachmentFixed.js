import api, { route, storage } from '@forge/api';
import { createFileInfoADF, createSimpleADF } from './adfHelper.js';

/**
 * WORKING SOLUTION: Create issue with file information in description
 * This is the most reliable approach for Forge apps
 */
export const createIssueWithFileInfo = async (summary, description, fileIds) => {
    try {
        console.log('Creating issue with file information:', { summary, fileIds });
        
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

        // Create the issue
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
        
        // Mark files as referenced in the issue
        for (const fileId of fileIds) {
            const fileInfo = await storage.get(`pending_file_${fileId}`);
            if (fileInfo) {
                fileInfo.status = 'referenced_in_issue';
                fileInfo.referencedInIssue = issueKey;
                fileInfo.referencedAt = new Date().toISOString();
                await storage.set(`pending_file_${fileId}`, fileInfo);
            }
        }
        
        // Clear pending files list
        await storage.set('pending_files', []);
        
        // Add a comment with additional file details
        await addFileDetailsComment(issueKey, fileIds);
        
        return {
            success: true,
            issueKey: issueKey,
            issueUrl: `https://io-test.atlassian.net/browse/${issueKey}`,
            totalFiles: fileIds.length,
            message: `Successfully created issue ${issueKey} with file information included.`
        };
        
    } catch (error) {
        console.error('Error in createIssueWithFileInfo:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Add detailed file information as a comment
 */
const addFileDetailsComment = async (issueKey, fileIds) => {
    try {
        if (!fileIds || fileIds.length === 0) return;
        
        let commentBody = '## File Validation Details\n\n';
        
        for (const fileId of fileIds) {
            const fileInfo = await storage.get(`pending_file_${fileId}`);
            if (fileInfo && fileInfo.validationResult) {
                commentBody += `**${fileInfo.fileName}:**\n`;
                
                if (fileInfo.validationResult.success) {
                    commentBody += '✅ All validations passed\n';
                } else {
                    commentBody += '⚠️ Validation issues found:\n';
                    if (fileInfo.validationResult.errors) {
                        fileInfo.validationResult.errors.forEach(error => {
                            commentBody += `- ${error}\n`;
                        });
                    }
                }
                
                // Add summary statistics if available
                if (fileInfo.validationResult.summary) {
                    commentBody += `\n**Summary:**\n`;
                    commentBody += `- Total rows: ${fileInfo.validationResult.summary.totalRows || 'N/A'}\n`;
                    commentBody += `- Valid rows: ${fileInfo.validationResult.summary.validRows || 'N/A'}\n`;
                    commentBody += `- Invalid rows: ${fileInfo.validationResult.summary.invalidRows || 'N/A'}\n`;
                }
                
                commentBody += '\n---\n\n';
            }
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
        console.error('Error adding file details comment:', error);
        // Don't fail the whole process if comment fails
    }
};

/**
 * NEW SOLUTION: Using route API for downloadable file links
 * This creates actual downloadable links using Forge's route API
 */
export const createIssueWithDownloadableFiles = async (summary, description, fileIds) => {
    try {
        console.log('Creating issue with downloadable files:', { summary, fileIds });
        
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

        // Create ADF description with file info
        const adfDescription = createFileInfoADF(description, fileInfos);
        
        // Create the issue
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
        console.log('Issue created successfully with downloadable files:', issueKey);
        
        // Mark files as referenced in the issue (but keep them for downloads)
        for (const fileId of fileIds) {
            const fileInfo = await storage.get(`pending_file_${fileId}`);
            if (fileInfo) {
                fileInfo.status = 'downloadable_in_issue';
                fileInfo.referencedInIssue = issueKey;
                fileInfo.referencedAt = new Date().toISOString();
                // Don't delete - keep for downloads
                await storage.set(`pending_file_${fileId}`, fileInfo);
            }
        }
        
        // Add a comment with download instructions
        await addDownloadInstructionsComment(issueKey, fileIds);
        
        return {
            success: true,
            issueKey: issueKey,
            issueUrl: `https://io-test.atlassian.net/browse/${issueKey}`,
            totalFiles: fileIds.length,
            message: `Successfully created issue ${issueKey} with downloadable file links.`
        };
        
    } catch (error) {
        console.error('Error in createIssueWithDownloadableFiles:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Add download instructions as a comment
 */
const addDownloadInstructionsComment = async (issueKey, fileIds) => {
    try {
        if (!fileIds || fileIds.length === 0) return;
        
        let commentBody = '## 📥 File Download Instructions\n\n';
        commentBody += 'Click on any file name in the description above to download the original Excel file.\n\n';
        commentBody += '### File Details:\n\n';
        
        for (const fileId of fileIds) {
            const fileInfo = await storage.get(`pending_file_${fileId}`);
            if (fileInfo) {
                const downloadUrl = route`/download-file/${fileId}`;
                commentBody += `**[${fileInfo.fileName}](${downloadUrl})**\n`;
                commentBody += `- Uploaded: ${new Date(fileInfo.uploadedAt).toLocaleString()}\n`;
                commentBody += `- Size: ${Math.round(fileInfo.size / 1024)} KB\n`;
                
                if (fileInfo.validationResult) {
                    if (fileInfo.validationResult.success) {
                        commentBody += '- Status: ✅ All validations passed\n';
                    } else {
                        commentBody += '- Status: ⚠️ Validation issues found\n';
                        if (fileInfo.validationResult.errors) {
                            fileInfo.validationResult.errors.forEach(error => {
                                commentBody += `  - ${error}\n`;
                            });
                        }
                    }
                    
                    // Add summary statistics if available
                    if (fileInfo.validationResult.summary) {
                        commentBody += `- Rows: ${fileInfo.validationResult.summary.totalRows || 'N/A'} total, `;
                        commentBody += `${fileInfo.validationResult.summary.validRows || 'N/A'} valid, `;
                        commentBody += `${fileInfo.validationResult.summary.invalidRows || 'N/A'} invalid\n`;
                    }
                }
                
                commentBody += '\n';
            }
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
        console.error('Error adding download instructions comment:', error);
        // Don't fail the whole process if comment fails
    }
};

/**
 * ALTERNATIVE: Post-creation file attachment attempt
 * This tries to attach files after issue creation, but may still fail
 */
export const attemptPostCreationAttachment = async (issueKey, fileIds) => {
    try {
        const results = [];
        
        for (const fileId of fileIds) {
            const fileInfo = await storage.get(`pending_file_${fileId}`);
            if (!fileInfo) {
                results.push({
                    fileId,
                    success: false,
                    error: 'File not found in storage'
                });
                continue;
            }
            
            // Try to create a simple attachment using a different approach
            const attachResult = await createFileReference(issueKey, fileInfo);
            results.push({
                fileId,
                fileName: fileInfo.fileName,
                ...attachResult
            });
        }
        
        const successCount = results.filter(r => r.success).length;
        
        return {
            success: successCount > 0,
            message: `Processed ${successCount}/${results.length} files`,
            results
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Create a file reference as a comment (fallback approach)
 */
const createFileReference = async (issueKey, fileInfo) => {
    try {
        const commentBody = `📎 **File Reference: ${fileInfo.fileName}**\n\n` +
            `- **Size:** ${Math.round(fileInfo.size / 1024)} KB\n` +
            `- **Type:** ${fileInfo.mimeType}\n` +
            `- **Uploaded:** ${new Date(fileInfo.uploadedAt).toLocaleString()}\n` +
            `- **Validation:** ${fileInfo.validationResult?.success ? 'Passed' : 'Failed'}\n\n` +
            `*File is stored securely in ValidAIte app storage.*`;
        
        const commentPayload = { body: commentBody };
        const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(commentPayload)
        });
        
        if (response.status === 201) {
            return {
                success: true,
                message: 'File reference added as comment'
            };
        } else {
            return {
                success: false,
                error: `Failed to add comment: ${response.status}`
            };
        }
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get file content for download (if needed)
 */
export const getFileContent = async (fileId) => {
    try {
        const fileInfo = await storage.get(`pending_file_${fileId}`);
        if (!fileInfo) {
            return {
                success: false,
                error: 'File not found'
            };
        }
        
        return {
            success: true,
            fileName: fileInfo.fileName,
            mimeType: fileInfo.mimeType,
            content: fileInfo.fileContent, // Base64 encoded
            size: fileInfo.size
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Clean up old files from storage
 */
export const cleanupOldFiles = async (maxAgeHours = 24) => {
    try {
        const pendingFileIds = await storage.get('pending_files') || [];
        const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
        
        let cleanedCount = 0;
        
        for (const fileId of pendingFileIds) {
            const fileInfo = await storage.get(`pending_file_${fileId}`);
            if (fileInfo && new Date(fileInfo.uploadedAt) < cutoffTime) {
                await storage.delete(`pending_file_${fileId}`);
                cleanedCount++;
            }
        }
        
        // Update pending files list
        const remainingFiles = [];
        for (const fileId of pendingFileIds) {
            const fileInfo = await storage.get(`pending_file_${fileId}`);
            if (fileInfo) {
                remainingFiles.push(fileId);
            }
        }
        
        await storage.set('pending_files', remainingFiles);
        
        return {
            success: true,
            cleanedCount,
            remainingCount: remainingFiles.length
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

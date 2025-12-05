import { requestJira } from '@forge/api';
import { storage } from '@forge/api';

/**
 * Store uploaded file data temporarily until issue creation
 */
export const storeUploadedFile = async (fileData, validationResult) => {
    try {
        const fileId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const fileInfo = {
            fileId,
            fileName: fileData.fileName,
            fileContent: fileData.fileContent, // Base64 encoded file content
            mimeType: fileData.mimeType,
            size: fileData.size,
            uploadedAt: new Date().toISOString(),
            validationResult,
            status: 'pending_attachment'
        };
        
        // Store file info
        await storage.set(`pending_file_${fileId}`, fileInfo);
        
        // Add to pending files list
        const pendingFiles = await storage.get('pending_files') || [];
        pendingFiles.push(fileId);
        await storage.set('pending_files', pendingFiles);
        
        return {
            success: true,
            fileId,
            message: 'File stored successfully, ready for attachment'
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get all pending files ready for attachment
 */
export const getPendingFiles = async () => {
    try {
        const pendingFileIds = await storage.get('pending_files') || [];
        const pendingFiles = [];
        
        for (const fileId of pendingFileIds) {
            const fileInfo = await storage.get(`pending_file_${fileId}`);
            if (fileInfo && fileInfo.status === 'pending_attachment') {
                pendingFiles.push(fileInfo);
            }
        }
        
        return {
            success: true,
            files: pendingFiles
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Attach a file to a Jira issue using proper Forge API
 */
export const attachFileToIssue = async (issueKey, fileId) => {
    try {
        // Get file info from storage
        const fileInfo = await storage.get(`pending_file_${fileId}`);
        if (!fileInfo) {
            return {
                success: false,
                error: 'File not found in storage'
            };
        }
        
        // Convert base64 content back to buffer for Forge API
        const fileBuffer = Buffer.from(fileInfo.fileContent, 'base64');
        
        // Use the proper Forge approach for file attachments
        // Create a multipart form data manually for Forge
        const boundary = '----formdata-forge-' + Math.random().toString(36);
        const formDataParts = [
            `--${boundary}`,
            `Content-Disposition: form-data; name="file"; filename="${fileInfo.fileName}"`,
            `Content-Type: ${fileInfo.mimeType}`,
            '',
            fileBuffer.toString('binary'),
            `--${boundary}--`
        ];
        
        const formDataBody = formDataParts.join('\r\n');
        
        // Attach file to issue using requestJira with proper headers
        const response = await requestJira(`/rest/api/3/issue/${issueKey}/attachments`, {
            method: 'POST',
            headers: {
                'X-Atlassian-Token': 'no-check',
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            },
            body: formDataBody
        });
        
        if (response.status === 200 || response.status === 201) {
            // Update file status
            fileInfo.status = 'attached';
            fileInfo.attachedAt = new Date().toISOString();
            fileInfo.attachedToIssue = issueKey;
            await storage.set(`pending_file_${fileId}`, fileInfo);
            
            // Remove from pending files list
            const pendingFiles = await storage.get('pending_files') || [];
            const updatedPendingFiles = pendingFiles.filter(id => id !== fileId);
            await storage.set('pending_files', updatedPendingFiles);
            
            return {
                success: true,
                message: `File ${fileInfo.fileName} attached to issue ${issueKey}`,
                attachmentInfo: await response.json()
            };
        } else {
            const errorText = await response.text();
            return {
                success: false,
                error: `Failed to attach file: ${response.status} ${errorText}`
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
 * Attach all pending files to an issue
 */
export const attachAllPendingFiles = async (issueKey) => {
    try {
        const pendingFilesResult = await getPendingFiles();
        if (!pendingFilesResult.success) {
            return pendingFilesResult;
        }
        
        const results = [];
        for (const file of pendingFilesResult.files) {
            const result = await attachFileToIssue(issueKey, file.fileId);
            results.push({
                fileName: file.fileName,
                result
            });
        }
        
        const successCount = results.filter(r => r.result.success).length;
        const failCount = results.length - successCount;
        
        return {
            success: failCount === 0,
            message: `Attached ${successCount} files successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
            attachedCount: successCount,
            failedCount: failCount,
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
 * Remove a pending file from storage
 */
export const removePendingFile = async (fileId) => {
    try {
        // Remove file info
        await storage.delete(`pending_file_${fileId}`);
        
        // Remove from pending files list
        const pendingFiles = await storage.get('pending_files') || [];
        const updatedPendingFiles = pendingFiles.filter(id => id !== fileId);
        await storage.set('pending_files', updatedPendingFiles);
        
        return {
            success: true,
            message: 'File removed successfully'
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Create a new issue - simplified approach without file attachments
 */
export const createIssueWithFiles = async (summary, description, fileIds) => {
    try {
        console.log('Creating issue with files:', { summary, fileIds });
        
        // Get file information for the description
        let fileInfoText = '';
        if (fileIds && fileIds.length > 0) {
            fileInfoText = '\n\n--- Validated Files ---\n';
            for (const fileId of fileIds) {
                const fileInfo = await storage.get(`pending_file_${fileId}`);
                if (fileInfo) {
                    const validationStatus = fileInfo.validationResult?.success ? 'Valid' : 'Has Issues';
                    fileInfoText += `• ${fileInfo.fileName} (${Math.round(fileInfo.size / 1024)} KB) - ${validationStatus}\n`;
                }
            }
        }
        
        // Create the issue with file information in description
        const issuePayload = {
            fields: {
                project: {
                    key: 'TEST' // You may need to adjust this to match your project
                },
                summary: summary,
                description: description + fileInfoText,
                issuetype: {
                    name: 'Task'
                }
            }
        };
        
        const createResponse = await requestJira('/rest/api/3/issue', {
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
        
        // Mark files as processed (but not attached)
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
        
        // Build the issue URL
        const issueUrl = `https://io-test.atlassian.net/browse/${issueKey}`;
        
        return {
            success: true,
            issueKey: issueKey,
            issueUrl: issueUrl,
            attachedCount: 0, // No files attached, but referenced
            totalFiles: fileIds.length,
            message: `Successfully created issue ${issueKey}. File information included in description. You can manually attach files if needed.`
        };
        
    } catch (error) {
        console.error('Error in createIssueWithFiles:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

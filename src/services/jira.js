/**
 * Jira integration service
 * Handles Jira API interactions for attachments and issue management
 */

import { requestJira } from '@forge/api';

/**
 * Get attachments from a Jira issue
 * @param {string} issueKey - Jira issue key
 * @returns {Object} Success status and attachments data
 */
export const getIssueAttachments = async (issueKey) => {
    console.log('getIssueAttachments called for issue:', issueKey);
    
    try {
        if (!issueKey) {
            return {
                success: false,
                error: 'No issue key provided'
            };
        }
        
        console.log('Fetching attachments for issue:', issueKey);
        
        // Get issue details including attachments
        const response = await requestJira(`/rest/api/3/issue/${issueKey}?fields=attachment`);
        
        if (response.status !== 200) {
            console.error('Failed to fetch issue:', response.status, response.statusText);
            return {
                success: false,
                error: `Failed to fetch issue: ${response.status} ${response.statusText}`
            };
        }
        
        const issue = await response.json();
        const attachments = issue.fields.attachment || [];
        
        console.log('Found attachments:', attachments.length);
        
        // Filter for Excel files
        const excelAttachments = attachments.filter(attachment => 
            attachment.filename && attachment.filename.match(/\.(xlsx|xls)$/i)
        );
        
        console.log('Excel attachments found:', excelAttachments.length);
        
        // Format attachment data
        const formattedAttachments = excelAttachments.map(attachment => ({
            id: attachment.id,
            filename: attachment.filename,
            size: attachment.size,
            mimeType: attachment.mimeType,
            created: attachment.created,
            author: attachment.author ? attachment.author.displayName : 'Unknown',
            content: attachment.content // URL to download the file
        }));
        
        return {
            success: true,
            attachments: formattedAttachments,
            totalAttachments: attachments.length,
            excelAttachments: excelAttachments.length
        };
        
    } catch (error) {
        console.error('getIssueAttachments error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Download and process Excel attachment from Jira
 * @param {string} attachmentId - Jira attachment ID
 * @param {string} filename - Attachment filename
 * @returns {Object} Success status and file info
 */
export const processExcelAttachment = async (attachmentId, filename) => {
    console.log('processExcelAttachment called for:', attachmentId, filename);
    
    try {
        if (!attachmentId) {
            return {
                success: false,
                error: 'No attachment ID provided'
            };
        }
        
        console.log('Downloading attachment:', attachmentId, filename);
        
        // Download the attachment content
        const response = await requestJira(`/rest/api/3/attachment/content/${attachmentId}`);
        
        if (response.status !== 200) {
            console.error('Failed to download attachment:', response.status, response.statusText);
            return {
                success: false,
                error: `Failed to download attachment: ${response.status} ${response.statusText}`
            };
        }
        
        // Get the file content as buffer
        const fileBuffer = await response.buffer();
        console.log('Downloaded file size:', fileBuffer.length, 'bytes');
        
        // Note: To parse Excel files server-side, you would need to add the 'xlsx' package
        // to the main package.json and import it here. For now, we'll return the file info
        // and let the frontend handle the Excel parsing.
        
        return {
            success: true,
            message: 'Excel attachment downloaded successfully',
            fileInfo: {
                id: attachmentId,
                filename: filename,
                size: fileBuffer.length,
                downloadedAt: new Date().toISOString()
            },
            // In a full implementation, you would parse the Excel here and return the data
            // For now, we'll indicate that the file needs to be processed on the frontend
            requiresFrontendProcessing: true
        };
        
    } catch (error) {
        console.error('processExcelAttachment error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Check if a filename is an Excel file
 * @param {string} filename - File name to check
 * @returns {boolean} True if Excel file, false otherwise
 */
export const isExcelFile = (filename) => {
    return filename && filename.match(/\.(xlsx|xls)$/i);
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

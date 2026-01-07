/**
 * Jira Service
 * Handles Jira API interactions for attachment processing and issue management
 */

import api, { route } from '@forge/api';
import * as XLSX from 'xlsx';
import { createLogger } from '../utils/logger.js';
import { validateFileSize, validateFilename, sanitizeString } from '../utils/inputValidation.js';

const log = createLogger('JiraService');

/**
 * Get attachments for a specific Jira issue
 * @param {string} issueKey - Jira issue key
 * @returns {Object} Result with attachments array
 */
export const getIssueAttachments = async (issueKey) => {
    try {
        if (!issueKey) {
            log.warn('getIssueAttachments', 'Issue key is required but not provided');
            return {
                success: false,
                error: 'Issue key is required'
            };
        }

        // Sanitize issue key
        const sanitizedIssueKey = sanitizeString(issueKey, 50);
        
        log.debug('getIssueAttachments', 'Fetching issue attachments', { issueKey: sanitizedIssueKey });

        const response = await api.asUser().requestJira(route`/rest/api/3/issue/${sanitizedIssueKey}?fields=attachment`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.status !== 200) {
            log.error('getIssueAttachments', 'Failed to fetch issue from Jira API', new Error(`HTTP ${response.status}`), {
                issueKey: sanitizedIssueKey,
                status: response.status,
                statusText: response.statusText
            });
            return {
                success: false,
                error: `Failed to fetch issue: ${response.status}`
            };
        }

        const issue = await response.json();
        const attachments = issue.fields?.attachment || [];

        // Filter for Excel files
        const excelAttachments = attachments.filter(attachment => 
            attachment.filename.match(/\.(xlsx|xls)$/i)
        );

        log.info('getIssueAttachments', 'Successfully retrieved issue attachments', {
            issueKey: sanitizedIssueKey,
            totalAttachments: attachments.length,
            excelAttachments: excelAttachments.length
        });

        return {
            success: true,
            attachments: excelAttachments,
            totalAttachments: attachments.length,
            excelAttachments: excelAttachments.length
        };

    } catch (error) {
        log.error('getIssueAttachments', 'Failed to get issue attachments', error, { issueKey });
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Process and download Excel attachment from Jira
 * @param {string} attachmentId - Attachment ID
 * @param {string} filename - Attachment filename
 * @returns {Object} Result with processed Excel data
 */
export const processExcelAttachment = async (attachmentId, filename) => {
    try {
        if (!attachmentId || !filename) {
            log.warn('processExcelAttachment', 'Missing required parameters', {
                hasAttachmentId: !!attachmentId,
                hasFilename: !!filename
            });
            return {
                success: false,
                error: 'Attachment ID and filename are required'
            };
        }

        // Validate and sanitize inputs
        const sanitizedAttachmentId = sanitizeString(attachmentId, 100);
        let cleanFilename;
        
        try {
            cleanFilename = validateFilename(filename);
        } catch (validationError) {
            log.error('processExcelAttachment', 'Invalid filename', validationError, { filename });
            return {
                success: false,
                error: validationError.message
            };
        }

        log.debug('processExcelAttachment', 'Starting Excel attachment processing', {
            attachmentId: sanitizedAttachmentId,
            filename: cleanFilename
        });

        const response = await api.asUser().requestJira(route`/rest/api/3/attachment/content/${sanitizedAttachmentId}`, {
            headers: {
                'Accept': 'application/octet-stream'
            }
        });

        if (response.status !== 200) {
            log.error('processExcelAttachment', 'Failed to download attachment from Jira', new Error(`HTTP ${response.status}`), {
                attachmentId: sanitizedAttachmentId,
                status: response.status,
                statusText: response.statusText
            });
            return {
                success: false,
                error: `Failed to download attachment: ${response.status}`
            };
        }

        const fileBuffer = await response.buffer();
        
        // Validate file size
        try {
            validateFileSize(fileBuffer.length);
        } catch (sizeError) {
            log.error('processExcelAttachment', 'File size validation failed', sizeError, {
                attachmentId: sanitizedAttachmentId,
                fileSize: fileBuffer.length
            });
            return {
                success: false,
                error: sizeError.message
            };
        }

        // Process Excel file
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const excelData = XLSX.utils.sheet_to_json(worksheet);

        log.info('processExcelAttachment', 'Excel attachment processed successfully', {
            attachmentId: sanitizedAttachmentId,
            filename: cleanFilename,
            rowCount: excelData.length,
            sheetName,
            fileSize: fileBuffer.length
        });

        return {
            success: true,
            filename: cleanFilename,
            attachmentId: sanitizedAttachmentId,
            excelData,
            rowCount: excelData.length,
            sheetName,
            fileSize: fileBuffer.length
        };

    } catch (error) {
        log.error('processExcelAttachment', 'Failed to process Excel attachment', error, {
            attachmentId,
            filename
        });
        return {
            success: false,
            error: error.message
        };
    }
};

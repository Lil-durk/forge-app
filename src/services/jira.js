/**
 * Jira Service
 * Handles Jira API interactions for attachment processing and issue management
 */

import api, { route } from '@forge/api';
import * as XLSX from 'xlsx';

/**
 * Get attachments for a specific Jira issue
 * @param {string} issueKey - Jira issue key
 * @returns {Object} Result with attachments array
 */
export const getIssueAttachments = async (issueKey) => {
    try {
        if (!issueKey) {
            return {
                success: false,
                error: 'Issue key is required'
            };
        }

        const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}?fields=attachment`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.status !== 200) {
            console.error('Failed to fetch issue:', response.status, response.statusText);
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

        return {
            success: true,
            attachments: excelAttachments,
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
 * Process and download Excel attachment from Jira
 * @param {string} attachmentId - Attachment ID
 * @param {string} filename - Attachment filename
 * @returns {Object} Result with processed Excel data
 */
export const processExcelAttachment = async (attachmentId, filename) => {
    try {
        if (!attachmentId || !filename) {
            return {
                success: false,
                error: 'Attachment ID and filename are required'
            };
        }

        const response = await api.asUser().requestJira(route`/rest/api/3/attachment/content/${attachmentId}`, {
            headers: {
                'Accept': 'application/octet-stream'
            }
        });

        if (response.status !== 200) {
            console.error('Failed to download attachment:', response.status, response.statusText);
            return {
                success: false,
                error: `Failed to download attachment: ${response.status}`
            };
        }

        const fileBuffer = await response.buffer();

        // Process Excel file
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const excelData = XLSX.utils.sheet_to_json(worksheet);

        return {
            success: true,
            filename,
            attachmentId,
            excelData,
            rowCount: excelData.length,
            sheetName,
            fileSize: fileBuffer.length
        };

    } catch (error) {
        console.error('processExcelAttachment error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

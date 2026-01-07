import { requestJira } from '@forge/api';

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
        
        const response = await requestJira(`/rest/api/3/issue/${issueKey}?fields=attachment`);
        
        if (response.status !== 200) {
            return {
                success: false,
                error: `Failed to fetch issue: ${response.status}`
            };
        }

        const issue = await response.json();
        const attachments = issue.fields.attachment || [];
        
        // Filter for Excel files
        const excelAttachments = attachments.filter(attachment => 
            attachment.filename.match(/\.(xlsx|xls)$/i)
        );
        
        const formattedAttachments = excelAttachments.map(attachment => ({
            id: attachment.id,
            filename: attachment.filename,
            size: attachment.size,
            mimeType: attachment.mimeType,
            created: attachment.created,
            author: attachment.author ? attachment.author.displayName : 'Unknown',
            content: attachment.content
        }));
        
        return {
            success: true,
            attachments: excelAttachments,
            totalAttachments: attachments.length,
            excelAttachments: excelAttachments.length
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

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
        
        const response = await requestJira(`/rest/api/3/attachment/content/${attachmentId}`);
        
        if (response.status !== 200) {
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
            message: 'Excel attachment downloaded successfully',
            fileInfo: {
                id: attachmentId,
                filename: filename,
                size: fileBuffer.length,
                downloadedAt: new Date().toISOString()
            },
            requiresFrontendProcessing: true
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

import { requestJira } from '@forge/api';

export const getIssueAttachments = async (issueKey) => {
    try {
        if (!issueKey) {
            return {
                success: false,
                error: 'No issue key provided'
            };
        }
        
        const response = await requestJira(`/rest/api/3/issue/${issueKey}?fields=attachment`);
        
        if (response.status !== 200) {
            return {
                success: false,
                error: `Failed to fetch issue: ${response.status} ${response.statusText}`
            };
        }
        
        const issue = await response.json();
        const attachments = issue.fields.attachment || [];
        
        // Filter for Excel files
        const excelAttachments = attachments.filter(attachment => 
            attachment.filename && attachment.filename.match(/\.(xlsx|xls)$/i)
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
            attachments: formattedAttachments,
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
        if (!attachmentId) {
            return {
                success: false,
                error: 'No attachment ID provided'
            };
        }
        
        const response = await requestJira(`/rest/api/3/attachment/content/${attachmentId}`);
        
        if (response.status !== 200) {
            return {
                success: false,
                error: `Failed to download attachment: ${response.status} ${response.statusText}`
            };
        }
        
        const fileBuffer = await response.buffer();
        
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

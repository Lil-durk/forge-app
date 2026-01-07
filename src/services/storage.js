import { storage } from '@forge/api';
import { createLogger } from '../utils/logger.js';

const log = createLogger('StorageService');

export const storeFileInfo = async (fileId, fileInfo) => {
    await storage.set(`file_upload_${fileId}`, fileInfo);
    return { success: true, fileInfo };
};

export const getFileInfo = async (fileId) => {
    return await storage.get(`file_upload_${fileId}`);
};

export const addToRecentUploads = async (fileInfo) => {
    const recentUploads = await storage.get('recent_uploads') || [];
<<<<<<< HEAD
    
=======
>>>>>>> main
    recentUploads.unshift(fileInfo);
    
    if (recentUploads.length > 10) {
        recentUploads.splice(10);
    }
    
    await storage.set('recent_uploads', recentUploads);
    return recentUploads;
};

export const getRecentUploads = async () => {
    try {
        const recentUploads = await storage.get('recent_uploads') || [];
<<<<<<< HEAD
        
        log.debug('getRecentUploads', 'Retrieved recent uploads', { 
            uploadsCount: recentUploads.length 
        });
        
=======
>>>>>>> main
        return {
            success: true,
            uploads: recentUploads
        };
    } catch (error) {
<<<<<<< HEAD
        log.error('getRecentUploads', 'Failed to retrieve recent uploads', error);
=======
>>>>>>> main
        return {
            success: false,
            error: error.message
        };
    }
};

export const updateFileValidationStatus = async (fileId, validationResult) => {
    try {
        const fileInfo = await getFileInfo(fileId);
        if (fileInfo) {
            fileInfo.validationStatus = 'completed';
            fileInfo.validationResult = validationResult;
            fileInfo.validatedAt = new Date().toISOString();
            
            await storage.set(`file_upload_${fileId}`, fileInfo);
            
            const recentUploads = await storage.get('recent_uploads') || [];
            const index = recentUploads.findIndex(upload => upload.fileId === fileId);
            if (index !== -1) {
                recentUploads[index] = fileInfo;
                await storage.set('recent_uploads', recentUploads);
            }
            
            log.debug('updateFileValidationStatus', 'File validation status updated', {
                fileId,
                fileName: fileInfo.fileName,
                validationSuccess: validationResult?.success || false
            });
        } else {
            log.warn('updateFileValidationStatus', 'File info not found for validation update', { fileId });
        }
        
        return {
            success: true,
            fileInfo
        };
    } catch (error) {
<<<<<<< HEAD
        log.error('updateFileValidationStatus', 'Failed to update file validation status', error, { fileId });
=======
>>>>>>> main
        return {
            success: false,
            error: error.message
        };
    }
};

export const monitorFileUpload = async (uploadData) => {
    try {
        const { fileName, fileId, uploadTime, context } = uploadData;
        
        if (!fileName || !fileName.match(/\.(xlsx|xls)$/i)) {
            log.debug('monitorFileUpload', 'File upload skipped - not an Excel file', { fileName });
            return {
                success: false,
                message: 'Not an Excel file'
            };
        }
        
        const fileInfo = {
            fileName,
            fileId,
            uploadTime: uploadTime || new Date().toISOString(),
            context: context || {},
            status: 'uploaded',
            validationStatus: 'pending'
        };
        
        await storeFileInfo(fileId, fileInfo);
        await addToRecentUploads(fileInfo);
        
        log.info('monitorFileUpload', 'Excel file upload detected and stored', {
            fileName,
            fileId,
            hasContext: !!context
        });
        
        return {
            success: true,
            message: 'Excel file upload detected',
            fileInfo
        };
        
    } catch (error) {
<<<<<<< HEAD
        log.error('monitorFileUpload', 'Failed to monitor file upload', error, {
            fileName: uploadData?.fileName,
            fileId: uploadData?.fileId
        });
=======
>>>>>>> main
        return {
            success: false,
            error: error.message
        };
    }
};

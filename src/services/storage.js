/**
 * File storage and management service
 * Handles file upload monitoring, storage operations, and recent uploads tracking
 */

import { storage } from '@forge/api';

/**
 * Store file upload information in Forge storage
 * @param {string} fileId - Unique file identifier
 * @param {Object} fileInfo - File information object
 * @returns {Object} Success status and file info
 */
export const storeFileInfo = async (fileId, fileInfo) => {
    console.log('Storing file info to storage...');
    await storage.set(`file_upload_${fileId}`, fileInfo);
    console.log('File info stored successfully');
    
    return { success: true, fileInfo };
};

/**
 * Get file information from storage
 * @param {string} fileId - Unique file identifier
 * @returns {Object|null} File information or null if not found
 */
export const getFileInfo = async (fileId) => {
    return await storage.get(`file_upload_${fileId}`);
};

/**
 * Add file to recent uploads list and maintain list size
 * @param {Object} fileInfo - File information object
 * @returns {Array} Updated recent uploads list
 */
export const addToRecentUploads = async (fileInfo) => {
    console.log('Getting recent uploads from storage...');
    const recentUploads = await storage.get('recent_uploads') || [];
    console.log('Current recent uploads count:', recentUploads.length);
    
    recentUploads.unshift(fileInfo);
    
    // Keep only last 10 uploads
    if (recentUploads.length > 10) {
        console.log('Trimming uploads list to 10 items');
        recentUploads.splice(10);
    }
    
    console.log('Updating recent uploads in storage...');
    await storage.set('recent_uploads', recentUploads);
    console.log('Recent uploads updated successfully');
    
    return recentUploads;
};

/**
 * Get recent file uploads from storage
 * @returns {Object} Success status and uploads array
 */
export const getRecentUploads = async () => {
    console.log('=== GET RECENT UPLOADS CALLED ===');
    
    try {
        console.log('Fetching recent uploads from storage...');
        const recentUploads = await storage.get('recent_uploads') || [];
        console.log('Retrieved uploads count:', recentUploads.length);
        
        return {
            success: true,
            uploads: recentUploads
        };
    } catch (error) {
        console.error('getRecentUploads error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Update file validation status in storage
 * @param {string} fileId - Unique file identifier
 * @param {Object} validationResult - Validation result object
 * @returns {Object} Success status and updated file info
 */
export const updateFileValidationStatus = async (fileId, validationResult) => {
    try {
        const fileInfo = await getFileInfo(fileId);
        if (fileInfo) {
            fileInfo.validationStatus = 'completed';
            fileInfo.validationResult = validationResult;
            fileInfo.validatedAt = new Date().toISOString();
            
            await storage.set(`file_upload_${fileId}`, fileInfo);
            
            // Update in recent uploads list
            const recentUploads = await storage.get('recent_uploads') || [];
            const index = recentUploads.findIndex(upload => upload.fileId === fileId);
            if (index !== -1) {
                recentUploads[index] = fileInfo;
                await storage.set('recent_uploads', recentUploads);
            }
        }
        
        return {
            success: true,
            fileInfo
        };
    } catch (error) {
        console.error('updateFileValidationStatus error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Monitor and process file upload
 * @param {Object} uploadData - Upload data containing fileName, fileId, uploadTime, context
 * @returns {Object} Success status and file info
 */
export const monitorFileUpload = async (uploadData) => {
    console.log('monitorFileUpload called with:', uploadData);
    
    try {
        const { fileName, fileId, uploadTime, context } = uploadData;
        
        // Check if it's an Excel file
        if (!fileName || !fileName.match(/\.(xlsx|xls)$/i)) {
            return {
                success: false,
                message: 'Not an Excel file'
            };
        }
        
        // Create file upload information object
        const fileInfo = {
            fileName,
            fileId,
            uploadTime: uploadTime || new Date().toISOString(),
            context: context || {},
            status: 'uploaded',
            validationStatus: 'pending'
        };
        
        // Store file info and add to recent uploads
        await storeFileInfo(fileId, fileInfo);
        await addToRecentUploads(fileInfo);
        
        return {
            success: true,
            message: 'Excel file upload detected',
            fileInfo
        };
        
    } catch (error) {
        console.error('monitorFileUpload error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

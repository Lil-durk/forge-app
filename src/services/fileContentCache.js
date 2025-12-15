/**
 * File Content Cache Service
 * Handles file content hashing, comparison, and caching of validation results
 */

import { storage } from '@forge/api';
import crypto from 'crypto';

export const generateFileContentHash = (excelData, fileName) => {
    const contentString = JSON.stringify({
        fileName: fileName,
        data: excelData,
        rowCount: excelData.length,
        columnCount: excelData.length > 0 ? Object.keys(excelData[0]).length : 0
    });
    
    return crypto.createHash('sha256').update(contentString).digest('hex');
};

export const cacheValidationResult = async (contentHash, validationResult, metadata = {}) => {
    try {
        const cacheEntry = {
            contentHash,
            validationResult,
            metadata: {
                ...metadata,
                cachedAt: new Date().toISOString(),
                lastAccessed: new Date().toISOString()
            }
        };
        
        await storage.set(`validation_cache_${contentHash}`, cacheEntry);
        await addToCacheIndex(contentHash);
        
        return { success: true };
        
    } catch (error) {
        console.error('Error caching validation result:', error.message);
        return { success: false, error: error.message };
    }
};

export const getCachedValidationResult = async (contentHash) => {
    try {
        const cacheEntry = await storage.get(`validation_cache_${contentHash}`);
        
        if (cacheEntry) {
            // Update last accessed time
            cacheEntry.metadata.lastAccessed = new Date().toISOString();
            await storage.set(`validation_cache_${contentHash}`, cacheEntry);
            
            return cacheEntry;
        }
        
        return null;
        
    } catch (error) {
        console.error('Error retrieving cached validation result:', error.message);
        return null;
    }
};

export const checkFileContentChange = async (excelData, fileName) => {
    try {
        const currentHash = generateFileContentHash(excelData, fileName);
        
        // Check if we have a cached result for this content
        const cachedResult = await getCachedValidationResult(currentHash);
        
        return {
            contentHash: currentHash,
            hasChanged: !cachedResult,
            cachedResult: cachedResult,
            isIdenticalContent: !!cachedResult
        };
        
    } catch (error) {
        console.error('Error checking file content change:', error.message);
        return {
            contentHash: null,
            hasChanged: true,
            cachedResult: null,
            isIdenticalContent: false,
            error: error.message
        };
    }
};

const addToCacheIndex = async (contentHash) => {
    try {
        const cacheIndex = await storage.get('validation_cache_index') || [];
        
        // Add to beginning of array if not already present
        if (!cacheIndex.includes(contentHash)) {
            cacheIndex.unshift(contentHash);
            
            // Keep only last 50 cached results to prevent storage bloat
            if (cacheIndex.length > 50) {
                const removedHashes = cacheIndex.splice(50);
                
                // Clean up old cache entries
                for (const hash of removedHashes) {
                    await storage.delete(`validation_cache_${hash}`);
                }
            }
            
            await storage.set('validation_cache_index', cacheIndex);
        }
        
    } catch (error) {
        console.error('Error managing cache index:', error.message);
    }
};

export const clearValidationCache = async () => {
    try {
        const cacheIndex = await storage.get('validation_cache_index') || [];
        
        // Delete all cached entries
        for (const hash of cacheIndex) {
            await storage.delete(`validation_cache_${hash}`);
        }
        
        // Clear the index
        await storage.delete('validation_cache_index');
        
        return { success: true, clearedCount: cacheIndex.length };
        
    } catch (error) {
        console.error('Error clearing validation cache:', error.message);
        return { success: false, error: error.message };
    }
};

export const getCacheStatistics = async () => {
    try {
        const cacheIndex = await storage.get('validation_cache_index') || [];
        
        const stats = {
            totalCachedResults: cacheIndex.length,
            cacheHashes: cacheIndex.map(hash => hash.substring(0, 8) + '...')
        };
        
        return { success: true, stats };
        
    } catch (error) {
        console.error('Error getting cache statistics:', error.message);
        return { success: false, error: error.message };
    }
};

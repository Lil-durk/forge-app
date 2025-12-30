/**
 * Utility functions for file processing and Excel handling
 * Handles file upload, Excel parsing, and content caching
 */

import * as XLSX from 'xlsx';
import { invoke } from '@forge/bridge';

/**
 * Process an uploaded Excel file
 * @param {File} file - The uploaded file
 * @param {Object} state - State setters and current values
 * @returns {Promise<void>}
 */
export const processUploadedFile = async (file, {
  setFileName,
  setError,
  setValidationResult,
  setIsUsingCachedResult,
  setCurrentFileHash,
  setLoading,
  setExcelData,
  setShowRequirementsWizard
}) => {
  console.log('=== PROCESSING UPLOADED FILE ===');
  console.log('File name:', file ? file.name : 'No file');
  
  if (!file) {
    console.log('No file provided, returning early');
    return;
  }
  
  setFileName(file.name);
  setError('');
  setValidationResult(null);
  setIsUsingCachedResult(false);
  setCurrentFileHash(null);
  setLoading(true);

  const reader = new FileReader();
  
  reader.onload = async (e) => {
    try {
      console.log('File read successfully, parsing Excel...');
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: '', // Default value for empty cells - preserves them as empty strings
        blankrows: true // Include blank rows in the output
      });
      
      console.log('Excel parsed successfully:', jsonData.length, 'rows');
      setExcelData(jsonData);
      
      // Check if file content has changed compared to previous uploads
      const cachedResult = await checkFileContentCache(jsonData, file.name);
      
      if (cachedResult.isIdenticalContent && cachedResult.cachedResult) {
        // Same file content - use cached results
        console.log('=== USING CACHED VALIDATION RESULT ===');
        console.log('Cached result from:', cachedResult.cachedResult.metadata.cachedAt);
        
        setValidationResult(cachedResult.cachedResult.validationResult);
        setIsUsingCachedResult(true);
        setLoading(false);
        setError('');
        
        return;
      } else {
        console.log('=== NEW FILE CONTENT DETECTED ===');
        console.log('Will proceed with fresh validation');
        
        if (cachedResult.contentHash) {
          setCurrentFileHash(cachedResult.contentHash);
        }
      }
      
      setLoading(false);
      
      console.log('=== RUNNING AUTOMATIC STANDARD VALIDATION ===');
      
      const { validateData } = await import('./validation.js');
      
      setLoading(true);
      await validateData(jsonData, file.name, {
        setError,
        setLoading,
        setValidationResult,
        currentFileHash: cachedResult.contentHash
      });
      
      // Show Requirements Wizard for new file content (currently disabled)
      // setShowRequirementsWizard(true);
      
    } catch (error) {
      console.error('Excel processing error:', error.message);
      setError('Error reading Excel file: ' + error.message);
      setLoading(false);
    }
  };
  
  reader.onerror = (error) => {
    console.error('File reader error:', error);
    setError('Error reading file');
    setLoading(false);
  };
  
  reader.readAsArrayBuffer(file);
};

/**
 * Check file content cache for identical content
 * @param {Array} jsonData - Parsed Excel data
 * @param {string} fileName - Name of the file
 * @returns {Promise<Object>} Cache check result
 */
export const checkFileContentCache = async (jsonData, fileName) => {
  console.log('=== CHECKING FILE CONTENT CHANGE ===');
  
  try {
    const contentCheck = await invoke('checkFileContentChange', {
      excelData: jsonData,
      fileName: fileName
    });
    
    if (contentCheck.contentHash) {
      console.log('File content hash:', contentCheck.contentHash.substring(0, 8) + '...');
      return {
        contentHash: contentCheck.contentHash,
        isIdenticalContent: contentCheck.isIdenticalContent,
        cachedResult: contentCheck.cachedResult
      };
    }
  } catch (cacheError) {
    console.error('Error checking file content cache:', cacheError.message);
    // Continue with normal flow if caching fails
  }
  
  return {
    contentHash: null,
    isIdenticalContent: false,
    cachedResult: null
  };
};

/**
 * Validate file type and extension
 * @param {File} file - The file to validate
 * @returns {boolean} True if file is valid Excel file
 */
export const validateFileType = (file) => {
  return file && file.name.match(/\.(xlsx|xls)$/i);
};

/**
 * Handle file upload event
 * @param {Event} event - File input change event
 * @param {Function} processFile - Function to process the file
 * @param {Function} setError - Error setter function
 */
export const handleFileUpload = (event, processFile, setError) => {
  const files = event.target.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (validateFileType(file)) {
      processFile(file);
    } else {
      setError('Please select an Excel file (.xlsx or .xls)');
    }
  }
};

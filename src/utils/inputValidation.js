/**
 * Input validation utilities for ValidAIte
 * Provides secure validation for user inputs and data
 */

import { createLogger } from './logger.js';

const log = createLogger('InputValidation');

/**
 * Maximum file size in bytes (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Maximum number of rows in Excel data
 */
const MAX_EXCEL_ROWS = 10000;

/**
 * Maximum number of columns in Excel data
 */
const MAX_EXCEL_COLS = 100;

/**
 * Allowed file extensions
 */
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

/**
 * Validate Excel data structure and size
 * @param {Array} excelData - Array of Excel rows
 * @param {string} context - Context for validation (e.g., 'file upload', 'validation request')
 * @throws {Error} If validation fails
 */
export const validateExcelData = (excelData, context = 'data processing') => {
  if (!excelData) {
    log.error('validateExcelData', 'Excel data is null or undefined', { context });
    throw new Error('Excel data is required');
  }

  if (!Array.isArray(excelData)) {
    log.error('validateExcelData', 'Excel data is not an array', { context, type: typeof excelData });
    throw new Error('Excel data must be an array');
  }

  if (excelData.length === 0) {
    log.warn('Empty Excel data received', { context });
    throw new Error('Excel data cannot be empty');
  }

  if (excelData.length > MAX_EXCEL_ROWS) {
    log.error('validateExcelData', 'Excel data exceeds maximum rows', { 
      context, 
      rows: excelData.length, 
      maxRows: MAX_EXCEL_ROWS 
    });
    throw new Error(`Excel file too large. Maximum ${MAX_EXCEL_ROWS} rows allowed, got ${excelData.length}`);
  }

  // Validate first row to check column count
  const firstRow = excelData[0];
  if (firstRow && Array.isArray(firstRow) && firstRow.length > MAX_EXCEL_COLS) {
    log.error('validateExcelData', 'Excel data exceeds maximum columns', { 
      context, 
      cols: firstRow.length, 
      maxCols: MAX_EXCEL_COLS 
    });
    throw new Error(`Excel file has too many columns. Maximum ${MAX_EXCEL_COLS} columns allowed, got ${firstRow.length}`);
  }

  log.debug('Excel data validation passed', { 
    context, 
    rows: excelData.length, 
    cols: firstRow?.length || 0 
  });

  return true;
};

/**
 * Validate filename and extension
 * @param {string} filename - The filename to validate
 * @throws {Error} If validation fails
 */
export const validateFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    log.error('validateFilename', 'Invalid filename', { filename: filename || 'null' });
    throw new Error('Valid filename is required');
  }

  // Remove path components for security
  const cleanFilename = filename.split(/[/\\]/).pop();
  
  if (cleanFilename.length > 255) {
    log.error('validateFilename', 'Filename too long', { length: cleanFilename.length });
    throw new Error('Filename is too long (maximum 255 characters)');
  }

  // Check extension
  const extension = cleanFilename.toLowerCase().slice(cleanFilename.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    log.error('validateFilename', 'Invalid file extension', { 
      filename: cleanFilename, 
      extension,
      allowed: ALLOWED_EXTENSIONS 
    });
    throw new Error(`Invalid file type. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  // Check for dangerous characters
  const dangerousPattern = /[<>:"|?*\x00-\x1f]/;
  if (dangerousPattern.test(cleanFilename)) {
    log.error('validateFilename', 'Filename contains dangerous characters', { filename: cleanFilename });
    throw new Error('Filename contains invalid characters');
  }

  log.debug('Filename validation passed', { filename: cleanFilename });
  return cleanFilename;
};

/**
 * Validate file size
 * @param {number} fileSize - Size of file in bytes
 * @throws {Error} If validation fails
 */
export const validateFileSize = (fileSize) => {
  if (typeof fileSize !== 'number' || fileSize < 0) {
    log.error('validateFileSize', 'Invalid file size', { fileSize });
    throw new Error('Invalid file size');
  }

  if (fileSize === 0) {
    log.warn('Empty file detected', { fileSize });
    throw new Error('File cannot be empty');
  }

  if (fileSize > MAX_FILE_SIZE) {
    log.error('validateFileSize', 'File too large', { 
      fileSize, 
      maxSize: MAX_FILE_SIZE,
      sizeMB: Math.round(fileSize / 1024 / 1024 * 100) / 100
    });
    throw new Error(`File too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`);
  }

  log.debug('File size validation passed', { 
    fileSize, 
    sizeMB: Math.round(fileSize / 1024 / 1024 * 100) / 100 
  });
  return true;
};

/**
 * Validate validation rules object
 * @param {Object} validationRules - Validation rules to check
 * @throws {Error} If validation fails
 */
export const validateValidationRules = (validationRules) => {
  if (!validationRules || typeof validationRules !== 'object') {
    log.error('validateValidationRules', 'Invalid validation rules', { 
      rules: validationRules,
      type: typeof validationRules
    });
    throw new Error('Validation rules must be an object');
  }

  // Add specific validation for rule structure if needed
  log.debug('Validation rules validation passed', { rulesCount: Object.keys(validationRules).length });
  return true;
};

/**
 * Sanitize string input to prevent injection attacks
 * @param {string} input - String to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input, maxLength = 1000) => {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    log.warn('String truncated due to length', { 
      originalLength: input.length, 
      maxLength,
      truncatedLength: sanitized.length 
    });
  }

  return sanitized;
};

/**
 * Validate request payload structure
 * @param {Object} payload - Request payload to validate
 * @param {Array<string>} requiredFields - Required field names
 * @throws {Error} If validation fails
 */
export const validatePayload = (payload, requiredFields = []) => {
  if (!payload || typeof payload !== 'object') {
    log.error('validatePayload', 'Invalid payload structure', { payload });
    throw new Error('Request payload must be an object');
  }

  const missingFields = requiredFields.filter(field => !(field in payload));
  if (missingFields.length > 0) {
    log.error('validatePayload', 'Missing required fields', { 
      missingFields, 
      requiredFields,
      providedFields: Object.keys(payload)
    });
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  log.debug('Payload validation passed', { 
    requiredFields, 
    providedFields: Object.keys(payload)
  });
  return true;
};

export default {
  validateExcelData,
  validateFilename,
  validateFileSize,
  validateValidationRules,
  sanitizeString,
  validatePayload,
  MAX_FILE_SIZE,
  MAX_EXCEL_ROWS,
  MAX_EXCEL_COLS,
  ALLOWED_EXTENSIONS
};

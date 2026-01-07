/**
 * Application Constants and Configuration
 * Centralized configuration for timeouts, limits, and other constants
 */

// API Configuration
export const API_CONFIG = {
  REQUEST_TIMEOUT: parseInt(process.env.VALIDAITE_REQUEST_TIMEOUT || '30000', 10),
  MAX_FILE_SIZE: parseInt(process.env.VALIDAITE_MAX_FILE_SIZE || '10485760', 10), // 10MB default
  MAX_ROWS: parseInt(process.env.VALIDAITE_MAX_ROWS || '10000', 10),
  CACHE_TTL: parseInt(process.env.VALIDAITE_CACHE_TTL || '86400000', 10), // 24 hours
};

// Validation Configuration
export const VALIDATION_CONFIG = {
  MAX_PROMPT_LENGTH: 10000,
  MAX_VALIDATION_RULES_LENGTH: 1000,
  MAX_STRING_LENGTH: 5000,
  HISTORICAL_INSIGHTS: {
    ENABLE_MOCK: process.env.NODE_ENV === 'development',
    API_ENDPOINT: process.env.VALIDAITE_INSIGHTS_ENDPOINT,
  }
};

// UI Configuration
export const UI_CONFIG = {
  POLLING_INTERVAL: 3000,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
};

// Error Messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds maximum allowed limit',
  INVALID_FILE_TYPE: 'Invalid file type. Only Excel files are supported',
  VALIDATION_FAILED: 'Validation failed. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  TIMEOUT_ERROR: 'Request timed out. Please try again',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_DATA: 'Invalid data format',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  VALIDATION_COMPLETE: 'Validation completed successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  CACHE_CLEARED: 'Cache cleared successfully',
};

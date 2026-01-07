/**
 * Standardized Error Handling Utility
 * Provides consistent error handling patterns across the application
 */

import { createLogger } from './logger.js';
import { ERROR_MESSAGES } from '../config/constants.js';

const log = createLogger('ErrorHandler');

/**
 * Standard error response format
 */
export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error codes for different types of errors
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FILE_ERROR: 'FILE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AI_API_ERROR: 'AI_API_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  CONFIG_ERROR: 'CONFIG_ERROR'
};

/**
 * Creates a standardized error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {any} details - Additional error details
 * @returns {Object} Standardized error response
 */
export const createErrorResponse = (message, code = ERROR_CODES.VALIDATION_ERROR, details = null) => {
  return {
    success: false,
    error: {
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    },
    data: null
  };
};

/**
 * Creates a standardized success response
 * @param {any} data - Success data
 * @param {string} message - Success message
 * @returns {Object} Standardized success response
 */
export const createSuccessResponse = (data, message = 'Operation completed successfully') => {
  return {
    success: true,
    error: null,
    data,
    message,
    timestamp: new Date().toISOString()
  };
};

/**
 * Handles and logs errors with context
 * @param {Error} error - The error to handle
 * @param {string} context - Context where error occurred
 * @param {Object} additionalInfo - Additional error context
 * @returns {AppError} Processed error
 */
export const handleError = (error, context, additionalInfo = {}) => {
  log.error(context, 'Error occurred', error, additionalInfo);

  // If it's already an AppError, just return it
  if (error instanceof AppError) {
    return error;
  }

  // Map common error patterns to specific error types
  if (error.message.includes('timeout')) {
    return new AppError(
      ERROR_MESSAGES.TIMEOUT_ERROR,
      ERROR_CODES.TIMEOUT_ERROR,
      408
    );
  }

  if (error.message.includes('network') || error.code === 'ECONNREFUSED') {
    return new AppError(
      ERROR_MESSAGES.NETWORK_ERROR,
      ERROR_CODES.NETWORK_ERROR,
      503
    );
  }

  if (error.message.includes('OpenAI') || error.message.includes('API')) {
    return new AppError(
      'AI service temporarily unavailable',
      ERROR_CODES.AI_API_ERROR,
      503
    );
  }

  if (error.message.includes('unauthorized') || error.status === 401) {
    return new AppError(
      ERROR_MESSAGES.UNAUTHORIZED,
      ERROR_CODES.AUTH_ERROR,
      401
    );
  }

  // Default to generic error
  return new AppError(
    error.message || 'An unexpected error occurred',
    ERROR_CODES.VALIDATION_ERROR,
    500
  );
};

/**
 * Async error wrapper for better error handling
 * @param {Function} fn - Async function to wrap
 * @param {string} context - Context for error logging
 * @returns {Function} Wrapped function with error handling
 */
export const withErrorHandling = (fn, context) => {
  return async (...args) => {
    try {
      const result = await fn(...args);
      return createSuccessResponse(result);
    } catch (error) {
      const processedError = handleError(error, context, { args });
      return createErrorResponse(
        processedError.message,
        processedError.code,
        {
          statusCode: processedError.statusCode,
          originalError: error.message
        }
      );
    }
  };
};

/**
 * Validates required parameters
 * @param {Object} params - Parameters to validate
 * @param {Array} requiredFields - Array of required field names
 * @throws {AppError} If validation fails
 */
export const validateRequiredParams = (params, requiredFields) => {
  const missing = requiredFields.filter(field => 
    params[field] === undefined || params[field] === null
  );

  if (missing.length > 0) {
    throw new AppError(
      `Missing required parameters: ${missing.join(', ')}`,
      ERROR_CODES.VALIDATION_ERROR,
      400
    );
  }
};

/**
 * Utility functions for data validation
 * Handles standard and custom validation logic with caching
 */

import { invoke } from '@forge/bridge';

/**
 * Validate data using standard AI validation
 * @param {Array} data - Excel data to validate
 * @param {string} fileName - Name of the file being validated
 * @param {Object} state - State setters and current values
 * @returns {Promise<void>}
 */
export const validateData = async (data, fileName, {
  setError,
  setLoading,
  setValidationResult,
  currentFileHash
}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Starting data validation for:', fileName);
  }
  
  if (!data || data.length === 0) {
    setError('No data to validate');
    setLoading(false);
    return;
  }

  try {
    // Use standard validation - backend handles caching automatically
    const result = await invoke('validateExcelData', {
      excelData: data,
      validationRules: 'Standard data validation - check for data type consistency and format issues'
    });
    
    if (result.success) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Validation completed:', {
          score: result.validation?.overallScore,
          hasHistoricalInsights: !!result.historicalInsights,
          fromCache: result.fromCache
        });
      }
      setValidationResult(result);
    } else {
      setError(result.error?.message || result.error || 'Validation failed');
    }
  } catch (error) {
    const errorMessage = error.message || 'Error during validation';
    if (process.env.NODE_ENV === 'development') {
      console.error('Validation error:', errorMessage);
    }
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

/**
 * Validate data with custom requirements
 * @param {Array} excelData - Excel data to validate
 * @param {Object} wizardResult - Requirements wizard result
 * @param {string} fileName - Name of the file being validated
 * @param {Object} state - State setters and current values
 * @returns {Promise<void>}
 */
export const validateWithCustomRequirements = async (excelData, wizardResult, fileName, {
  setError,
  setLoading,
  setValidationResult,
  setCustomRequirements
}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Starting custom validation with requirements:', wizardResult);
  }
  
  setCustomRequirements(wizardResult);
  setLoading(true);
  
  try {
    // Validate with custom requirements - backend handles caching
    const result = await invoke('validateWithCustomRequirements', {
      excelData: excelData,
      requirements: wizardResult.requirements,
      useCase: wizardResult.useCase || wizardResult.customPurpose
    });
    
    if (result.success) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Custom validation completed:', {
          score: result.validation?.overallScore,
          fromCache: result.fromCache
        });
      }
      setValidationResult(result);
    } else {
      setError(result.error?.message || result.error || 'Custom validation failed');
    }
  } catch (error) {
    const errorMessage = error.message || 'Error during custom validation';
    if (process.env.NODE_ENV === 'development') {
      console.error('Custom validation error:', errorMessage);
    }
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

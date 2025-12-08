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
  console.log('=== STARTING ENHANCED DATA VALIDATION ===');
  
  if (!data || data.length === 0) {
    setError('No data to validate');
    setLoading(false);
    return;
  }

  try {
    // Use standard validation
    const result = await invoke('validateExcelData', {
      excelData: data,
      validationRules: 'Standard data validation - check for missing values, data type consistency, and format issues'
    });
    
    if (result.success) {
      console.log('Enhanced validation completed:', {
        score: result.validation?.overallScore,
        hasHistoricalInsights: !!result.historicalInsights,
        totalHistoricalTickets: result.historicalInsights?.totalHistoricalTickets || 0
      });
      setValidationResult(result);
      
      // Cache the validation result if we have a file hash
      await cacheValidationResult(currentFileHash, result, {
        fileName: fileName,
        validationType: 'standard',
        validationRules: 'Standard data validation - check for missing values, data type consistency, and format issues'
      });
    } else {
      setError(result.error || 'Enhanced validation failed');
    }
  } catch (error) {
    console.error('Enhanced validation error:', error.message);
    setError('Error during enhanced validation: ' + error.message);
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
  setCustomRequirements,
  currentFileHash
}) => {
  console.log('=== REQUIREMENTS WIZARD COMPLETED ===');
  console.log('Wizard result:', wizardResult);
  
  setCustomRequirements(wizardResult);
  setLoading(true);
  
  try {
    // Validate with custom requirements
    const result = await invoke('validateWithCustomRequirements', {
      excelData: excelData,
      requirements: wizardResult.requirements,
      useCase: wizardResult.useCase || wizardResult.customPurpose
    });
    
    if (result.success) {
      console.log('Custom validation completed:', result.validation);
      setValidationResult(result);
      
      // Cache the validation result if we have a file hash
      await cacheValidationResult(currentFileHash, result, {
        fileName: fileName,
        validationType: 'custom',
        requirements: wizardResult.requirements,
        useCase: wizardResult.useCase || wizardResult.customPurpose
      });
    } else {
      setError(result.error || 'Custom validation failed');
    }
  } catch (error) {
    console.error('Custom validation error:', error.message);
    setError('Error during custom validation: ' + error.message);
  } finally {
    setLoading(false);
  }
};

/**
 * Cache validation result for future use
 * @param {string} currentFileHash - Hash of the current file content
 * @param {Object} result - Validation result to cache
 * @param {Object} metadata - Additional metadata for the cache
 * @returns {Promise<void>}
 */
export const cacheValidationResult = async (currentFileHash, result, metadata) => {
  if (!currentFileHash) {
    return;
  }

  console.log('=== CACHING VALIDATION RESULT ===');
  try {
    await invoke('cacheValidationResult', {
      contentHash: currentFileHash,
      validationResult: result,
      metadata: metadata
    });
    console.log('Validation result cached successfully');
  } catch (cacheError) {
    console.error('Error caching validation result:', cacheError.message);
    // Don't fail the validation if caching fails
  }
};

/**
 * Test API key configuration
 * @param {Object} state - State setters for API test
 * @returns {Promise<void>}
 */
export const testApiKeyConfiguration = async ({
  setTestingApi,
  setApiTestResult
}) => {
  console.log('=== TESTING API KEY CONFIGURATION ===');
  setTestingApi(true);
  setApiTestResult(null);
  
  try {
    const result = await invoke('testApiKeyConfiguration');
    setApiTestResult(result);
  } catch (error) {
    setApiTestResult({
      success: false,
      error: error.message
    });
  } finally {
    setTestingApi(false);
  }
};

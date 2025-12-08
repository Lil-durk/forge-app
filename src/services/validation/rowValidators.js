/**
 * Row-level validation functions
 */

const TypeValidators = require('./typeValidators');

class RowValidators {
  static validateRequiredFields(row, rowNumber, requiredFields, results) {
    requiredFields.forEach(field => {
      const value = row[field];
      if (value === undefined || value === null || value === '' || 
          (typeof value === 'string' && value.trim() === '')) {
        results.issues.push({
          type: 'error',
          field: field,
          row: rowNumber,
          message: `${field} is required`,
          suggestion: `Please provide a value for ${field}`,
          priority: 'high'
        });
        results.isValid = false;
      }
    });
  }

  static validateDataTypes(row, rowNumber, dataTypes, results) {
    Object.entries(dataTypes).forEach(([field, expectedType]) => {
      const value = row[field];
      if (value !== undefined && value !== null && value !== '') {
        if (!TypeValidators.isValidType(value, expectedType)) {
          results.issues.push({
            type: 'error',
            field: field,
            row: rowNumber,
            message: `${field} must be a valid ${expectedType}`,
            suggestion: TypeValidators.getTypeSuggestion(expectedType),
            priority: 'high'
          });
          results.isValid = false;
        }
      }
    });
  }

  static validateRanges(row, rowNumber, ranges, results) {
    Object.entries(ranges).forEach(([field, range]) => {
      const value = row[field];
      if (value !== undefined && value !== null && value !== '') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          if (range.min !== undefined && numValue < range.min) {
            results.issues.push({
              type: 'warning',
              field: field,
              row: rowNumber,
              message: `${field} (${value}) is below minimum value (${range.min})`,
              suggestion: `${field} should be at least ${range.min}`,
              priority: 'medium'
            });
          }
          if (range.max !== undefined && numValue > range.max) {
            results.issues.push({
              type: 'warning',
              field: field,
              row: rowNumber,
              message: `${field} (${value}) exceeds maximum value (${range.max})`,
              suggestion: `${field} should be at most ${range.max}`,
              priority: 'medium'
            });
          }
        }
      }
    });
  }

  static validatePatterns(row, rowNumber, patterns, results) {
    Object.entries(patterns).forEach(([field, pattern]) => {
      const value = row[field];
      if (value !== undefined && value !== null && value !== '') {
        const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        if (!regex.test(value.toString())) {
          results.issues.push({
            type: 'error',
            field: field,
            row: rowNumber,
            message: `${field} format is invalid`,
            suggestion: TypeValidators.getPatternSuggestion(field, pattern),
            priority: 'high'
          });
          results.isValid = false;
        }
      }
    });
  }

  static runCustomValidators(row, rowNumber, customValidators, results) {
    Object.entries(customValidators).forEach(([field, validator]) => {
      const value = row[field];
      if (value !== undefined && value !== null && value !== '') {
        try {
          const validationResult = validator(value, row, rowNumber);
          if (validationResult && !validationResult.isValid) {
            results.issues.push({
              type: validationResult.type || 'warning',
              field: field,
              row: rowNumber,
              message: validationResult.message,
              suggestion: validationResult.suggestion || 'Please check this value',
              priority: validationResult.priority || 'medium'
            });
            if (validationResult.type === 'error') {
              results.isValid = false;
            }
          }
        } catch (error) {
          console.error(`Custom validator error for field ${field}:`, error);
        }
      }
    });
  }

  static validateUniqueConstraints(data, rules, results) {
    rules.uniqueFields.forEach(field => {
      const values = new Map();
      data.forEach((row, index) => {
        const value = row[field];
        if (value !== undefined && value !== null && value !== '') {
          const normalizedValue = value.toString().toLowerCase().trim();
          if (values.has(normalizedValue)) {
            const firstOccurrence = values.get(normalizedValue);
            results.issues.push({
              type: 'error',
              field: field,
              row: index + 1,
              message: `Duplicate value "${value}" found`,
              suggestion: `${field} must be unique. First occurrence at row ${firstOccurrence}`,
              priority: 'high'
            });
            results.isValid = false;
          } else {
            values.set(normalizedValue, index + 1);
          }
        }
      });
    });
  }
}

module.exports = RowValidators;

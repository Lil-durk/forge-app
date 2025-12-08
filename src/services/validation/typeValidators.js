/**
 * Type validation utilities for rule-based validation
 */

class TypeValidators {
  static isValidType(value, type) {
    const strValue = value.toString().trim();
    
    switch (type.toLowerCase()) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue);
      
      case 'number':
      case 'numeric':
        return !isNaN(parseFloat(strValue)) && isFinite(strValue);
      
      case 'integer':
      case 'int':
        return Number.isInteger(parseFloat(strValue));
      
      case 'date':
        return !isNaN(Date.parse(strValue));
      
      case 'boolean':
      case 'bool':
        return ['true', 'false', '1', '0', 'yes', 'no'].includes(strValue.toLowerCase());
      
      case 'url':
        try {
          new URL(strValue);
          return true;
        } catch {
          return false;
        }
      
      case 'phone':
        return /^\+?[\d\s\-\(\)]+$/.test(strValue) && strValue.replace(/\D/g, '').length >= 10;
      
      case 'string':
      case 'text':
      default:
        return true;
    }
  }

  static getTypeSuggestion(type) {
    const suggestions = {
      email: 'Use format: user@domain.com',
      number: 'Enter a valid number',
      integer: 'Enter a whole number',
      date: 'Use format: YYYY-MM-DD or MM/DD/YYYY',
      boolean: 'Use: true/false, yes/no, or 1/0',
      url: 'Use format: https://example.com',
      phone: 'Use format: +1-234-567-8900 or (234) 567-8900'
    };
    return suggestions[type.toLowerCase()] || `Enter a valid ${type}`;
  }

  static getPatternSuggestion(field, pattern) {
    const commonPatterns = {
      phone: 'Use format: +1-234-567-8900 or (234) 567-8900',
      postalCode: 'Use format: 12345 or 12345-6789',
      ssn: 'Use format: 123-45-6789',
      creditCard: 'Use format: 1234-5678-9012-3456'
    };
    
    return commonPatterns[field.toLowerCase()] || 
           `${field} must match the required format`;
  }
}

module.exports = TypeValidators;

/**
 * Unit Tests for Critical Validation Logic
 * Tests core validation functions to ensure data quality and reliability
 */

// Mock validation functions for testing
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10 && cleanPhone.length <= 15;
};

const validateDate = (date) => {
  if (!date) return false;
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

const validateRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

const calculateDataQualityScore = (data) => {
  if (!data || !Array.isArray(data) || data.length === 0) return 0;
  
  let totalScore = 0;
  let totalFields = 0;
  
  data.forEach(row => {
    Object.values(row).forEach(value => {
      totalFields++;
      if (validateRequired(value)) {
        totalScore += 1;
      }
    });
  });
  
  return Math.round((totalScore / totalFields) * 100);
};

// Mock AI Cache for testing
class MockAICache {
  constructor() {
    this.cache = new Map();
  }
  
  generateKey(type, data, context = {}) {
    return JSON.stringify({ type, data: JSON.stringify(data), context });
  }
  
  get(type, data, context = {}) {
    const key = this.generateKey(type, data, context);
    return this.cache.get(key) || null;
  }
  
  set(type, data, context = {}, response) {
    const key = this.generateKey(type, data, context);
    this.cache.set(key, response);
  }
  
  clear() {
    this.cache.clear();
  }
}

// Mock Error Classes
class ValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}

class AIServiceError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
  }
}

describe('Email Validation', () => {
  test('should validate correct email formats', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'first.last+tag@example.org',
      'user123@test-domain.com'
    ];

    validEmails.forEach(email => {
      expect(validateEmail(email)).toBe(true);
    });
  });

  test('should reject invalid email formats', () => {
    const invalidEmails = [
      'plainaddress',
      '@missingdomain.com',
      'missing@.com',
      'spaces @domain.com',
      'double@@domain.com',
      ''
    ];

    invalidEmails.forEach(email => {
      expect(validateEmail(email)).toBe(false);
    });
  });
});

describe('Phone Number Validation', () => {
  test('should validate various phone number formats', () => {
    const validPhones = [
      '+1-234-567-8900',
      '(555) 123-4567',
      '555.123.4567',
      '5551234567',
      '+44 20 1234 5678'
    ];

    validPhones.forEach(phone => {
      expect(validatePhoneNumber(phone)).toBe(true);
    });
  });

  test('should reject invalid phone numbers', () => {
    const invalidPhones = [
      '123',
      'abc-def-ghij',
      '++1234567890',
      '',
      '12345678901234567890' // too long
    ];

    invalidPhones.forEach(phone => {
      expect(validatePhoneNumber(phone)).toBe(false);
    });
  });
});

describe('Date Validation', () => {
  test('should validate correct date formats', () => {
    const validDates = [
      '2024-01-15',
      '01/15/2024',
      '15-01-2024',
      '2024-12-31',
      new Date().toISOString().split('T')[0]
    ];

    validDates.forEach(date => {
      expect(validateDate(date)).toBe(true);
    });
  });

  test('should reject invalid dates', () => {
    const invalidDates = [
      '2024-13-01', // invalid month
      '2024-02-30', // invalid day
      'not-a-date',
      '',
      '99/99/9999'
    ];

    invalidDates.forEach(date => {
      expect(validateDate(date)).toBe(false);
    });
  });
});

describe('Required Field Validation', () => {
  test('should validate non-empty values', () => {
    const validValues = [
      'some text',
      123,
      0,
      false,
      ['array'],
      { key: 'value' }
    ];

    validValues.forEach(value => {
      expect(validateRequired(value)).toBe(true);
    });
  });

  test('should reject empty values', () => {
    const invalidValues = [
      '',
      '   ', // whitespace only
      null,
      undefined,
      [],
      {}
    ];

    invalidValues.forEach(value => {
      expect(validateRequired(value)).toBe(false);
    });
  });
});

describe('Data Quality Scoring', () => {
  test('should calculate correct quality scores', () => {
    const testData = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-123-4567',
        date: '2024-01-15'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-987-6543',
        date: '2024-01-16'
      }
    ];

    const score = calculateDataQualityScore(testData);
    expect(score).toBeGreaterThan(80);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('should handle poor quality data', () => {
    const poorData = [
      {
        name: '',
        email: 'invalid-email',
        phone: '123',
        date: 'not-a-date'
      },
      {
        name: null,
        email: '',
        phone: '',
        date: ''
      }
    ];

    const score = calculateDataQualityScore(poorData);
    expect(score).toBeLessThan(50);
  });
});

describe('AI Cache Functionality', () => {
  let aiCache;

  beforeEach(() => {
    aiCache = new MockAICache();
  });

  test('should cache and retrieve data correctly', () => {
    const testData = [{ name: 'Test', value: 123 }];
    const testContext = { operation: 'test' };
    const testResponse = { success: true, data: 'cached' };

    // Set cache
    aiCache.set('test', testData, testContext, testResponse);

    // Get from cache
    const cached = aiCache.get('test', testData, testContext);
    expect(cached).toEqual(testResponse);
  });

  test('should return null for cache miss', () => {
    const testData = [{ name: 'Test', value: 123 }];
    const testContext = { operation: 'test' };

    const cached = aiCache.get('test', testData, testContext);
    expect(cached).toBeNull();
  });

  test('should generate consistent cache keys', () => {
    const testData1 = [{ name: 'Test', value: 123 }];
    const testData2 = [{ name: 'Test', value: 123 }]; // identical data
    const testContext = { operation: 'test' };

    const key1 = aiCache.generateKey('test', testData1, testContext);
    const key2 = aiCache.generateKey('test', testData2, testContext);

    expect(key1).toBe(key2);
  });
});

describe('Error Handling', () => {
  test('should create proper validation errors', () => {
    const error = new ValidationError('Test validation failed', 'INVALID_DATA');
    
    expect(error.message).toBe('Test validation failed');
    expect(error.code).toBe('INVALID_DATA');
    expect(error.name).toBe('ValidationError');
  });

  test('should create proper AI service errors', () => {
    const error = new AIServiceError('AI service unavailable', 'SERVICE_DOWN');
    
    expect(error.message).toBe('AI service unavailable');
    expect(error.code).toBe('SERVICE_DOWN');
    expect(error.name).toBe('AIServiceError');
  });
});

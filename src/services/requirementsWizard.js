/**
 * Requirements Wizard Service
 * Main orchestrator for AI-powered data analysis and custom validation requirements
 */

import { analyzeDataPurpose } from './requirements/dataPurposeAnalyzer.js';
import { generateCustomRequirements } from './requirements/requirementsGenerator.js';
import { validateWithCustomRequirements } from './requirements/customValidator.js';

// Re-export all functions for backward compatibility
export {
  analyzeDataPurpose,
  generateCustomRequirements,
  validateWithCustomRequirements
};

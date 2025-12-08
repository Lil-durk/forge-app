/**
 * Validation utilities and scoring functions
 */

class ValidationUtils {
  static calculateScore(results) {
    if (results.issues.length === 0) {
      results.score = 100;
      return;
    }

    const errorWeight = 10;
    const warningWeight = 5;
    const infoWeight = 2;

    let deductions = 0;
    results.issues.forEach(issue => {
      switch (issue.type) {
        case 'error':
          deductions += errorWeight;
          break;
        case 'warning':
          deductions += warningWeight;
          break;
        case 'info':
          deductions += infoWeight;
          break;
      }
    });

    results.score = Math.max(0, 100 - deductions);
  }

  static generateSummary(results) {
    const errorCount = results.issues.filter(i => i.type === 'error').length;
    const warningCount = results.issues.filter(i => i.type === 'warning').length;
    
    if (results.issues.length === 0) {
      results.summary = `✅ All ${results.rowsProcessed} rows passed validation successfully!`;
    } else if (errorCount > 0) {
      results.summary = `❌ Found ${errorCount} error(s) and ${warningCount} warning(s) that need attention.`;
    } else {
      results.summary = `⚠️ Found ${warningCount} warning(s) that should be reviewed.`;
    }
  }

  static getColumnNames(data) {
    const columns = new Set();
    data.forEach(row => {
      Object.keys(row).forEach(key => columns.add(key));
    });
    return Array.from(columns);
  }

  static createRules(config) {
    return {
      required: config.required || [],
      dataTypes: config.dataTypes || {},
      ranges: config.ranges || {},
      patterns: config.patterns || {},
      uniqueFields: config.uniqueFields || [],
      customValidators: config.customValidators || {}
    };
  }
}

module.exports = ValidationUtils;

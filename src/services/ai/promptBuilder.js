/**
 * AI prompt building utilities for requirements analysis
 */

class PromptBuilder {
  static buildDataPurposePrompt(excelData, fileName) {
    const sampleData = excelData.slice(0, 3);
    const columns = Object.keys(sampleData[0] || {});
    
    return `
Analyze this Excel data and determine its most likely business purpose:

FILE NAME: ${fileName}
COLUMNS: ${columns.join(', ')}
SAMPLE DATA:
${JSON.stringify(sampleData, null, 2)}

Based on the column names, data patterns, and file name, what is this data most likely used for?

Respond with JSON in this format:
{
  "purpose": "primary use case",
  "confidence": 0.85,
  "reasoning": "explanation of why this purpose was chosen",
  "suggestedValidations": ["validation1", "validation2"],
  "dataType": "customer_data|financial_data|inventory_data|employee_data|other"
}`;
  }

  static buildRequirementsPrompt(purpose, excelData, fileName, baseRequirements) {
    const sampleData = excelData.slice(0, 3);
    const columns = Object.keys(sampleData[0] || {});
    
    return `
Generate comprehensive validation requirements for this Excel data:

PURPOSE: ${purpose}
FILE NAME: ${fileName}
COLUMNS: ${columns.join(', ')}
BASE REQUIREMENTS: ${baseRequirements || 'None specified'}

SAMPLE DATA:
${JSON.stringify(sampleData, null, 2)}

Create detailed validation requirements that ensure data quality for the specified purpose.
Consider business rules, data integrity, format requirements, and common validation needs.

Respond with detailed requirements in plain English that can be used for validation.
Focus on practical, actionable validation rules.`;
  }

  static buildValidationPrompt(excelData, requirements, useCase) {
    const sampleData = excelData.slice(0, 5);
    
    return `
Validate this Excel data against the specified requirements:

USE CASE: ${useCase}
REQUIREMENTS: ${requirements}

DATA TO VALIDATE:
${JSON.stringify(sampleData, null, 2)}
... (${excelData.length} total rows)

Analyze the data for:
1. Compliance with stated requirements
2. Data quality issues
3. Format problems
4. Business rule violations
5. Potential improvements

Provide detailed validation results with specific suggestions for improvement.`;
  }
}

module.exports = PromptBuilder;

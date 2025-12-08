/**
 * Requirements Wizard Service
 * AI-powered analysis and validation requirements generation
 */

const { OpenAI } = require('openai');
const PromptBuilder = require('./ai/promptBuilder');
const ResponseParser = require('./ai/responseParser');
const openaiConfig = require('../config/openai');

let openai;
try {
  openai = new OpenAI(openaiConfig);
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

async function analyzeDataPurpose(excelData, fileName) {
  console.log('=== ANALYZING DATA PURPOSE ===');
  
  try {
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }

    if (!excelData || excelData.length === 0) {
      throw new Error('No data provided for analysis');
    }

    const prompt = PromptBuilder.buildDataPurposePrompt(excelData, fileName);
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a data analyst expert. Analyze Excel data to determine its business purpose and suggest appropriate validations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const responseText = response.choices[0].message.content;
    const result = ResponseParser.parseDataPurposeResponse(responseText);
    
    console.log('Data purpose analysis completed:', result.purpose);
    return result;

  } catch (error) {
    console.error('Error analyzing data purpose:', error);
    return {
      success: false,
      error: error.message,
      purpose: 'General data validation',
      confidence: 0.3,
      reasoning: 'Could not analyze data due to error',
      suggestedValidations: ['Basic format validation', 'Required field checks'],
      dataType: 'other'
    };
  }
}

async function generateCustomRequirements(purpose, excelData, fileName, baseRequirements) {
  console.log('=== GENERATING CUSTOM REQUIREMENTS ===');
  
  try {
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }

    if (!excelData || excelData.length === 0) {
      throw new Error('No data provided for requirements generation');
    }

    const prompt = PromptBuilder.buildRequirementsPrompt(purpose, excelData, fileName, baseRequirements);
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a data quality expert. Generate comprehensive validation requirements based on business purpose and data structure."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 800
    });

    const responseText = response.choices[0].message.content;
    const result = ResponseParser.parseRequirementsResponse(responseText);
    
    console.log('Custom requirements generated, word count:', result.wordCount);
    return result;

  } catch (error) {
    console.error('Error generating custom requirements:', error);
    return {
      success: false,
      error: error.message,
      requirements: baseRequirements || 'Please ensure data quality and format consistency.',
      wordCount: 0
    };
  }
}

async function validateWithCustomRequirements(excelData, requirements, useCase) {
  console.log('=== VALIDATING WITH CUSTOM REQUIREMENTS ===');
  
  try {
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }

    if (!excelData || excelData.length === 0) {
      throw new Error('No data provided for validation');
    }

    if (!requirements || requirements.trim().length === 0) {
      throw new Error('No requirements provided for validation');
    }

    const prompt = PromptBuilder.buildValidationPrompt(excelData, requirements, useCase);
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a data validation expert. Analyze data against requirements and provide detailed feedback."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1000
    });

    const responseText = response.choices[0].message.content;
    const result = ResponseParser.parseValidationResponse(responseText);
    
    console.log('Custom validation completed, score:', result.score);
    return result;

  } catch (error) {
    console.error('Error validating with custom requirements:', error);
    return {
      success: false,
      error: error.message,
      summary: 'Validation could not be completed due to error',
      issues: [error.message],
      suggestions: ['Please check your data and requirements'],
      score: 0
    };
  }
}

module.exports = {
  analyzeDataPurpose,
  generateCustomRequirements,
  validateWithCustomRequirements
};

/**
 * AI response parsing utilities
 */

import { createLogger } from '../../utils/logger.js';

const log = createLogger('AIResponseParser');

class ResponseParser {
  static parseDataPurposeResponse(responseText) {
    try {
      if (!responseText || typeof responseText !== 'string') {
        throw new Error('Invalid response text provided');
      }

      log.debug('parseDataPurposeResponse', 'Parsing AI response for data purpose', {
        responseLength: responseText.length
      });

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        const result = {
          success: true,
          purpose: parsed.purpose || 'Unknown',
          confidence: parsed.confidence || 0.5,
          reasoning: parsed.reasoning || 'No reasoning provided',
          suggestedValidations: parsed.suggestedValidations || [],
          dataType: parsed.dataType || 'other'
        };

        log.info('parseDataPurposeResponse', 'Successfully parsed data purpose response', {
          purpose: result.purpose,
          confidence: result.confidence,
          dataType: result.dataType,
          validationsCount: result.suggestedValidations.length
        });

        return result;
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      log.error('parseDataPurposeResponse', 'Failed to parse data purpose response', error, {
        responseLength: responseText?.length || 0
      });
      return {
        success: false,
        error: 'Failed to parse AI response',
        purpose: 'Data analysis',
        confidence: 0.3,
        reasoning: 'Could not determine specific purpose from data structure',
        suggestedValidations: ['Check for required fields', 'Validate data formats'],
        dataType: 'other'
      };
    }
  }

  static parseRequirementsResponse(responseText) {
    try {
      if (!responseText || typeof responseText !== 'string') {
        throw new Error('Invalid response text provided');
      }

      const cleanedResponse = responseText.trim();
      if (cleanedResponse.length < 10) {
        throw new Error('Response too short');
      }

      const wordCount = cleanedResponse.split(/\s+/).length;
      
      log.debug('parseRequirementsResponse', 'Parsing requirements response', {
        responseLength: cleanedResponse.length,
        wordCount
      });

      const result = {
        success: true,
        requirements: cleanedResponse,
        wordCount
      };

      log.info('parseRequirementsResponse', 'Successfully parsed requirements response', {
        wordCount,
        responseLength: cleanedResponse.length
      });

      return result;
    } catch (error) {
      log.error('parseRequirementsResponse', 'Failed to parse requirements response', error, {
        responseLength: responseText?.length || 0
      });
      return {
        success: false,
        error: 'Failed to generate requirements',
        requirements: 'Please ensure all required fields are filled and data formats are valid.',
        wordCount: 0
      };
    }
  }

  static parseValidationResponse(responseText) {
    try {
      if (!responseText || typeof responseText !== 'string') {
        throw new Error('Invalid response text provided');
      }

      log.debug('parseValidationResponse', 'Parsing validation response', {
        responseLength: responseText.length
      });

      const lines = responseText.split('\n').filter(line => line.trim());
      
      const result = {
        success: true,
        summary: '',
        issues: [],
        suggestions: [],
        score: 85
      };

      let currentSection = '';
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        
        if (trimmedLine.toLowerCase().includes('summary') || 
            trimmedLine.toLowerCase().includes('overall')) {
          currentSection = 'summary';
        } else if (trimmedLine.toLowerCase().includes('issue') || 
                   trimmedLine.toLowerCase().includes('problem')) {
          currentSection = 'issues';
        } else if (trimmedLine.toLowerCase().includes('suggestion') || 
                   trimmedLine.toLowerCase().includes('recommendation')) {
          currentSection = 'suggestions';
        }
        
        if (trimmedLine.length > 10) {
          switch (currentSection) {
            case 'summary':
              if (!result.summary) result.summary = trimmedLine;
              break;
            case 'issues':
              if (!trimmedLine.toLowerCase().includes('issue')) {
                result.issues.push(trimmedLine);
              }
              break;
            case 'suggestions':
              if (!trimmedLine.toLowerCase().includes('suggestion')) {
                result.suggestions.push(trimmedLine);
              }
              break;
          }
        }
      });

      if (!result.summary) {
        result.summary = lines[0] || 'Validation completed';
      }

      result.score = Math.max(50, 100 - (result.issues.length * 10));

      log.info('parseValidationResponse', 'Successfully parsed validation response', {
        issuesCount: result.issues.length,
        suggestionsCount: result.suggestions.length,
        score: result.score,
        hasSummary: !!result.summary
      });
      
      return result;
      
    } catch (error) {
      log.error('parseValidationResponse', 'Failed to parse validation response', error, {
        responseLength: responseText?.length || 0
      });
      return {
        success: false,
        error: 'Failed to parse validation results',
        summary: 'Validation analysis could not be completed',
        issues: ['Unable to process validation results'],
        suggestions: ['Please try again or check data format'],
        score: 50
      };
    }
  }

  static extractJsonFromResponse(responseText) {
    try {
      if (!responseText || typeof responseText !== 'string') {
        log.warn('extractJsonFromResponse', 'Invalid response text provided');
        return null;
      }

      log.debug('extractJsonFromResponse', 'Extracting JSON from response', {
        responseLength: responseText.length
      });

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (result) {
        log.debug('extractJsonFromResponse', 'Successfully extracted JSON', {
          jsonKeys: Object.keys(result)
        });
      } else {
        log.warn('extractJsonFromResponse', 'No JSON found in response');
      }

      return result;
    } catch (error) {
      log.error('extractJsonFromResponse', 'Failed to extract JSON from response', error, {
        responseLength: responseText?.length || 0
      });
      return null;
    }
  }
}

export default ResponseParser;

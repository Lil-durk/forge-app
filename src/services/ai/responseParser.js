/**
 * AI response parsing utilities
 */

class ResponseParser {
  static parseDataPurposeResponse(responseText) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          purpose: parsed.purpose || 'Unknown',
          confidence: parsed.confidence || 0.5,
          reasoning: parsed.reasoning || 'No reasoning provided',
          suggestedValidations: parsed.suggestedValidations || [],
          dataType: parsed.dataType || 'other'
        };
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Error parsing data purpose response:', error);
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
      const cleanedResponse = responseText.trim();
      if (cleanedResponse.length < 10) {
        throw new Error('Response too short');
      }
      
      return {
        success: true,
        requirements: cleanedResponse,
        wordCount: cleanedResponse.split(/\s+/).length
      };
    } catch (error) {
      console.error('Error parsing requirements response:', error);
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
      
      return result;
      
    } catch (error) {
      console.error('Error parsing validation response:', error);
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
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
      console.error('Error extracting JSON:', error);
      return null;
    }
  }
}

module.exports = ResponseParser;

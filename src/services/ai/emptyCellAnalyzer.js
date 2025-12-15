/**
 * Empty Cell Analyzer - Simplified
 * Helps AI distinguish between intentional empty cells and missing data
 */

import { openaiClient, OPENAI_CONFIG } from "../../config/openai.js";

/**
 * Analyzes empty cells to classify them as intentional or missing data
 */
export const analyzeEmptyCells = async (excelData, context = {}) => {
  try {
    if (!excelData?.length) {
      return { success: false, error: 'No valid Excel data provided' };
    }

    const emptyCells = findEmptyCells(excelData);
    if (emptyCells.length === 0) {
      return { success: true, analysis: { totalEmptyCells: 0, summary: 'No empty cells found' } };
    }

    const prompt = buildPrompt(excelData, emptyCells, context);
    const completion = await openaiClient.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert at distinguishing between intentionally empty Excel cells (formatting, spacers) and missing data that needs attention. Provide structured JSON analysis."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: OPENAI_CONFIG.MAX_TOKENS,
      temperature: 0.3
    });

    const analysis = parseResponse(completion.choices[0].message.content);
    return { success: true, analysis, emptyCellCount: emptyCells.length };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Finds empty cells in Excel data
 */
const findEmptyCells = (excelData) => {
  const emptyCells = [];
  excelData.forEach((row, rowIndex) => {
    if (!row) return;
    Object.keys(row).forEach(column => {
      const value = row[column];
      if (value === null || value === undefined || value === '' || 
          (typeof value === 'string' && value.trim() === '')) {
        emptyCells.push({
          row: rowIndex + 1,
          column,
          location: `${column}${rowIndex + 1}`
        });
      }
    });
  });
  return emptyCells;
};

/**
 * Builds analysis prompt
 */
const buildPrompt = (excelData, emptyCells, context) => {
  const { fileName = 'unknown', documentType = 'unknown' } = context;
  
  return `
Analyze ${emptyCells.length} empty cells in this Excel file:

FILE: ${fileName} (${documentType})
SAMPLE DATA: ${JSON.stringify(excelData.slice(0, 5), null, 2)}
EMPTY CELLS: ${JSON.stringify(emptyCells.slice(0, 10), null, 2)}

Classify each empty cell as:
- INTENTIONAL: Formatting, spacers, optional fields
- MISSING_DATA: Required fields, incomplete records
- FORMATTING: Visual structure elements
- ERROR: Failed calculations

Return JSON:
{
  "summary": {
    "totalEmptyCells": ${emptyCells.length},
    "criticalMissing": <count>,
    "intentionalEmpty": <count>,
    "overallAssessment": "CRITICAL|WARNING|ACCEPTABLE"
  },
  "issues": [
    {
      "location": "A5",
      "type": "MISSING_DATA|INTENTIONAL|FORMATTING|ERROR",
      "severity": "HIGH|MEDIUM|LOW",
      "reason": "Brief explanation",
      "action": "What user should do"
    }
  ]
}`;
};

/**
 * Parses AI response
 */
const parseResponse = (content) => {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    return JSON.parse(jsonMatch ? jsonMatch[1] : content);
  } catch (error) {
    throw new Error('Failed to parse AI response');
  }
};

export default { analyzeEmptyCells };

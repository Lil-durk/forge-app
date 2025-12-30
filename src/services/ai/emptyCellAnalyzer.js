/**
 * Enhanced Empty Cell Analyzer
 * Provides detailed analysis of empty cells with specific row and column information
 * Distinguishes between cells that should be empty vs. cells that shouldn't be empty
 */

import { openaiClient, OPENAI_CONFIG } from "../../config/openai.js";

/**
 * Analyzes empty cells with detailed row/column reporting
 * Categorizes cells as: should be empty, shouldn't be empty, uncertain
 */
export const analyzeEmptyCells = async (excelData, context = {}) => {
  try {
    if (!excelData?.length) {
      return { success: false, error: 'No valid Excel data provided' };
    }

    const allEmptyCells = findEmptyCells(excelData);
    if (allEmptyCells.length === 0) {
      return { 
        success: true, 
        analysis: { 
          totalEmptyCells: 0, 
          summary: 'No empty cells found',
          cellsShouldBeEmpty: [],
          cellsShouldNotBeEmpty: [],
          uncertainCells: []
        } 
      };
    }

    console.log(`🔍 Empty Cell Analysis: Found ${allEmptyCells.length} total empty cells`);
    
    // Send all empty cells to AI for comprehensive analysis
    const prompt = buildEnhancedPrompt(excelData, allEmptyCells, context);
    const completion = await openaiClient.chat.completions.create({
      model: OPENAI_CONFIG.MODEL,
      messages: [
        {
          role: "system",
          content: `You are an Excel spreadsheet validator. Your task is to analyze empty cells and classify them as either "decorative/formatting" or "required input fields" based on contextual clues.

ANALYSIS CRITERIA:

**For REQUIRED INPUT FIELDS, look for:**
- Empty cells in data entry sections (forms, tables with input rows)
- Cells with labels/headers indicating expected input (Name:, Date:, Amount:, etc.)
- Empty cells in structured data tables with column headers
- Cells surrounded by filled data cells in the same row/column pattern
- Empty cells with data validation rules applied
- Cells with input formatting (borders, background colors typical of input fields)
- Empty cells in calculation dependencies (referenced by formulas)
- Cells with placeholder text or comments indicating required input
- Empty cells in recurring patterns (every nth cell in a series)

**For DECORATIVE/FORMATTING, look for:**
- Empty cells used for spacing/layout (creating visual gaps)
- Empty cells in merged cell ranges used for aesthetics
- Empty cells creating borders or visual separation
- Empty cells in header/title areas for alignment
- Empty cells with no contextual data relationship
- Empty cells in purely formatting regions (logos, design elements)
- Empty cells creating indentation or visual hierarchy
- Empty cells in template sections not meant for user input

CONTEXT TO CONSIDER:
- Surrounding cell content and patterns
- Cell formatting (fonts, colors, borders)
- Worksheet structure and purpose
- Column/row headers and their relationship to empty cells
- Formula references to the empty cells
- Data validation rules
- Cell comments or notes

Prioritize accuracy over speed. When uncertain, classify as "REQUIRED" and flag for manual review.`
        },
        { role: "user", content: prompt }
      ],
      max_tokens: OPENAI_CONFIG.MAX_TOKENS,
      temperature: 0.2
    });

    const analysis = parseEnhancedResponse(completion.choices[0].message.content);
    // Add the total empty cell count to the analysis
    analysis.totalEmptyCells = allEmptyCells.length;
    
    return { success: true, analysis, emptyCellCount: allEmptyCells.length };

  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Enhanced function to read out empty cell analysis results
 * Provides human-readable summary of findings
 */
export const readOutEmptyCellAnalysis = (analysis) => {
  if (!analysis) {
    return "No analysis data available.";
  }

  const { cellsShouldBeEmpty, cellsShouldNotBeEmpty, uncertainCells, totalEmptyCells } = analysis;
  
  let readout = `\n=== EMPTY CELL ANALYSIS READOUT ===\n`;
  readout += `Total empty cells found: ${totalEmptyCells}\n\n`;

  // Cells that are correctly empty
  if (cellsShouldBeEmpty && cellsShouldBeEmpty.length > 0) {
    readout += `✅ CELLS THAT ARE CORRECTLY EMPTY (${cellsShouldBeEmpty.length}):\n`;
    cellsShouldBeEmpty.forEach(cell => {
      readout += `   • Row ${cell.row}, Column ${cell.column} (${cell.location}): ${cell.reason}\n`;
    });
    readout += '\n';
  }

  // Cells that should NOT be empty (problematic)
  if (cellsShouldNotBeEmpty && cellsShouldNotBeEmpty.length > 0) {
    readout += `❌ CELLS THAT SHOULD NOT BE EMPTY (${cellsShouldNotBeEmpty.length}):\n`;
    cellsShouldNotBeEmpty.forEach(cell => {
      readout += `   • Row ${cell.row}, Column ${cell.column} (${cell.location}): ${cell.reason}\n`;
      if (cell.action) {
        readout += `     Action needed: ${cell.action}\n`;
      }
    });
    readout += '\n';
  }

  // Uncertain cases
  if (uncertainCells && uncertainCells.length > 0) {
    readout += `⚠️  UNCERTAIN CASES (${uncertainCells.length}):\n`;
    uncertainCells.forEach(cell => {
      readout += `   • Row ${cell.row}, Column ${cell.column} (${cell.location}): ${cell.reason}\n`;
    });
    readout += '\n';
  }

  // Summary assessment
  if (analysis.overallAssessment) {
    readout += `📊 OVERALL ASSESSMENT: ${analysis.overallAssessment}\n`;
  }

  if (analysis.summary) {
    readout += `📝 SUMMARY: ${analysis.summary}\n`;
  }

  return readout;
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
 * Builds comprehensive analysis prompt for all empty cells
 */
const buildEnhancedPrompt = (excelData, emptyCells, context) => {
  const { fileName = 'unknown', documentType = 'unknown' } = context;
  
  // Get column headers for context
  const headers = excelData.length > 0 ? Object.keys(excelData[0]) : [];
  
  return `
TASK: Analyze ${emptyCells.length} empty cells in this Excel spreadsheet and classify each as either "REQUIRED" (input field) or "DECORATIVE" (formatting).

FILE CONTEXT:
- File: ${fileName} (${documentType})
- Total rows: ${excelData.length}
- Columns: ${headers.join(', ')}
- Total empty cells to analyze: ${emptyCells.length}

SAMPLE DATA WITH CONTEXT (first 15 rows):
${JSON.stringify(excelData.slice(0, 15), null, 2)}

EMPTY CELLS TO ANALYZE (showing first 50):
${JSON.stringify(emptyCells.slice(0, 50), null, 2)}

OUTPUT FORMAT:
For each empty cell, provide:
1. Cell reference (e.g., A5)
2. Classification: "REQUIRED" or "DECORATIVE"
3. Confidence level: High/Medium/Low
4. Reasoning: Brief explanation of decision factors
5. Recommended action if required

Return JSON with this EXACT structure:
{
  "totalEmptyCells": ${emptyCells.length},
  "summary": "Brief assessment of empty cells analysis",
  "overallAssessment": "CRITICAL|WARNING|ACCEPTABLE",
  "cellsShouldBeEmpty": [
    {
      "row": <number>,
      "column": "<column_name>",
      "location": "<cell_reference>",
      "reason": "Why this cell is decorative/formatting",
      "category": "DECORATIVE",
      "confidence": "High|Medium|Low"
    }
  ],
  "cellsShouldNotBeEmpty": [
    {
      "row": <number>,
      "column": "<column_name>",
      "location": "<cell_reference>",
      "reason": "Why this appears to be a required input field",
      "action": "Recommended action",
      "severity": "HIGH|MEDIUM|LOW",
      "category": "REQUIRED",
      "confidence": "High|Medium|Low",
      "adjacentContext": "Surrounding context that indicates this is an input field"
    }
  ],
  "uncertainCells": [
    {
      "row": <number>,
      "column": "<column_name>",
      "location": "<cell_reference>",
      "reason": "Why classification is uncertain",
      "confidence": "Low",
      "possibleActions": ["Manual review recommended"]
    }
  ]
}`;
};

/**
 * Parses enhanced AI response with detailed categorization
 */
const parseEnhancedResponse = (content) => {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const parsedContent = JSON.parse(jsonMatch ? jsonMatch[1] : content);
    
    // Ensure all required arrays exist
    return {
      totalEmptyCells: parsedContent.totalEmptyCells || 0,
      summary: parsedContent.summary || 'No summary provided',
      overallAssessment: parsedContent.overallAssessment || 'UNKNOWN',
      cellsShouldBeEmpty: parsedContent.cellsShouldBeEmpty || [],
      cellsShouldNotBeEmpty: parsedContent.cellsShouldNotBeEmpty || [],
      uncertainCells: parsedContent.uncertainCells || []
    };
  } catch (error) {
    throw new Error(`Failed to parse enhanced AI response: ${error.message}`);
  }
};

/**
 * Legacy functions for backward compatibility
 */
const buildPrompt = (excelData, emptyCells, context) => {
  return buildEnhancedPrompt(excelData, emptyCells, context);
};

const parseResponse = (content) => {
  return parseEnhancedResponse(content);
};

export default { analyzeEmptyCells, readOutEmptyCellAnalysis };

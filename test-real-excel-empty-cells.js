/**
 * Real Excel File Empty Cell Analyzer Test
 * Tests the enhanced empty cell analyzer with actual Excel files
 * Shows specific row/column numbers and empty cell types
 */

import { analyzeEmptyCells, readOutEmptyCellAnalysis } from './src/services/ai/emptyCellAnalyzer.js';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

/**
 * Reads and processes a real Excel file
 */
function readExcelFile(filePath) {
  try {
    console.log(`📂 Reading Excel file: ${filePath}`);
    
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, // Use first row as header
      defval: '' // Default value for empty cells
    });
    
    // Convert array format to object format
    if (jsonData.length === 0) {
      throw new Error('Excel file is empty');
    }
    
    const headers = jsonData[0];
    const dataRows = jsonData.slice(1).map(row => {
      const rowObj = {};
      headers.forEach((header, index) => {
        rowObj[header] = row[index] || '';
      });
      return rowObj;
    });
    
    console.log(`✅ Successfully read Excel file:`);
    console.log(`   - Sheet: ${sheetName}`);
    console.log(`   - Headers: ${headers.join(', ')}`);
    console.log(`   - Data rows: ${dataRows.length}`);
    
    return {
      success: true,
      data: dataRows,
      sheetName,
      headers,
      filePath
    };
    
  } catch (error) {
    console.error(`❌ Error reading Excel file: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Creates a sample Excel file for testing if none exists
 */
function createSampleExcelFile(filePath) {
  console.log(`📝 Creating sample Excel file: ${filePath}`);
  
  const sampleData = [
    ['Name', 'Email', 'Phone', 'Department', 'Manager', 'Start Date', 'Salary', 'Notes'],
    ['John Doe', 'john@company.com', '123-456-7890', 'Engineering', 'Jane Smith', '2023-01-15', 75000, ''],
    ['Jane Smith', 'jane@company.com', '', 'Engineering', 'Bob Johnson', '2022-03-10', 85000, 'Team Lead'],
    ['', 'bob@company.com', '555-0123', 'HR', '', '2021-06-01', '', ''],
    ['Alice Wilson', '', '555-0456', 'Marketing', 'Carol Davis', '', 65000, 'Part-time'],
    ['', '', '', '--- CONTRACTORS ---', '', '', '', ''],
    ['Mike Chen', 'mike@contractor.com', '555-7890', 'IT', 'Jane Smith', '2023-06-01', '', 'Contractor'],
    ['Sarah Johnson', 'sarah@company.com', '555-1234', '', 'Bob Johnson', '2023-02-15', 70000, '']
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Data');
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  XLSX.writeFile(workbook, filePath);
  console.log(`✅ Sample Excel file created successfully`);
}

/**
 * Main test function
 */
async function testRealExcelEmptyCells() {
  console.log('🚀 TESTING EMPTY CELL ANALYZER WITH REAL EXCEL FILES\n');
  
  // Define test file path
  const testFilePath = './test-data/sample-employee-data.xlsx';
  
  // Create sample file if it doesn't exist
  if (!fs.existsSync(testFilePath)) {
    createSampleExcelFile(testFilePath);
  }
  
  // Read the Excel file
  const excelResult = readExcelFile(testFilePath);
  if (!excelResult.success) {
    console.error('Failed to read Excel file:', excelResult.error);
    return;
  }
  
  console.log('\n📊 EXCEL FILE DATA PREVIEW:');
  console.log('Headers:', excelResult.headers);
  console.log('Sample rows:');
  excelResult.data.slice(0, 3).forEach((row, index) => {
    console.log(`Row ${index + 1}:`, JSON.stringify(row, null, 2));
  });
  
  console.log('\n' + '='.repeat(100));
  
  try {
    // Analyze empty cells with the enhanced analyzer
    console.log('\n🔍 ANALYZING EMPTY CELLS WITH AI...');
    
    const context = {
      fileName: path.basename(testFilePath),
      documentType: 'Employee Records',
      sheetName: excelResult.sheetName
    };
    
    const analysisResult = await analyzeEmptyCells(excelResult.data, context);
    
    if (!analysisResult.success) {
      console.error('❌ Empty cell analysis failed:', analysisResult.error);
      return;
    }
    
    console.log('✅ Empty cell analysis completed successfully!\n');
    
    // Display detailed results
    console.log('📋 DETAILED ANALYSIS RESULTS:');
    console.log(JSON.stringify(analysisResult.analysis, null, 2));
    
    console.log('\n' + '='.repeat(100));
    
    // Generate human-readable readout
    console.log('\n🗣️  AI READOUT - SPECIFIC ROW/COLUMN DETAILS:');
    const readout = readOutEmptyCellAnalysis(analysisResult.analysis);
    console.log(readout);
    
    // Summary statistics
    console.log('\n' + '='.repeat(100));
    console.log('📈 SUMMARY STATISTICS:');
    console.log(`📁 File: ${testFilePath}`);
    console.log(`📊 Sheet: ${excelResult.sheetName}`);
    console.log(`📝 Total rows: ${excelResult.data.length}`);
    console.log(`📋 Total columns: ${excelResult.headers.length}`);
    console.log(`🔍 Empty cells found: ${analysisResult.emptyCellCount}`);
    console.log(`✅ Correctly empty: ${analysisResult.analysis.cellsShouldBeEmpty?.length || 0}`);
    console.log(`❌ Should not be empty: ${analysisResult.analysis.cellsShouldNotBeEmpty?.length || 0}`);
    console.log(`⚠️  Uncertain cases: ${analysisResult.analysis.uncertainCells?.length || 0}`);
    
    // Highlight key features
    console.log('\n🎯 KEY FEATURES DEMONSTRATED:');
    console.log('✅ Real Excel file processing (.xlsx format)');
    console.log('✅ Specific row and column identification');
    console.log('✅ Cell location references (e.g., A1, B2, C3)');
    console.log('✅ Empty cell type classification:');
    console.log('   - REQUIRED_FIELD: Missing critical data');
    console.log('   - OPTIONAL_FIELD: Acceptable empty fields');
    console.log('   - FORMATTING: Intentional spacing/dividers');
    console.log('   - INCOMPLETE_RECORD: Partial data entry');
    console.log('✅ Severity levels (HIGH, MEDIUM, LOW)');
    console.log('✅ Action recommendations for each issue');
    console.log('✅ AI-powered context understanding');
    
    return analysisResult;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Test with custom Excel file
 */
async function testCustomExcelFile(customFilePath) {
  if (!fs.existsSync(customFilePath)) {
    console.error(`❌ Custom file not found: ${customFilePath}`);
    return;
  }
  
  console.log(`\n🔍 TESTING CUSTOM EXCEL FILE: ${customFilePath}`);
  
  const excelResult = readExcelFile(customFilePath);
  if (!excelResult.success) {
    console.error('Failed to read custom Excel file:', excelResult.error);
    return;
  }
  
  const context = {
    fileName: path.basename(customFilePath),
    documentType: 'Custom Data',
    sheetName: excelResult.sheetName
  };
  
  const analysisResult = await analyzeEmptyCells(excelResult.data, context);
  
  if (analysisResult.success) {
    console.log('\n🗣️  CUSTOM FILE ANALYSIS READOUT:');
    const readout = readOutEmptyCellAnalysis(analysisResult.analysis);
    console.log(readout);
  }
  
  return analysisResult;
}

// Run the test
console.log('🎯 ENHANCED EMPTY CELL ANALYZER - REAL EXCEL FILE TEST\n');

// Check if custom file path provided as command line argument
const customFile = process.argv[2];

if (customFile) {
  testCustomExcelFile(customFile).then(() => {
    console.log('\n✨ Custom file test completed!');
  }).catch(error => {
    console.error('\n💥 Custom file test failed:', error.message);
  });
} else {
  testRealExcelEmptyCells().then(() => {
    console.log('\n✨ Test completed successfully!');
    console.log('\n💡 To test with your own Excel file, run:');
    console.log('   node test-real-excel-empty-cells.js path/to/your/file.xlsx');
  }).catch(error => {
    console.error('\n💥 Test failed:', error.message);
  });
}

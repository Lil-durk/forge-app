/**
 * Test Script for Enhanced Empty Cell Analyzer
 * Demonstrates the AI reading out empty cells with specific row and column information
 */

import { analyzeEmptyCells, readOutEmptyCellAnalysis } from './src/services/ai/emptyCellAnalyzer.js';

// Sample Excel data with intentional empty cells for testing
const sampleExcelData = [
  {
    'Name': 'John Doe',
    'Email': 'john@example.com',
    'Phone': '123-456-7890',
    'Department': 'Engineering',
    'Manager': 'Jane Smith',
    'Start Date': '2023-01-15',
    'Salary': 75000,
    'Notes': '' // Intentionally empty - optional field
  },
  {
    'Name': 'Jane Smith',
    'Email': 'jane@example.com',
    'Phone': '', // Missing required data
    'Department': 'Engineering',
    'Manager': 'Bob Johnson',
    'Start Date': '2022-03-10',
    'Salary': 85000,
    'Notes': 'Team Lead'
  },
  {
    'Name': '', // Missing required data
    'Email': 'bob@example.com',
    'Phone': '555-0123',
    'Department': 'HR',
    'Manager': '',
    'Start Date': '2021-06-01',
    'Salary': '',
    'Notes': ''
  },
  {
    'Name': 'Alice Wilson',
    'Email': '', // Missing required data
    'Phone': '555-0456',
    'Department': 'Marketing',
    'Manager': 'Carol Davis',
    'Start Date': '',
    'Salary': 65000,
    'Notes': 'Part-time contractor'
  },
  {
    'Name': '', // Formatting row - all empty except one field
    'Email': '',
    'Phone': '',
    'Department': '--- CONTRACTORS ---', // Section header
    'Manager': '',
    'Start Date': '',
    'Salary': '',
    'Notes': ''
  }
];

const testContext = {
  fileName: 'employee_data.xlsx',
  documentType: 'Employee Records'
};

async function testEmptyCellAnalyzer() {
  console.log('🔍 Testing Enhanced Empty Cell Analyzer...\n');
  
  try {
    // Run the analysis
    console.log('📊 Analyzing empty cells...');
    const result = await analyzeEmptyCells(sampleExcelData, testContext);
    
    if (!result.success) {
      console.error('❌ Analysis failed:', result.error);
      return;
    }
    
    console.log('✅ Analysis completed successfully!\n');
    
    // Display the raw analysis results
    console.log('📋 RAW ANALYSIS RESULTS:');
    console.log(JSON.stringify(result.analysis, null, 2));
    console.log('\n' + '='.repeat(80) + '\n');
    
    // Use the readout function to get human-readable results
    console.log('🗣️  AI READOUT OF EMPTY CELL ANALYSIS:');
    const readout = readOutEmptyCellAnalysis(result.analysis);
    console.log(readout);
    
    // Additional summary
    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY STATISTICS:');
    console.log(`Total empty cells analyzed: ${result.emptyCellCount}`);
    console.log(`Cells that should be empty: ${result.analysis.cellsShouldBeEmpty?.length || 0}`);
    console.log(`Cells that should NOT be empty: ${result.analysis.cellsShouldNotBeEmpty?.length || 0}`);
    console.log(`Uncertain cases: ${result.analysis.uncertainCells?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
console.log('🚀 Starting Empty Cell Analyzer Test\n');
testEmptyCellAnalyzer().then(() => {
  console.log('\n✨ Test completed!');
}).catch(error => {
  console.error('\n💥 Test crashed:', error.message);
});

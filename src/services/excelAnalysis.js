/**
 * Excel Analysis Service
 * Provides comprehensive analysis and reporting for Excel files
 */

/**
 * Analyze Excel data and generate comprehensive report
 * @param {Object} excelData - Parsed Excel data
 * @param {Object} validationResult - Validation results
 * @param {string} fileName - Original file name
 * @param {number} fileSize - File size in bytes
 * @returns {Object} Comprehensive analysis report
 */
export const analyzeExcelFile = async (excelData, validationResult, fileName, fileSize) => {
    try {
        console.log('Starting Excel file analysis...');
        
        // Basic file information
        const fileInfo = {
            fileName: fileName,
            fileSize: formatFileSize(fileSize),
            uploadDate: new Date().toISOString().split('T')[0],
            totalSheets: Object.keys(excelData).length
        };

        // Analyze each sheet
        const sheetAnalysis = {};
        let totalRows = 0;
        let totalColumns = 0;

        for (const [sheetName, sheetData] of Object.entries(excelData)) {
            const analysis = analyzeSheet(sheetName, sheetData);
            sheetAnalysis[sheetName] = analysis;
            totalRows += analysis.rowCount;
            totalColumns = Math.max(totalColumns, analysis.columnCount);
        }

        // Overall statistics
        const overallStats = {
            totalRows,
            totalColumns,
            averageRowsPerSheet: Math.round(totalRows / Object.keys(excelData).length),
            largestSheet: Object.keys(sheetAnalysis).reduce((a, b) => 
                sheetAnalysis[a].rowCount > sheetAnalysis[b].rowCount ? a : b
            )
        };

        // Data quality analysis
        const dataQuality = analyzeDataQuality(validationResult);

        // Generate preview data (first 10 rows from first sheet)
        const firstSheetName = Object.keys(excelData)[0];
        const previewData = generatePreviewData(excelData[firstSheetName]);

        return {
            fileInfo,
            overallStats,
            sheetAnalysis,
            dataQuality,
            previewData,
            validationSummary: summarizeValidation(validationResult)
        };

    } catch (error) {
        console.error('Error analyzing Excel file:', error);
        throw new Error(`Failed to analyze Excel file: ${error.message}`);
    }
};

/**
 * Analyze individual sheet data
 */
const analyzeSheet = (sheetName, sheetData) => {
    if (!Array.isArray(sheetData) || sheetData.length === 0) {
        return {
            sheetName,
            rowCount: 0,
            columnCount: 0,
            columns: [],
            isEmpty: true
        };
    }

    const rowCount = sheetData.length;
    const headers = Object.keys(sheetData[0] || {});
    const columnCount = headers.length;

    // Analyze each column
    const columns = headers.map(header => analyzeColumn(header, sheetData));

    return {
        sheetName,
        rowCount,
        columnCount,
        columns,
        isEmpty: false,
        hasHeaders: headers.length > 0
    };
};

/**
 * Analyze individual column data
 */
const analyzeColumn = (columnName, sheetData) => {
    const values = sheetData.map(row => row[columnName]).filter(val => val !== null && val !== undefined && val !== '');
    
    if (values.length === 0) {
        return {
            name: columnName,
            type: 'empty',
            uniqueValues: 0,
            nullCount: sheetData.length,
            fillRate: '0%'
        };
    }

    // Determine data type
    const dataType = determineDataType(values);
    
    // Calculate statistics
    const uniqueValues = new Set(values).size;
    const nullCount = sheetData.length - values.length;
    const fillRate = Math.round((values.length / sheetData.length) * 100);

    return {
        name: columnName,
        type: dataType,
        uniqueValues,
        nullCount,
        fillRate: `${fillRate}%`,
        sampleValues: values.slice(0, 3) // First 3 non-empty values
    };
};

/**
 * Determine data type of column values
 */
const determineDataType = (values) => {
    if (values.length === 0) return 'empty';

    const sample = values.slice(0, 10); // Sample first 10 values
    
    // Check for numbers
    const numberCount = sample.filter(val => !isNaN(val) && !isNaN(parseFloat(val))).length;
    if (numberCount > sample.length * 0.8) return 'number';
    
    // Check for dates
    const dateCount = sample.filter(val => !isNaN(Date.parse(val))).length;
    if (dateCount > sample.length * 0.8) return 'date';
    
    // Check for booleans
    const boolCount = sample.filter(val => 
        typeof val === 'boolean' || 
        ['true', 'false', 'yes', 'no', '1', '0'].includes(String(val).toLowerCase())
    ).length;
    if (boolCount > sample.length * 0.8) return 'boolean';
    
    return 'text';
};

/**
 * Analyze data quality based on validation results
 */
const analyzeDataQuality = (validationResult) => {
    if (!validationResult || !validationResult.issues) {
        return {
            overallScore: 100,
            totalIssues: 0,
            criticalIssues: 0,
            warningIssues: 0,
            qualityLevel: 'Excellent'
        };
    }

    const issues = validationResult.issues;
    const totalIssues = issues.length;
    const criticalIssues = issues.filter(issue => issue.severity === 'critical').length;
    const warningIssues = issues.filter(issue => issue.severity === 'warning').length;

    // Calculate quality score (0-100)
    let score = 100;
    score -= criticalIssues * 10; // Critical issues: -10 points each
    score -= warningIssues * 5;   // Warning issues: -5 points each
    score = Math.max(0, score);

    let qualityLevel;
    if (score >= 90) qualityLevel = 'Excellent';
    else if (score >= 75) qualityLevel = 'Good';
    else if (score >= 50) qualityLevel = 'Fair';
    else qualityLevel = 'Poor';

    return {
        overallScore: score,
        totalIssues,
        criticalIssues,
        warningIssues,
        qualityLevel
    };
};

/**
 * Generate preview data for display
 */
const generatePreviewData = (sheetData) => {
    if (!Array.isArray(sheetData) || sheetData.length === 0) {
        return {
            headers: [],
            rows: [],
            totalRows: 0
        };
    }

    const headers = Object.keys(sheetData[0] || {});
    const previewRows = sheetData.slice(0, 10); // First 10 rows
    
    return {
        headers,
        rows: previewRows,
        totalRows: sheetData.length,
        isPreview: sheetData.length > 10
    };
};

/**
 * Summarize validation results
 */
const summarizeValidation = (validationResult) => {
    if (!validationResult || !validationResult.issues) {
        return {
            status: 'passed',
            message: 'All validation checks passed successfully',
            issuesByType: {}
        };
    }

    const issues = validationResult.issues;
    const issuesByType = {};
    
    issues.forEach(issue => {
        const type = issue.type || 'general';
        if (!issuesByType[type]) {
            issuesByType[type] = [];
        }
        issuesByType[type].push(issue);
    });

    const status = issues.some(issue => issue.severity === 'critical') ? 'failed' : 'warning';
    const message = status === 'failed' 
        ? `Found ${issues.length} validation issues including critical problems`
        : `Found ${issues.length} validation warnings`;

    return {
        status,
        message,
        issuesByType,
        totalIssues: issues.length
    };
};

/**
 * Format file size in human readable format
 */
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Generate Markdown table from data
 */
export const generateMarkdownTable = (headers, rows, maxRows = 10) => {
    if (!headers || headers.length === 0 || !rows || rows.length === 0) {
        return '_No data to display_';
    }

    const limitedRows = rows.slice(0, maxRows);
    
    // Create header row
    const headerRow = '| ' + headers.join(' | ') + ' |';
    const separatorRow = '| ' + headers.map(() => '---').join(' | ') + ' |';
    
    // Create data rows
    const dataRows = limitedRows.map(row => {
        const cells = headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            return String(value).replace(/\|/g, '\\|'); // Escape pipe characters
        });
        return '| ' + cells.join(' | ') + ' |';
    });
    
    const table = [headerRow, separatorRow, ...dataRows].join('\n');
    
    if (rows.length > maxRows) {
        return table + `\n\n_Showing ${maxRows} of ${rows.length} rows_`;
    }
    
    return table;
}
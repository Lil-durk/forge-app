/**
 * Report Generation Service
 * Generates comprehensive Jira issue descriptions from Excel analysis
 */

import { generateMarkdownTable } from './excelAnalysis.js';

/**
 * Generate comprehensive Jira issue description from Excel analysis
 * @param {Object} analysis - Excel analysis results
 * @param {string} userDescription - User provided description
 * @returns {string} Formatted Jira issue description
 */
export const generateIssueDescription = (analysis, userDescription = '') => {
    const sections = [];

    // User description (if provided)
    if (userDescription && userDescription.trim()) {
        sections.push(userDescription.trim());
        sections.push('---');
    }

    // File summary header
    sections.push('# 📊 Excel File Analysis Report');
    sections.push('');

    // File information section
    sections.push(generateFileInfoSection(analysis.fileInfo));

    // Data quality overview
    sections.push(generateDataQualitySection(analysis.dataQuality));

    // Overall statistics
    sections.push(generateOverallStatsSection(analysis.overallStats));

    // Data preview
    if (analysis.previewData && analysis.previewData.rows.length > 0) {
        sections.push(generateDataPreviewSection(analysis.previewData));
    }

    // Sheet analysis
    if (analysis.sheetAnalysis && Object.keys(analysis.sheetAnalysis).length > 0) {
        sections.push(generateSheetAnalysisSection(analysis.sheetAnalysis));
    }

    // Validation results
    if (analysis.validationSummary) {
        sections.push(generateValidationSection(analysis.validationSummary));
    }

    // Footer
    sections.push(generateFooterSection());

    return sections.join('\n\n');
};

/**
 * Generate file information section
 */
const generateFileInfoSection = (fileInfo) => {
    return `## 📁 File Information

| Property | Value |
|----------|-------|
| **File Name** | ${fileInfo.fileName} |
| **File Size** | ${fileInfo.fileSize} |
| **Upload Date** | ${fileInfo.uploadDate} |
| **Total Sheets** | ${fileInfo.totalSheets} |`;
};

/**
 * Generate data quality section
 */
const generateDataQualitySection = (dataQuality) => {
    const scoreEmoji = getQualityEmoji(dataQuality.overallScore);
    const levelColor = getQualityColor(dataQuality.qualityLevel);
    
    return `## ${scoreEmoji} Data Quality Assessment

**Overall Score: ${dataQuality.overallScore}/100** - ${levelColor} **${dataQuality.qualityLevel}**

| Metric | Count |
|--------|-------|
| Total Issues | ${dataQuality.totalIssues} |
| Critical Issues | ${dataQuality.criticalIssues} ❌ |
| Warning Issues | ${dataQuality.warningIssues} ⚠️ |`;
};

/**
 * Generate overall statistics section
 */
const generateOverallStatsSection = (stats) => {
    return `## 📈 Data Overview

| Statistic | Value |
|-----------|-------|
| **Total Rows** | ${stats.totalRows.toLocaleString()} |
| **Total Columns** | ${stats.totalColumns} |
| **Average Rows per Sheet** | ${stats.averageRowsPerSheet.toLocaleString()} |
| **Largest Sheet** | ${stats.largestSheet} |`;
};

/**
 * Generate data preview section
 */
const generateDataPreviewSection = (previewData) => {
    const previewTable = generateMarkdownTable(previewData.headers, previewData.rows, 10);
    const previewNote = previewData.isPreview 
        ? `\n\n*Showing first 10 rows of ${previewData.totalRows.toLocaleString()} total rows*`
        : '';

    return `## 👀 Data Preview

${previewTable}${previewNote}`;
};

/**
 * Generate sheet analysis section
 */
const generateSheetAnalysisSection = (sheetAnalysis) => {
    const sections = ['## 📋 Sheet Analysis'];

    Object.entries(sheetAnalysis).forEach(([sheetName, analysis]) => {
        if (analysis.isEmpty) {
            sections.push(`### ${sheetName} (Empty Sheet)`);
            sections.push('*This sheet contains no data*');
        } else {
            sections.push(`### ${sheetName}`);
            sections.push(`**${analysis.rowCount.toLocaleString()} rows** × **${analysis.columnCount} columns**`);
            
            if (analysis.columns && analysis.columns.length > 0) {
                sections.push('');
                sections.push('**Column Analysis:**');
                
                const columnTable = generateColumnAnalysisTable(analysis.columns);
                sections.push(columnTable);
            }
        }
    });

    return sections.join('\n\n');
};

/**
 * Generate column analysis table
 */
const generateColumnAnalysisTable = (columns) => {
    const headers = ['Column', 'Type', 'Fill Rate', 'Unique Values', 'Sample Data'];
    const rows = columns.map(col => ({
        'Column': col.name,
        'Type': getTypeEmoji(col.type) + ' ' + col.type,
        'Fill Rate': col.fillRate,
        'Unique Values': col.uniqueValues.toLocaleString(),
        'Sample Data': col.sampleValues ? col.sampleValues.slice(0, 2).join(', ') : 'N/A'
    }));

    return generateMarkdownTable(headers, rows);
};

/**
 * Generate validation section
 */
const generateValidationSection = (validationSummary) => {
    const sections = [`## ✅ Validation Results`];
    
    const statusEmoji = validationSummary.status === 'passed' ? '✅' : 
                       validationSummary.status === 'warning' ? '⚠️' : '❌';
    
    sections.push(`**Status:** ${statusEmoji} ${validationSummary.message}`);

    if (validationSummary.issuesByType && Object.keys(validationSummary.issuesByType).length > 0) {
        sections.push('');
        sections.push('### Issues Found:');
        
        Object.entries(validationSummary.issuesByType).forEach(([type, issues]) => {
            sections.push(`\n**${type.charAt(0).toUpperCase() + type.slice(1)} Issues (${issues.length}):**`);
            
            issues.forEach((issue, index) => {
                const severityEmoji = issue.severity === 'critical' ? '❌' : '⚠️';
                const location = issue.row !== undefined ? ` (Row ${issue.row + 1})` : '';
                sections.push(`${index + 1}. ${severityEmoji} ${issue.message}${location}`);
            });
        });
    }

    return sections.join('\n');
};

/**
 * Generate footer section
 */
const generateFooterSection = () => {
    const timestamp = new Date().toLocaleString();
    return `---

*Report generated by ValidAIte on ${timestamp}*

**Legend:**
- 📊 Numbers  📅 Dates  📝 Text  ✅ Boolean  ❌ Critical Issue  ⚠️ Warning`;
};

/**
 * Get emoji for quality score
 */
const getQualityEmoji = (score) => {
    if (score >= 90) return '🟢';
    if (score >= 75) return '🟡';
    if (score >= 50) return '🟠';
    return '🔴';
};

/**
 * Get color indicator for quality level
 */
const getQualityColor = (level) => {
    switch (level) {
        case 'Excellent': return '🟢';
        case 'Good': return '🟡';
        case 'Fair': return '🟠';
        case 'Poor': return '🔴';
        default: return '⚪';
    }
};

/**
 * Get emoji for data type
 */
const getTypeEmoji = (type) => {
    switch (type) {
        case 'number': return '📊';
        case 'date': return '📅';
        case 'boolean': return '✅';
        case 'text': return '📝';
        case 'empty': return '⚪';
        default: return '❓';
    }
};

/**
 * Generate issue summary for Jira issue title
 * @param {Object} analysis - Excel analysis results
 * @param {string} originalSummary - User provided summary
 * @returns {string} Enhanced issue summary
 */
export const generateIssueSummary = (analysis, originalSummary) => {
    if (originalSummary && originalSummary.trim()) {
        return originalSummary.trim();
    }

    const fileName = analysis.fileInfo.fileName;
    const qualityLevel = analysis.dataQuality.qualityLevel;
    const totalRows = analysis.overallStats.totalRows;
    
    return `Excel Analysis: ${fileName} (${totalRows.toLocaleString()} rows, ${qualityLevel} quality)`;
};

/**
 * Generate comment for additional details
 * @param {Object} analysis - Excel analysis results
 * @returns {string} Formatted comment content
 */
export const generateAnalysisComment = (analysis) => {
    const sections = [];

    sections.push('## 🔍 Detailed Analysis');

    // Processing summary
    sections.push(`**Processing completed successfully!**
- File processed: ${analysis.fileInfo.fileName}
- Data quality score: ${analysis.dataQuality.overallScore}/100
- Total data points analyzed: ${(analysis.overallStats.totalRows * analysis.overallStats.totalColumns).toLocaleString()}`);

    // Next steps recommendations
    if (analysis.dataQuality.overallScore < 90) {
        sections.push('');
        sections.push('## 💡 Recommendations');
        
        if (analysis.dataQuality.criticalIssues > 0) {
            sections.push('- ❌ **Critical issues found** - Please review and fix data quality problems before proceeding');
        }
        
        if (analysis.dataQuality.warningIssues > 0) {
            sections.push('- ⚠️ **Warnings detected** - Consider reviewing data for potential improvements');
        }
        
        sections.push('- 📋 Review the validation results above for specific issues');
        sections.push('- 🔄 Re-upload the file after making corrections if needed');
    } else {
        sections.push('');
        sections.push('## ✅ Data Quality Excellent');
        sections.push('Your Excel file has passed all quality checks and is ready for use!');
    }

    return sections.join('\n\n');
}
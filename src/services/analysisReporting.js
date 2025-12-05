/**
 * Analysis Reporting Service
 * Integrates Excel analysis with Jira issue creation for comprehensive reporting
 */

import { analyzeExcelFile } from './excelAnalysis.js';
import { generateIssueDescription, generateIssueSummary, generateAnalysisComment } from './reportGeneration.js';
import api, { route } from '@forge/api';

/**
 * Create Jira issue with comprehensive Excel analysis report
 * @param {string} summary - Issue summary
 * @param {string} description - User description
 * @param {Array} fileIds - Array of file IDs to analyze
 * @returns {Object} Result with issue details
 */
export const createIssueWithAnalysisReport = async (summary, description, fileIds) => {
    try {
        console.log('Creating issue with analysis report for files:', fileIds);

        if (!fileIds || fileIds.length === 0) {
            throw new Error('No files provided for analysis');
        }

        // Get stored files and analyze them
        const analysisResults = [];
        let totalFilesProcessed = 0;

        for (const fileId of fileIds) {
            try {
                // Get file from storage
                const fileResult = await getStoredFile(fileId);
                if (!fileResult.success) {
                    console.warn(`Could not retrieve file ${fileId}:`, fileResult.error);
                    continue;
                }

                // Analyze the Excel file
                const analysis = await analyzeExcelFile(
                    fileResult.excelData,
                    fileResult.validationResult,
                    fileResult.fileName,
                    fileResult.size
                );

                analysisResults.push(analysis);
                totalFilesProcessed++;

            } catch (error) {
                console.error(`Error analyzing file ${fileId}:`, error);
                // Continue with other files
            }
        }

        if (analysisResults.length === 0) {
            throw new Error('No files could be analyzed successfully');
        }

        // Generate comprehensive report
        const combinedAnalysis = combineAnalysisResults(analysisResults);
        const issueDescription = generateIssueDescription(combinedAnalysis, description);
        const issueSummary = summary || generateIssueSummary(combinedAnalysis);

        // Create Jira issue
        const issueData = {
            fields: {
                summary: issueSummary,
                description: issueDescription,
                issuetype: { name: 'Task' },
                project: { key: await getProjectKey() }
            }
        };

        console.log('Creating Jira issue with analysis report...');
        const response = await api.asUser().requestJira(route`/rest/api/3/issue`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(issueData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create issue: ${response.status} ${errorText}`);
        }

        const createdIssue = await response.json();
        console.log('Issue created successfully:', createdIssue.key);

        // Add detailed analysis comment
        if (analysisResults.length > 0) {
            await addAnalysisComment(createdIssue.key, combinedAnalysis);
        }

        // Clean up processed files
        await cleanupProcessedFiles(fileIds);

        return {
            success: true,
            message: `Issue created with comprehensive analysis report`,
            issueKey: createdIssue.key,
            issueUrl: `${await getJiraBaseUrl()}/browse/${createdIssue.key}`,
            filesAnalyzed: totalFilesProcessed,
            overallQuality: combinedAnalysis.dataQuality.qualityLevel,
            totalDataPoints: combinedAnalysis.overallStats.totalRows * combinedAnalysis.overallStats.totalColumns
        };

    } catch (error) {
        console.error('Error creating issue with analysis report:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Combine multiple analysis results into a single comprehensive report
 */
const combineAnalysisResults = (analysisResults) => {
    if (analysisResults.length === 1) {
        return analysisResults[0];
    }

    // Combine multiple file analyses
    const combined = {
        fileInfo: {
            fileName: `${analysisResults.length} Excel files`,
            fileSize: analysisResults.reduce((sum, a) => sum + parseFileSize(a.fileInfo.fileSize), 0),
            uploadDate: analysisResults[0].fileInfo.uploadDate,
            totalSheets: analysisResults.reduce((sum, a) => sum + a.fileInfo.totalSheets, 0)
        },
        overallStats: {
            totalRows: analysisResults.reduce((sum, a) => sum + a.overallStats.totalRows, 0),
            totalColumns: Math.max(...analysisResults.map(a => a.overallStats.totalColumns)),
            averageRowsPerSheet: 0,
            largestSheet: 'Multiple files'
        },
        dataQuality: combineDataQuality(analysisResults),
        sheetAnalysis: combineSheetAnalysis(analysisResults),
        previewData: analysisResults[0].previewData, // Use first file's preview
        validationSummary: combineValidationSummary(analysisResults)
    };

    // Calculate average rows per sheet
    combined.overallStats.averageRowsPerSheet = Math.round(
        combined.overallStats.totalRows / combined.fileInfo.totalSheets
    );

    // Format combined file size
    combined.fileInfo.fileSize = formatFileSize(combined.fileInfo.fileSize);

    return combined;
};

/**
 * Combine data quality from multiple analyses
 */
const combineDataQuality = (analysisResults) => {
    const totalIssues = analysisResults.reduce((sum, a) => sum + a.dataQuality.totalIssues, 0);
    const criticalIssues = analysisResults.reduce((sum, a) => sum + a.dataQuality.criticalIssues, 0);
    const warningIssues = analysisResults.reduce((sum, a) => sum + a.dataQuality.warningIssues, 0);
    
    // Calculate weighted average score
    const totalDataPoints = analysisResults.reduce((sum, a) => 
        sum + (a.overallStats.totalRows * a.overallStats.totalColumns), 0
    );
    
    const weightedScore = analysisResults.reduce((sum, a) => {
        const weight = (a.overallStats.totalRows * a.overallStats.totalColumns) / totalDataPoints;
        return sum + (a.dataQuality.overallScore * weight);
    }, 0);

    const overallScore = Math.round(weightedScore);
    
    let qualityLevel;
    if (overallScore >= 90) qualityLevel = 'Excellent';
    else if (overallScore >= 75) qualityLevel = 'Good';
    else if (overallScore >= 50) qualityLevel = 'Fair';
    else qualityLevel = 'Poor';

    return {
        overallScore,
        totalIssues,
        criticalIssues,
        warningIssues,
        qualityLevel
    };
};

/**
 * Combine sheet analysis from multiple files
 */
const combineSheetAnalysis = (analysisResults) => {
    const combined = {};
    
    analysisResults.forEach((analysis, fileIndex) => {
        Object.entries(analysis.sheetAnalysis).forEach(([sheetName, sheetData]) => {
            const combinedSheetName = analysisResults.length > 1 
                ? `File ${fileIndex + 1}: ${sheetName}`
                : sheetName;
            combined[combinedSheetName] = sheetData;
        });
    });

    return combined;
};

/**
 * Combine validation summaries
 */
const combineValidationSummary = (analysisResults) => {
    const allIssues = [];
    const issuesByType = {};

    analysisResults.forEach(analysis => {
        if (analysis.validationSummary.issuesByType) {
            Object.entries(analysis.validationSummary.issuesByType).forEach(([type, issues]) => {
                if (!issuesByType[type]) {
                    issuesByType[type] = [];
                }
                issuesByType[type].push(...issues);
                allIssues.push(...issues);
            });
        }
    });

    const hasCritical = allIssues.some(issue => issue.severity === 'critical');
    const status = hasCritical ? 'failed' : allIssues.length > 0 ? 'warning' : 'passed';
    
    const message = status === 'passed' 
        ? 'All validation checks passed successfully'
        : `Found ${allIssues.length} validation issues across all files`;

    return {
        status,
        message,
        issuesByType,
        totalIssues: allIssues.length
    };
};

/**
 * Add detailed analysis comment to issue
 */
const addAnalysisComment = async (issueKey, analysis) => {
    try {
        const commentBody = generateAnalysisComment(analysis);
        
        const commentData = {
            body: commentBody
        };

        const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(commentData)
        });

        if (response.ok) {
            console.log('Analysis comment added successfully');
        } else {
            console.warn('Failed to add analysis comment:', response.status);
        }
    } catch (error) {
        console.error('Error adding analysis comment:', error);
        // Don't fail the whole operation for comment errors
    }
};

/**
 * Get stored file data
 */
const getStoredFile = async (fileId) => {
    try {
        // This would typically call your storage service
        // For now, we'll simulate getting file data
        const { storage } = await import('@forge/api');
        
        const fileData = await storage.get(fileId);
        if (!fileData) {
            return {
                success: false,
                error: 'File not found in storage'
            };
        }

        return {
            success: true,
            ...fileData
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Clean up processed files from storage
 */
const cleanupProcessedFiles = async (fileIds) => {
    try {
        const { storage } = await import('@forge/api');
        
        for (const fileId of fileIds) {
            try {
                await storage.delete(fileId);
                console.log(`Cleaned up file: ${fileId}`);
            } catch (error) {
                console.warn(`Failed to cleanup file ${fileId}:`, error);
            }
        }
    } catch (error) {
        console.error('Error during file cleanup:', error);
    }
};

/**
 * Get project key from context
 */
const getProjectKey = async () => {
    try {
        // Try to get from context first
        const context = await import('@forge/api').then(api => api.context);
        if (context && context.extension && context.extension.project) {
            return context.extension.project.key;
        }
        
        // Fallback: get first available project
        const response = await api.asUser().requestJira(route`/rest/api/3/project`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const projects = await response.json();
            if (projects.length > 0) {
                return projects[0].key;
            }
        }
        
        throw new Error('No accessible projects found');
    } catch (error) {
        console.error('Error getting project key:', error);
        throw new Error('Could not determine project for issue creation');
    }
};

/**
 * Get Jira base URL
 */
const getJiraBaseUrl = async () => {
    try {
        const response = await api.asUser().requestJira(route`/rest/api/3/serverInfo`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const serverInfo = await response.json();
            return serverInfo.baseUrl;
        }
        
        return 'https://your-domain.atlassian.net'; // Fallback
    } catch (error) {
        console.error('Error getting Jira base URL:', error);
        return 'https://your-domain.atlassian.net'; // Fallback
    }
};

/**
 * Parse file size string back to bytes
 */
const parseFileSize = (sizeString) => {
    const match = sizeString.match(/^([\d.]+)\s*(\w+)$/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    
    const multipliers = {
        'bytes': 1,
        'kb': 1024,
        'mb': 1024 * 1024,
        'gb': 1024 * 1024 * 1024
    };
    
    return value * (multipliers[unit] || 1);
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

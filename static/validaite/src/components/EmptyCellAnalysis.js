/**
 * Empty Cell Analysis Component
 * Displays detailed analysis of empty cells with specific row/column information
 * Shows which cells should be empty vs. which shouldn't be empty
 */

import React, { useState, useEffect } from 'react';

const EmptyCellAnalysis = ({ excelData, fileName, onAnalysisComplete }) => {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock analysis function (replace with actual API call when OpenAI is configured)
  const analyzeEmptyCells = async (data, context) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find empty cells
    const emptyCells = [];
    data.forEach((row, rowIndex) => {
      if (!row) return;
      Object.keys(row).forEach(column => {
        const value = row[column];
        if (value === null || value === undefined || value === '' || 
            (typeof value === 'string' && value.trim() === '')) {
          emptyCells.push({
            row: rowIndex + 1,
            column,
            location: `${column}${rowIndex + 1}`,
            value: value
          });
        }
      });
    });

    // Mock AI analysis result
    const mockAnalysis = {
      totalEmptyCells: emptyCells.length,
      summary: `Found ${emptyCells.length} empty cells. Analysis shows a mix of acceptable empty fields and missing required data that needs attention.`,
      overallAssessment: emptyCells.length > 10 ? "WARNING" : emptyCells.length > 5 ? "CAUTION" : "ACCEPTABLE",
      cellsShouldBeEmpty: emptyCells.filter((_, index) => index % 3 === 0).map(cell => ({
        ...cell,
        reason: `${cell.column} appears to be an optional field based on data patterns`,
        category: "OPTIONAL_FIELD"
      })),
      cellsShouldNotBeEmpty: emptyCells.filter((_, index) => index % 3 === 1).map(cell => ({
        ...cell,
        reason: `${cell.column} is likely a required field for data integrity`,
        action: `Enter appropriate value for ${cell.column} in row ${cell.row}`,
        severity: "HIGH",
        category: "REQUIRED_FIELD"
      })),
      uncertainCells: emptyCells.filter((_, index) => index % 3 === 2).map(cell => ({
        ...cell,
        reason: `Context unclear for ${cell.column} - could be optional or required`,
        possibleActions: [
          `Verify if ${cell.column} is required`,
          `Check data source for missing information`,
          `Consider marking as N/A if not applicable`
        ]
      }))
    };

    return { success: true, analysis: mockAnalysis };
  };

  const handleAnalyze = async () => {
    if (!excelData || excelData.length === 0) {
      setError('No Excel data available for analysis');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const context = {
        fileName: fileName || 'unknown',
        documentType: 'Excel Data'
      };

      const result = await analyzeEmptyCells(excelData, context);
      
      if (result.success) {
        setAnalysis(result.analysis);
        if (onAnalysisComplete) {
          onAnalysisComplete(result.analysis);
        }
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (err) {
      setError(`Analysis error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAssessmentColor = (assessment) => {
    switch (assessment) {
      case 'ACCEPTABLE': return '#4CAF50';
      case 'CAUTION': return '#FF9800';
      case 'WARNING': return '#F44336';
      case 'CRITICAL': return '#D32F2F';
      default: return '#9E9E9E';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'HIGH': return '🔴';
      case 'MEDIUM': return '🟡';
      case 'LOW': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="empty-cell-analysis">
      <div className="analysis-header">
        <h3>🔍 Empty Cell Analysis</h3>
        <p>Analyze which empty cells are acceptable vs. problematic</p>
      </div>

      {!analysis && !isAnalyzing && (
        <div className="analysis-prompt">
          <button 
            className="analyze-button"
            onClick={handleAnalyze}
            disabled={!excelData || excelData.length === 0}
          >
            🚀 Analyze Empty Cells
          </button>
          <p className="analysis-description">
            AI will examine each empty cell and determine if it should be empty or needs data
          </p>
        </div>
      )}

      {isAnalyzing && (
        <div className="analysis-loading">
          <div className="loading-spinner"></div>
          <p>🤖 AI is analyzing empty cells...</p>
          <p className="loading-detail">Examining patterns and determining cell requirements</p>
        </div>
      )}

      {error && (
        <div className="analysis-error">
          <p>❌ {error}</p>
          <button onClick={handleAnalyze} className="retry-button">
            🔄 Retry Analysis
          </button>
        </div>
      )}

      {analysis && (
        <div className="analysis-results">
          {/* Summary Section */}
          <div className="analysis-summary">
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-number">{analysis.totalEmptyCells}</span>
                <span className="stat-label">Empty Cells Found</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{analysis.cellsShouldNotBeEmpty?.length || 0}</span>
                <span className="stat-label">Need Attention</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{analysis.cellsShouldBeEmpty?.length || 0}</span>
                <span className="stat-label">Correctly Empty</span>
              </div>
            </div>
            
            <div 
              className="assessment-badge"
              style={{ backgroundColor: getAssessmentColor(analysis.overallAssessment) }}
            >
              {analysis.overallAssessment}
            </div>
          </div>

          <p className="analysis-summary-text">{analysis.summary}</p>

          {/* Navigation Tabs */}
          <div className="analysis-tabs">
            <button 
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab-button ${activeTab === 'problematic' ? 'active' : ''}`}
              onClick={() => setActiveTab('problematic')}
            >
              ❌ Need Data ({analysis.cellsShouldNotBeEmpty?.length || 0})
            </button>
            <button 
              className={`tab-button ${activeTab === 'correct' ? 'active' : ''}`}
              onClick={() => setActiveTab('correct')}
            >
              ✅ Correctly Empty ({analysis.cellsShouldBeEmpty?.length || 0})
            </button>
            {analysis.uncertainCells?.length > 0 && (
              <button 
                className={`tab-button ${activeTab === 'uncertain' ? 'active' : ''}`}
                onClick={() => setActiveTab('uncertain')}
              >
                ⚠️ Uncertain ({analysis.uncertainCells.length})
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <div className="quick-stats">
                  <div className="stat-card problematic">
                    <h4>❌ Cells That Need Data</h4>
                    <div className="stat-number">{analysis.cellsShouldNotBeEmpty?.length || 0}</div>
                    <p>These empty cells likely need data for completeness</p>
                  </div>
                  <div className="stat-card correct">
                    <h4>✅ Correctly Empty Cells</h4>
                    <div className="stat-number">{analysis.cellsShouldBeEmpty?.length || 0}</div>
                    <p>These cells are appropriately empty</p>
                  </div>
                  {analysis.uncertainCells?.length > 0 && (
                    <div className="stat-card uncertain">
                      <h4>⚠️ Uncertain Cases</h4>
                      <div className="stat-number">{analysis.uncertainCells.length}</div>
                      <p>These cells need manual review</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'problematic' && (
              <div className="problematic-tab">
                <h4>❌ Cells That Should NOT Be Empty</h4>
                {analysis.cellsShouldNotBeEmpty?.length > 0 ? (
                  <div className="cell-list">
                    {analysis.cellsShouldNotBeEmpty.map((cell, index) => (
                      <div key={index} className="cell-item problematic">
                        <div className="cell-header">
                          <span className="cell-location">
                            📍 Row {cell.row}, Column "{cell.column}" ({cell.location})
                          </span>
                          {cell.severity && (
                            <span className="severity-badge">
                              {getSeverityIcon(cell.severity)} {cell.severity}
                            </span>
                          )}
                        </div>
                        <div className="cell-reason">
                          <strong>Why it needs data:</strong> {cell.reason}
                        </div>
                        {cell.action && (
                          <div className="cell-action">
                            <strong>Action needed:</strong> {cell.action}
                          </div>
                        )}
                        {cell.category && (
                          <div className="cell-category">
                            <span className="category-tag">{cell.category}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-items">
                    <p>🎉 Great! No problematic empty cells found.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'correct' && (
              <div className="correct-tab">
                <h4>✅ Cells That Are Correctly Empty</h4>
                {analysis.cellsShouldBeEmpty?.length > 0 ? (
                  <div className="cell-list">
                    {analysis.cellsShouldBeEmpty.map((cell, index) => (
                      <div key={index} className="cell-item correct">
                        <div className="cell-header">
                          <span className="cell-location">
                            📍 Row {cell.row}, Column "{cell.column}" ({cell.location})
                          </span>
                        </div>
                        <div className="cell-reason">
                          <strong>Why it's OK to be empty:</strong> {cell.reason}
                        </div>
                        {cell.category && (
                          <div className="cell-category">
                            <span className="category-tag correct">{cell.category}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-items">
                    <p>No cells identified as correctly empty.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'uncertain' && analysis.uncertainCells?.length > 0 && (
              <div className="uncertain-tab">
                <h4>⚠️ Uncertain Cases</h4>
                <div className="cell-list">
                  {analysis.uncertainCells.map((cell, index) => (
                    <div key={index} className="cell-item uncertain">
                      <div className="cell-header">
                        <span className="cell-location">
                          📍 Row {cell.row}, Column "{cell.column}" ({cell.location})
                        </span>
                      </div>
                      <div className="cell-reason">
                        <strong>Why it's uncertain:</strong> {cell.reason}
                      </div>
                      {cell.possibleActions && (
                        <div className="possible-actions">
                          <strong>Possible actions:</strong>
                          <ul>
                            {cell.possibleActions.map((action, actionIndex) => (
                              <li key={actionIndex}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmptyCellAnalysis;

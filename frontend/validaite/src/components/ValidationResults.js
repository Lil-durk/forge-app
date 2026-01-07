/**
 * Enhanced Validation Results Component
 * Displays AI validation results with scores, issues, UX-friendly suggestions, and historical insights
 */

import React, { useState } from 'react';

const ValidationResults = ({ validationResult, isUsingCachedResult = false, excelData, fileName }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!validationResult) return null;

  const getIssueIcon = (type) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const validation = validationResult.validation;
  const historicalInsights = validationResult.historicalInsights;
  const isEnhanced = validation.uxFriendlySuggestions && validation.riskAssessment;

  return (
    <div className="validation-results enhanced">
      <div className="results-header">
        <h3>Smart Validation Results</h3>
        {isUsingCachedResult && (
          <div className="cached-indicator">
            <span className="cache-badge">Cached Result</span>
            <span className="cache-description">Same file content detected - using previous validation</span>
          </div>
        )}
      </div>
      
      <div className="validation-summary enhanced">
        <div className="score-section">
          <div 
            className="score-circle enhanced"
            style={{ borderColor: getScoreColor(validation.overallScore) }}
          >
            <span style={{ color: getScoreColor(validation.overallScore) }}>
              {validation.overallScore}
            </span>
            <div className="score-sublabel">
              {validation.confidenceLevel && `${validation.confidenceLevel} confidence`}
            </div>
          </div>
          <div className="score-label">Overall Score</div>
        </div>
        
        <div className="validation-status enhanced">
          <div className={`status-badge ${validation.isValid ? 'valid' : 'invalid'}`}>
            {validation.isValid ? 'Ready to Submit' : 'Needs Attention'}
          </div>
          
          {/* Risk Assessment */}
          {isEnhanced && validation.riskAssessment && (
            <div className="risk-assessment">
              <div 
                className="risk-badge"
                style={{ backgroundColor: getRiskColor(validation.riskAssessment.rejectionRisk) }}
              >
                {validation.riskAssessment.rejectionRisk.toUpperCase()} RISK
              </div>
              {historicalInsights && (
                <div className="historical-context">
                  📊 Based on {historicalInsights.totalHistoricalTickets} historical tickets
                </div>
              )}
            </div>
          )}
          
          <p className="summary-text">{validation.summary}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="results-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        {isEnhanced && (
          <button 
            className={`tab-button ${activeTab === 'suggestions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestions')}
          >
            Smart Suggestions
          </button>
        )}
        <button 
          className={`tab-button ${activeTab === 'issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          Issues ({validation.issues?.length || 0})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {validation.recommendations && validation.recommendations.length > 0 && (
              <div className="recommendations-section">
                <h4>Key Recommendations</h4>
                <ul className="recommendations-list">
                  {validation.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {isEnhanced && validation.historicalComparison && (
              <div className="comparison-section">
                <h4>How You Compare</h4>
                <div className="comparison-stats">
                  <div className="stat-item">
                    <span className="stat-label">Score vs Average:</span>
                    <span className={`stat-value ${validation.historicalComparison.scoreVsAverage}`}>
                      {validation.historicalComparison.scoreVsAverage.toUpperCase()}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Similar Successful Tickets:</span>
                    <span className="stat-value">{validation.historicalComparison.similarSuccessfulTickets}</span>
                  </div>
                  <div className="improvement-potential">
                    <strong>Improvement Potential:</strong> {validation.historicalComparison.improvementPotential}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Smart Suggestions Tab */}
        {activeTab === 'suggestions' && isEnhanced && validation.uxFriendlySuggestions && (
          <div className="suggestions-tab">
            
            {validation.uxFriendlySuggestions.criticalActions?.length > 0 && (
              <div className="suggestion-section critical">
                <h4>🚨 Critical Actions (Must Fix)</h4>
                <ul>
                  {validation.uxFriendlySuggestions.criticalActions.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.uxFriendlySuggestions.quickWins?.length > 0 && (
              <div className="suggestion-section quick-wins">
                <h4>Quick Wins (Easy Improvements)</h4>
                <ul>
                  {validation.uxFriendlySuggestions.quickWins.map((win, index) => (
                    <li key={index}>{win}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.uxFriendlySuggestions.bestPractices?.length > 0 && (
              <div className="suggestion-section best-practices">
                <h4>Best Practices (From Successful Tickets)</h4>
                <ul>
                  {validation.uxFriendlySuggestions.bestPractices.map((practice, index) => (
                    <li key={index}>{practice}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.uxFriendlySuggestions.preventiveMeasures?.length > 0 && (
              <div className="suggestion-section preventive">
                <h4>Preventive Measures (Avoid Common Problems)</h4>
                <ul>
                  {validation.uxFriendlySuggestions.preventiveMeasures.map((measure, index) => (
                    <li key={index}>{measure}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="issues-tab">
            {validation.issues && validation.issues.length > 0 ? (
              <div className="issues-list enhanced">
                {validation.issues.map((issue, index) => (
                  <div key={index} className={`issue-item enhanced ${issue.type} priority-${issue.priority || 'medium'}`}>
                    <div className="issue-header enhanced">
                      <span className="issue-icon">{getIssueIcon(issue.type)}</span>
                      <span className="issue-field">{issue.field}</span>
                      <span className="issue-row">Row {issue.row}</span>
                      {issue.priority && (
                        <span className="priority-badge">
                          {getPriorityIcon(issue.priority)} {issue.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="issue-message">{issue.message}</div>
                    <div className="issue-suggestion"><strong>Fix:</strong> {issue.suggestion}</div>
                    {issue.historicalContext && (
                      <div className="historical-context">
                       <strong>Why this matters:</strong> {issue.historicalContext}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-issues">
                <div className="success-message">
                  <strong>Great job!</strong> No issues found in your data.
                </div>
              </div>
            )}
          </div>
        )}


        {/* Historical Insights Tab */}
        {activeTab === 'insights' && historicalInsights && (
          <div className="insights-tab">
            <div className="learning-status">
              <h4>AI Learning Status</h4>
              <div className="status-indicator">
                <span className={`status-dot ${historicalInsights.learningStatus}`}></span>
                {historicalInsights.learningStatus === 'active' ? 
                  `Learning from ${historicalInsights.totalHistoricalTickets} tickets` :
                  'Building knowledge base from your submissions'
                }
              </div>
            </div>

            {historicalInsights.riskAssessment && historicalInsights.riskAssessment.riskFactors?.length > 0 && (
              <div className="risk-factors">
                <h4>Risk Factors Identified</h4>
                <ul>
                  {historicalInsights.riskAssessment.riskFactors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.riskAssessment?.similarHistoricalOutcomes?.length > 0 && (
              <div className="similar-outcomes">
                <h4>Similar Historical Cases</h4>
                <ul>
                  {validation.riskAssessment.similarHistoricalOutcomes.map((outcome, index) => (
                    <li key={index}>{outcome}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationResults;

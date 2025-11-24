/**
 * Validation Results Component
 * Displays AI validation results with scores, issues, and recommendations
 */

import React from 'react';

const ValidationResults = ({ validationResult }) => {
  if (!validationResult) return null;

  const getIssueIcon = (type) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  return (
    <div className="validation-results">
      <h3>Validation Results</h3>
      
      <div className="validation-summary">
        <div className="score-section">
          <div 
            className="score-circle"
            style={{ borderColor: getScoreColor(validationResult.validation.overallScore) }}
          >
            <span style={{ color: getScoreColor(validationResult.validation.overallScore) }}>
              {validationResult.validation.overallScore}
            </span>
          </div>
          <div className="score-label">Overall Score</div>
        </div>
        
        <div className="validation-status">
          <div className={`status-badge ${validationResult.validation.isValid ? 'valid' : 'invalid'}`}>
            {validationResult.validation.isValid ? '✅ Valid' : '❌ Issues Found'}
          </div>
          <p>{validationResult.validation.summary}</p>
        </div>
      </div>

      {validationResult.validation.issues && validationResult.validation.issues.length > 0 && (
        <div className="issues-section">
          <h4>Issues Found</h4>
          <div className="issues-list">
            {validationResult.validation.issues.map((issue, index) => (
              <div key={index} className={`issue-item ${issue.type}`}>
                <div className="issue-header">
                  <span className="issue-icon">{getIssueIcon(issue.type)}</span>
                  <span className="issue-field">{issue.field}</span>
                  <span className="issue-row">Row {issue.row}</span>
                </div>
                <div className="issue-message">{issue.message}</div>
                <div className="issue-suggestion">💡 {issue.suggestion}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {validationResult.validation.recommendations && validationResult.validation.recommendations.length > 0 && (
        <div className="recommendations-section">
          <h4>Recommendations</h4>
          <ul className="recommendations-list">
            {validationResult.validation.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ValidationResults;

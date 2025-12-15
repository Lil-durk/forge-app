import React from 'react';
import { getApprovalStatusColor, getSeverityColor, styles } from './styleUtils.js';

const ValidationResultsDisplay = ({ validationResult }) => {
  if (!validationResult) return null;

  return (
    <div style={{
      border: '1px solid #DFE1E6',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: 'white'
    }}>
      <h3>Delivery Lead Assessment</h3>
      
      {/* Executive Summary */}
      <div style={{
        padding: '15px',
        backgroundColor: '#F4F5F7',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, marginRight: '15px' }}>Decision:</h4>
          <span style={{
            ...styles.badge,
            backgroundColor: getApprovalStatusColor(validationResult.deliveryLeadValidation.approvalDecision)
          }}>
            {validationResult.deliveryLeadValidation.approvalDecision}
          </span>
          <span style={{ marginLeft: '15px', color: '#6B778C' }}>
            Confidence: {validationResult.deliveryLeadValidation.confidenceScore}%
          </span>
        </div>
        <p><strong>Executive Summary:</strong> {validationResult.deliveryLeadValidation.executiveSummary}</p>
      </div>

      {/* Detailed Assessment */}
      <div style={{ ...styles.gridTwoColumns, marginBottom: '20px' }}>
        <div>
          <h4>Business Alignment</h4>
          <div style={styles.scoreBox}>
            <div>Score: {validationResult.deliveryLeadValidation.detailedAssessment.businessAlignment.score}/100</div>
            <div style={{ marginTop: '5px', fontSize: '14px' }}>
              {validationResult.deliveryLeadValidation.detailedAssessment.businessAlignment.assessment}
            </div>
          </div>
          
          <h4 style={{ marginTop: '15px' }}>Data Quality</h4>
          <div style={styles.scoreBox}>
            <div>Overall: {validationResult.deliveryLeadValidation.detailedAssessment.dataQuality.overallQuality}/100</div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              Completeness: {validationResult.deliveryLeadValidation.detailedAssessment.dataQuality.completeness}/100 | 
              Accuracy: {validationResult.deliveryLeadValidation.detailedAssessment.dataQuality.accuracy}/100 | 
              Consistency: {validationResult.deliveryLeadValidation.detailedAssessment.dataQuality.consistency}/100
            </div>
          </div>
        </div>
        
        <div>
          <h4>Risk Assessment</h4>
          <div style={styles.scoreBox}>
            <div style={{ 
              color: getSeverityColor(validationResult.deliveryLeadValidation.detailedAssessment.riskAssessment.level),
              fontWeight: 'bold'
            }}>
              Level: {validationResult.deliveryLeadValidation.detailedAssessment.riskAssessment.level}
            </div>
            <div style={{ fontSize: '14px', marginTop: '5px' }}>
              {validationResult.deliveryLeadValidation.detailedAssessment.riskAssessment.identifiedRisks?.slice(0, 2).join(', ')}
            </div>
          </div>
          
          <h4 style={{ marginTop: '15px' }}>✅ Compliance</h4>
          <div style={styles.scoreBox}>
            <div style={{ 
              color: validationResult.deliveryLeadValidation.detailedAssessment.complianceStatus.compliant ? '#00875A' : '#DE350B',
              fontWeight: 'bold'
            }}>
              {validationResult.deliveryLeadValidation.detailedAssessment.complianceStatus.compliant ? '✅ Compliant' : '❌ Non-Compliant'}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Issues */}
      {validationResult.deliveryLeadValidation.criticalIssues?.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4>Critical Issues</h4>
          {validationResult.deliveryLeadValidation.criticalIssues.map((issue, index) => (
            <div key={index} style={{
              padding: '10px',
              margin: '5px 0',
              border: `1px solid ${getSeverityColor(issue.severity)}`,
              borderRadius: '4px',
              backgroundColor: '#FAFBFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: 'white',
                  backgroundColor: getSeverityColor(issue.severity),
                  marginRight: '10px'
                }}>
                  {issue.severity}
                </span>
                <span style={{ fontWeight: 'bold' }}>{issue.category}</span>
              </div>
              <div style={{ fontSize: '14px' }}>
                <strong>Issue:</strong> {issue.description}
              </div>
              <div style={{ fontSize: '14px', marginTop: '5px' }}>
                <strong>Recommendation:</strong> {issue.recommendation}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      <div style={styles.gridTwoColumns}>
        <div>
          <h4>Delivery Lead Recommendations</h4>
          <ul style={{ fontSize: '14px' }}>
            {validationResult.deliveryLeadValidation.deliveryLeadRecommendations?.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4>Next Steps</h4>
          <ul style={{ fontSize: '14px' }}>
            {validationResult.deliveryLeadValidation.nextSteps?.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Metadata */}
      <div style={styles.metadata}>
        <strong>Evaluation Details:</strong> 
        Process Type: {validationResult.contextAnalysis?.processType} | 
        Data Rows: {validationResult.metadata?.dataRowsEvaluated} | 
        Timestamp: {new Date(validationResult.metadata?.evaluationTimestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default ValidationResultsDisplay;

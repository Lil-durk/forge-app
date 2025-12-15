import React, { useState } from 'react';
import { invoke } from '@forge/bridge';

const DeliveryLeadValidation = ({ excelData, pageContext }) => {
  const [validationResult, setValidationResult] = useState(null);
  const [contextAnalysis, setContextAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const performValidation = async () => {
    if (!excelData || excelData.length === 0) {
      setError('No Excel data available for validation');
      return;
    }

    setLoading(true);
    setError(null);
    setValidationResult(null);

    try {
      console.log('Starting delivery lead validation...');
      
      const result = await invoke('performDeliveryLeadValidation', {
        excelData,
        pageContext
      });

      console.log('Validation result received:', result);

      if (result.success) {
        setValidationResult(result.result);
      } else {
        setError(result.error || 'Validation failed');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError(err.message || 'Failed to perform validation');
    } finally {
      setLoading(false);
    }
  };

  const analyzeContextOnly = async () => {
    if (!excelData || excelData.length === 0) {
      setError('No Excel data available for analysis');
      return;
    }

    setLoading(true);
    setError(null);
    setContextAnalysis(null);

    try {
      console.log('Starting context analysis...');
      
      const result = await invoke('analyzeContext', {
        excelData,
        pageContext
      });

      console.log('Context analysis result:', result);

      if (result.success) {
        setContextAnalysis(result.contextAnalysis);
      } else {
        setError(result.error || 'Context analysis failed');
      }
    } catch (err) {
      console.error('Context analysis error:', err);
      setError(err.message || 'Failed to analyze context');
    } finally {
      setLoading(false);
    }
  };

  const getApprovalStatusColor = (decision) => {
    switch (decision) {
      case 'APPROVED': return '#00875A';
      case 'REJECTED': return '#DE350B';
      case 'NEEDS_REVISION': return '#FF8B00';
      default: return '#6B778C';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return '#DE350B';
      case 'HIGH': return '#FF8B00';
      case 'MEDIUM': return '#FFAB00';
      case 'LOW': return '#00875A';
      default: return '#6B778C';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px' }}>
      <h2>Delivery Lead Validation</h2>
      <p>AI simuleert een delivery lead die beoordeelt of het Excel bestand goedgekeurd zou worden.</p>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={performValidation}
          disabled={loading || !excelData || excelData.length === 0}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0052CC',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '🔄 Validating...' : '🎯 Perform Delivery Lead Validation'}
        </button>
        
        <button 
          onClick={analyzeContextOnly}
          disabled={loading || !excelData || excelData.length === 0}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6B778C',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '🔄 Analyzing...' : '🔍 Analyze Context Only'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#FFEBE6',
          border: '1px solid #DE350B',
          borderRadius: '4px',
          color: '#DE350B',
          marginBottom: '20px'
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Context Analysis Results */}
      {contextAnalysis && (
        <div style={{
          border: '1px solid #DFE1E6',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          backgroundColor: '#F4F5F7'
        }}>
          <h3>Context Analysis</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4>Process Type</h4>
              <p style={{ 
                padding: '10px', 
                backgroundColor: '#E3FCEF', 
                borderRadius: '4px',
                fontWeight: 'bold'
              }}>
                {contextAnalysis.processType}
              </p>
              
              <h4>Business Goals</h4>
              <ul>
                {contextAnalysis.businessGoals?.map((goal, index) => (
                  <li key={index}>{goal}</li>
                ))}
              </ul>
              
              <h4>Key Stakeholders</h4>
              <ul>
                {contextAnalysis.keyStakeholders?.map((stakeholder, index) => (
                  <li key={index}>{stakeholder}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4>Required Fields</h4>
              <ul>
                {contextAnalysis.typicalRequiredFields?.map((field, index) => (
                  <li key={index}>{field}</li>
                ))}
              </ul>
              
              <h4>Risk Factors</h4>
              <ul>
                {contextAnalysis.riskFactors?.map((risk, index) => (
                  <li key={index}>{risk}</li>
                ))}
              </ul>
              
              <div style={{ marginTop: '10px' }}>
                <strong>AI Confidence: </strong>
                <span style={{ 
                  color: contextAnalysis.confidence > 80 ? '#00875A' : 
                         contextAnalysis.confidence > 60 ? '#FF8B00' : '#DE350B'
                }}>
                  {contextAnalysis.confidence}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Results */}
      {validationResult && (
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
                padding: '5px 15px',
                borderRadius: '20px',
                color: 'white',
                backgroundColor: getApprovalStatusColor(validationResult.deliveryLeadValidation.approvalDecision),
                fontWeight: 'bold'
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <h4>Business Alignment</h4>
              <div style={{ padding: '10px', backgroundColor: '#F4F5F7', borderRadius: '4px' }}>
                <div>Score: {validationResult.deliveryLeadValidation.detailedAssessment.businessAlignment.score}/100</div>
                <div style={{ marginTop: '5px', fontSize: '14px' }}>
                  {validationResult.deliveryLeadValidation.detailedAssessment.businessAlignment.assessment}
                </div>
              </div>
              
              <h4 style={{ marginTop: '15px' }}>Data Quality</h4>
              <div style={{ padding: '10px', backgroundColor: '#F4F5F7', borderRadius: '4px' }}>
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
              <div style={{ padding: '10px', backgroundColor: '#F4F5F7', borderRadius: '4px' }}>
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
              <div style={{ padding: '10px', backgroundColor: '#F4F5F7', borderRadius: '4px' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
          <div style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#F4F5F7',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#6B778C'
          }}>
            <strong>Evaluation Details:</strong> 
            Process Type: {validationResult.contextAnalysis?.processType} | 
            Data Rows: {validationResult.metadata?.dataRowsEvaluated} | 
            Timestamp: {new Date(validationResult.metadata?.evaluationTimestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryLeadValidation;

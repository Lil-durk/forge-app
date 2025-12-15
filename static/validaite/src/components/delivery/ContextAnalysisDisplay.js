import React from 'react';
import { styles } from './styleUtils.js';

const ContextAnalysisDisplay = ({ contextAnalysis }) => {
  if (!contextAnalysis) return null;

  return (
    <div style={styles.resultBox}>
      <h3>Context Analysis</h3>
      <div style={styles.gridTwoColumns}>
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
  );
};

export default ContextAnalysisDisplay;

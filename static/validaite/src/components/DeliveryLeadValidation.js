import React, { useState } from 'react';
import { invoke } from '@forge/bridge';
import ValidationControls from './delivery/ValidationControls.js';
import ContextAnalysisDisplay from './delivery/ContextAnalysisDisplay.js';
import ValidationResultsDisplay from './delivery/ValidationResultsDisplay.js';
import { styles } from './delivery/styleUtils.js';

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
      const result = await invoke('performDeliveryLeadValidation', {
        excelData,
        pageContext
      });

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
      const result = await invoke('analyzeContext', {
        excelData,
        pageContext
      });

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

  const hasData = excelData && excelData.length > 0;

  return (
    <div style={styles.container}>
      <h2>Delivery Lead Validation</h2>
      <p>AI simuleert een delivery lead die beoordeelt of het Excel bestand goedgekeurd zou worden.</p>
      
      <ValidationControls
        onPerformValidation={performValidation}
        onAnalyzeContext={analyzeContextOnly}
        loading={loading}
        hasData={hasData}
      />

      {error && (
        <div style={styles.errorBox}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      <ContextAnalysisDisplay contextAnalysis={contextAnalysis} />
      <ValidationResultsDisplay validationResult={validationResult} />
    </div>
  );
};

export default DeliveryLeadValidation;

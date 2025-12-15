import React from 'react';

const ValidationControls = ({ 
  onPerformValidation, 
  onAnalyzeContext, 
  loading, 
  hasData 
}) => {
  return (
    <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
      <button 
        onClick={onPerformValidation}
        disabled={loading || !hasData}
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
        onClick={onAnalyzeContext}
        disabled={loading || !hasData}
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
  );
};

export default ValidationControls;

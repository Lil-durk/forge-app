/**
 * API Test Component
 * Handles API key configuration testing and displays test results
 */

import React from 'react';

const ApiTest = ({ onTestApi, testingApi, apiTestResult }) => {
  return (
    <div className="api-test-section">
      <button 
        className="api-test-btn"
        onClick={onTestApi}
        disabled={testingApi}
        style={{
          padding: '10px 20px',
          backgroundColor: testingApi ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: testingApi ? 'not-allowed' : 'pointer',
          marginTop: '10px'
        }}
      >
        {testingApi ? '🔄 Testing API Key...' : '🔑 Test LiteLLM API Key'}
      </button>

      {apiTestResult && (
        <div 
          className={`api-test-result ${apiTestResult.success ? 'success' : 'error'}`} 
          style={{
            padding: '15px',
            margin: '10px 0',
            borderRadius: '5px',
            backgroundColor: apiTestResult.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${apiTestResult.success ? '#c3e6cb' : '#f5c6cb'}`,
            color: apiTestResult.success ? '#155724' : '#721c24'
          }}
        >
          <h4>{apiTestResult.success ? '✅ API Key Test Successful' : '❌ API Key Test Failed'}</h4>
          <p><strong>Message:</strong> {apiTestResult.message || apiTestResult.error}</p>
          {apiTestResult.apiKeyLength && (
            <p><strong>API Key Length:</strong> {apiTestResult.apiKeyLength} characters</p>
          )}
          {apiTestResult.baseURL && (
            <p><strong>Base URL:</strong> {apiTestResult.baseURL}</p>
          )}
          {apiTestResult.testResponse && (
            <p><strong>Test Response:</strong> {apiTestResult.testResponse}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiTest;

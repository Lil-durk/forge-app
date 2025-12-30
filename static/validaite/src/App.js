/**
 * Main ValidAIte Application Component
 * Clean and optimized version with only active functionality
 */

import React from 'react';
import './App.css';

// Import custom hooks
import { useAppState } from './hooks/useAppState';
import { usePageContext } from './hooks/usePageContext';
import { useConditionalDisplay } from './hooks/useConditionalDisplay';

// Import utility functions
import { processUploadedFile, handleFileUpload } from './utils/fileProcessing';

// Import components
import FileUpload from './components/FileUpload';
import ValidationResults from './components/ValidationResults';
import DataPreview from './components/DataPreview';
import PageContextDisplay from './components/PageContextDisplay';
import DeliveryLeadValidation from './components/DeliveryLeadValidation';
import ClearCacheButton from './components/ClearCacheButton';

function App() {
  const state = useAppState();
  const { requestType } = usePageContext();
  const { displayMode, displayReason, isEvaluating, forceDisplay } = useConditionalDisplay();

  // Handle file upload with validation
  const handleFileUploadEvent = (event) => {
    handleFileUpload(event, processFile, state.setError);
  };

  // Process uploaded file using utility function
  const processFile = (file) => {
    processUploadedFile(file, {
      setFileName: state.setFileName,
      setError: state.setError,
      setValidationResult: state.setValidationResult,
      setIsUsingCachedResult: state.setIsUsingCachedResult,
      setCurrentFileHash: state.setCurrentFileHash,
      setLoading: state.setLoading,
      setExcelData: state.setExcelData,
      setShowRequirementsWizard: state.setShowRequirementsWizard
    });
  };

  // Show loading state while evaluating display conditions
  if (isEvaluating) {
    return (
      <div className="app">
        <div className="container">
          <div className="header">
            <h1>ValidAIte - Excel Data Validator</h1>
            <p>Loading...</p>
          </div>
          <div className="loading-message">
            <p>🔍 Checking if ValidAIte should be displayed on this request form...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show minimal view - simple hello message in white text
  if (displayMode === 'minimal') {
    console.log('🔄 ValidAIte - Showing minimal view:', displayReason);
    
    return (
      <div className="app">
        <div className="container" style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: 'white',
          backgroundColor: 'transparent'
        }}>
          <p style={{ 
            fontSize: '16px', 
            margin: '0',
            fontWeight: 'normal'
          }}>
            Hello
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div style={{ 
              marginTop: '10px', 
              fontSize: '12px', 
              color: '#ccc',
              opacity: '0.7'
            }}>
              <p>Debug: {displayReason}</p>
              <button 
                onClick={() => forceDisplay('full')} 
                style={{ 
                  marginTop: '5px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  backgroundColor: '#333',
                  color: 'white',
                  border: '1px solid #555',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Force Full Display (Dev Only)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show full app interface
  console.log('✅ ValidAIte - Showing full app:', displayReason);

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>ValidAIte - Excel Data Validator</h1>
          <p>Upload your Excel file for AI-powered data validation</p>
          {process.env.NODE_ENV === 'development' && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Display mode: {displayMode} | Reason: {displayReason}
              <button 
                onClick={() => forceDisplay('minimal')} 
                style={{ 
                  marginLeft: '10px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Test Minimal View
              </button>
            </div>
          )}
        </div>

        {/* Page Context Display - Shows which request page we're currently on */}
        <PageContextDisplay />

        <FileUpload
          onFileUpload={handleFileUploadEvent}
          loading={state.loading}
          fileName={state.fileName}
          error={state.error}
        />

        <DataPreview excelData={state.excelData} />

        <ValidationResults 
          validationResult={state.validationResult} 
          isUsingCachedResult={state.isUsingCachedResult}
          excelData={state.excelData}
          fileName={state.fileName}
        />

        {/* Clear Cache Button - Always visible for developers */}
        <ClearCacheButton 
          onCacheCleared={(result) => {
            console.log('Cache cleared:', result);
            // Reset any cached state if needed
            state.setIsUsingCachedResult(false);
          }}
        />

        {/* Delivery Lead Validation - Shows when Excel data is available */}
        {state.excelData && state.excelData.length > 0 && (
          <DeliveryLeadValidation
            excelData={state.excelData}
            pageContext={{ requestType }}
          />
        )}

      </div>
    </div>
  );
}

export default App;

/**
 * Main ValidAIte Application Component
 * Refactored to use custom hooks and utility functions for better maintainability
 */

import React from 'react';
import './App.css';

// Import custom hooks
import { useAppState } from './hooks/useAppState';
import { useJiraIntegration } from './hooks/useJiraIntegration';
import { usePageContext } from './hooks/usePageContext';
import { useConditionalDisplay } from './hooks/useConditionalDisplay';

// Import utility functions
import { processUploadedFile, handleFileUpload } from './utils/fileProcessing';
import { validateData, validateWithCustomRequirements, testApiKeyConfiguration } from './utils/validation';

// Import components
import FileUpload from './components/FileUpload';
import ApiTest from './components/ApiTest';
import ValidationResults from './components/ValidationResults';
import DataPreview from './components/DataPreview';
import JiraIntegration from './components/JiraIntegration';
import RequirementsWizard from './components/RequirementsWizard';
import PageContextDisplay from './components/PageContextDisplay';
import DeliveryLeadValidation from './components/DeliveryLeadValidation';

function App() {
  const state = useAppState();
  
  const { requestType } = usePageContext();
  
  const { shouldDisplay, displayReason, isEvaluating } = useConditionalDisplay();
  
  const { processJiraAttachment } = useJiraIntegration({
    currentIssueKey: state.currentIssueKey,
    setCurrentIssueKey: state.setCurrentIssueKey,
    setIssueAttachments: state.setIssueAttachments,
    recentUploads: state.recentUploads,
    setRecentUploads: state.setRecentUploads,
    isMonitoring: state.isMonitoring,
    setFileName: state.setFileName,
    setError: state.setError,
    setValidationResult: state.setValidationResult
  });

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

  // Handle Requirements Wizard completion
  const handleRequirementsGenerated = async (wizardResult) => {
    state.setShowRequirementsWizard(false);
    
    await validateWithCustomRequirements(
      state.excelData,
      wizardResult,
      state.fileName,
      {
        setError: state.setError,
        setLoading: state.setLoading,
        setValidationResult: state.setValidationResult,
        setCustomRequirements: state.setCustomRequirements,
        currentFileHash: state.currentFileHash
      }
    );
  };

  // Handle Requirements Wizard skip
  const handleRequirementsSkipped = () => {
    state.setShowRequirementsWizard(false);
    state.setLoading(true);
    
    // Use standard validation
    validateData(state.excelData, state.fileName, {
      setError: state.setError,
      setLoading: state.setLoading,
      setValidationResult: state.setValidationResult,
      currentFileHash: state.currentFileHash
    });
  };

  // Test API key configuration
  const handleTestApiKey = async () => {
    await testApiKeyConfiguration({
      setTestingApi: state.setTestingApi,
      setApiTestResult: state.setApiTestResult
    });
  };

  // Handle Jira attachment processing
  const handleProcessJiraAttachment = (attachment) => {
    processJiraAttachment(
      attachment,
      state.setLoading,
      state.setFileName,
      state.setError
    );
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

  // If the app should not be displayed, return null or a minimal message
  if (!shouldDisplay) {
    console.log('🚫 ValidAIte - App hidden:', displayReason);
    
    // Return null to completely hide the app (recommended approach)
    return null;
    
    // Alternative: Return a minimal message for debugging (uncomment if needed)
    /*
    return (
      <div className="app">
        <div className="container" style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
          <p>ValidAIte is not available on this request form.</p>
          {process.env.NODE_ENV === 'development' && (
            <div style={{ marginTop: '10px', fontSize: '12px' }}>
              <p>Debug: {displayReason}</p>
              <button onClick={() => forceDisplay(true)} style={{ marginTop: '5px' }}>
                Force Display (Dev Only)
              </button>
            </div>
          )}
        </div>
      </div>
    );
    */
  }

  // App should be displayed - render the full interface
  console.log('✅ ValidAIte - App displayed:', displayReason);

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>ValidAIte - Excel Data Validator</h1>
          <p>Upload your Excel file for AI-powered data validation</p>
          {process.env.NODE_ENV === 'development' && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Display reason: {displayReason}
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
        />

        {/* Delivery Lead Validation - Shows when Excel data is available */}
        {state.excelData && state.excelData.length > 0 && (
          <DeliveryLeadValidation
            excelData={state.excelData}
            pageContext={{ requestType }}
          />
        )}

        {/* Requirements Wizard */}
        <RequirementsWizard
          excelData={state.excelData}
          fileName={state.fileName}
          isVisible={state.showRequirementsWizard}
          onRequirementsGenerated={handleRequirementsGenerated}
          onSkip={handleRequirementsSkipped}
        />

        {/* API Test Component - Hidden but available for debugging */}
        {process.env.NODE_ENV === 'development' && (
          <ApiTest
            onTestApi={handleTestApiKey}
            testingApi={state.testingApi}
            apiTestResult={state.apiTestResult}
          />
        )}
      </div>
    </div>
  );
}

export default App;

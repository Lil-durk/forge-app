/**
 * Main ValidAIte Application Component
 * Refactored to use custom hooks and utility functions for better maintainability
 */

import React from 'react';
import './App.css';

// Import custom hooks
import { useAppState } from './hooks/useAppState';
import { useJiraIntegration } from './hooks/useJiraIntegration';

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

function App() {
  // Initialize application state using custom hook
  const state = useAppState();
  
  // Initialize Jira integration using custom hook
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

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>ValidAIte - Excel Data Validator</h1>
          <p>Upload your Excel file for AI-powered data validation</p>
        </div>

        <JiraIntegration
          currentIssueKey={state.currentIssueKey}
          issueAttachments={state.issueAttachments}
          recentUploads={state.recentUploads}
          isMonitoring={state.isMonitoring}
          onToggleMonitoring={() => state.setIsMonitoring(!state.isMonitoring)}
          onProcessAttachment={handleProcessJiraAttachment}
          loading={state.loading}
        />

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

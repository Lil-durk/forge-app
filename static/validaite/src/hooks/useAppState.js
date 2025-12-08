/**
 * Custom hook for managing main application state
 * Centralizes state management for the ValidAIte application
 */

import { useState } from 'react';

export const useAppState = () => {
  // File and data state
  const [excelData, setExcelData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [currentFileHash, setCurrentFileHash] = useState(null);
  
  // Validation state
  const [validationResult, setValidationResult] = useState(null);
  const [isUsingCachedResult, setIsUsingCachedResult] = useState(false);
  const [customRequirements, setCustomRequirements] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRequirementsWizard, setShowRequirementsWizard] = useState(false);
  
  // Jira integration state
  const [currentIssueKey, setCurrentIssueKey] = useState(null);
  const [issueAttachments, setIssueAttachments] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  
  // API testing state
  const [apiTestResult, setApiTestResult] = useState(null);
  const [testingApi, setTestingApi] = useState(false);

  // Reset validation state when new file is processed
  const resetValidationState = () => {
    setValidationResult(null);
    setIsUsingCachedResult(false);
    setCurrentFileHash(null);
    setCustomRequirements(null);
    setError('');
  };

  return {
    // File and data state
    excelData,
    setExcelData,
    fileName,
    setFileName,
    currentFileHash,
    setCurrentFileHash,
    
    // Validation state
    validationResult,
    setValidationResult,
    isUsingCachedResult,
    setIsUsingCachedResult,
    customRequirements,
    setCustomRequirements,
    
    // UI state
    loading,
    setLoading,
    error,
    setError,
    showRequirementsWizard,
    setShowRequirementsWizard,
    
    // Jira integration state
    currentIssueKey,
    setCurrentIssueKey,
    issueAttachments,
    setIssueAttachments,
    recentUploads,
    setRecentUploads,
    isMonitoring,
    setIsMonitoring,
    
    // API testing state
    apiTestResult,
    setApiTestResult,
    testingApi,
    setTestingApi,
    
    // Utility functions
    resetValidationState
  };
};

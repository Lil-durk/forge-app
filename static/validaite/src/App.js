/**
 * Main ValidAIte Application Component
 * Coordinates all components and manages application state
 */

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { invoke, view } from '@forge/bridge';
import './App.css';

// Import components
import FileUpload from './components/FileUpload';
import ValidationResults from './components/ValidationResults';
import DataPreview from './components/DataPreview';
import JiraIntegration from './components/JiraIntegration';
import FileAttachmentManager from './components/FileAttachmentManager';
import RealFileAttachmentTest from './components/RealFileAttachmentTest';
// import PostCreationAttachment from './components/PostCreationAttachment';

function App() {
  // State management
  const [excelData, setExcelData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [recentUploads, setRecentUploads] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [issueAttachments, setIssueAttachments] = useState([]);
  const [currentIssueKey, setCurrentIssueKey] = useState(null);

  // Get current issue context on component mount
  useEffect(() => {
    const getCurrentIssue = async () => {
      try {
        console.log('Getting current issue context...');
        const context = await view.getContext();
        console.log('Context received:', context);
        
        if (context && context.extension && context.extension.issue) {
          const issueKey = context.extension.issue.key;
          console.log('Current issue key:', issueKey);
          setCurrentIssueKey(issueKey);
          
          // Fetch attachments for this issue
          await fetchIssueAttachments(issueKey);
          
          // Auto-attach any pending files to this existing issue
          await autoAttachPendingFiles(issueKey);
        } else {
          console.log('No issue context found - likely in request creation mode');
        }
      } catch (error) {
        console.error('Error getting issue context:', error.message);
      }
    };
    
    getCurrentIssue();
  }, []);

  // Auto-attach pending files to an issue
  const autoAttachPendingFiles = async (issueKey) => {
    try {
      console.log('Checking for pending files to attach to:', issueKey);
      const result = await invoke('attachAllPendingFiles', { issueKey });
      
      if (result.success && result.attachedCount > 0) {
        console.log(`Successfully attached ${result.attachedCount} files to ${issueKey}`);
        // Refresh attachments list
        await fetchIssueAttachments(issueKey);
      }
    } catch (error) {
      console.error('Error auto-attaching files:', error);
    }
  };

  // Monitor for external file uploads and issue attachments
  useEffect(() => {
    console.log('=== MONITORING EFFECT ===');
    console.log('Is monitoring:', isMonitoring);
    
    if (!isMonitoring) {
      console.log('Monitoring disabled, returning early');
      return;
    }

    const checkForUploads = async () => {
      try {
        // Check for recent uploads
        console.log('Checking for recent uploads...');
        const result = await invoke('getRecentUploads');
        
        if (result.success && result.uploads) {
          setRecentUploads(result.uploads);
          
          const pendingUploads = result.uploads.filter(
            upload => upload.validationStatus === 'pending'
          );
          
          if (pendingUploads.length > 0) {
            const latestUpload = pendingUploads[0];
            console.log('Latest pending upload:', latestUpload.fileName);
            setFileName(latestUpload.fileName);
            setError('');
            setValidationResult(null);
          }
        }
        
        // Also refresh issue attachments if we have an issue key
        if (currentIssueKey) {
          await fetchIssueAttachments(currentIssueKey);
        }
        
      } catch (error) {
        console.error('Upload check error:', error.message);
      }
    };

    // Check immediately and then every 10 seconds
    console.log('Starting upload monitoring...');
    checkForUploads();
    const interval = setInterval(checkForUploads, 10000);

    return () => {
      console.log('Cleaning up upload monitoring interval');
      clearInterval(interval);
    };
  }, [isMonitoring, currentIssueKey]);

  // Process uploaded file
  const processUploadedFile = (file) => {
    console.log('=== PROCESSING UPLOADED FILE ===');
    console.log('File name:', file ? file.name : 'No file');
    
    if (!file) {
      console.log('No file provided, returning early');
      return;
    }
    
    setFileName(file.name);
    setError('');
    setValidationResult(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        console.log('File read successfully, parsing Excel...');
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('Excel parsed successfully:', jsonData.length, 'rows');
        setExcelData(jsonData);
        
        // Automatically trigger validation
        validateData(jsonData, file.name);
      } catch (error) {
        console.error('Excel processing error:', error.message);
        setError('Error reading Excel file: ' + error.message);
        setLoading(false);
      }
    };
    
    reader.onerror = (error) => {
      console.error('File reader error:', error);
      setError('Error reading file');
      setLoading(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.match(/\.(xlsx|xls)$/i)) {
        processUploadedFile(file);
      } else {
        setError('Please select an Excel file (.xlsx or .xls)');
      }
    }
  };

  // Validate data using AI
  const validateData = async (data, fileName) => {
    console.log('=== STARTING DATA VALIDATION ===');
    
    if (!data || data.length === 0) {
      setError('No data to validate');
      setLoading(false);
      return;
    }

    try {
      const result = await invoke('validateExcelData', {
        excelData: data,
        validationRules: 'Standard data validation - check for missing values, data type consistency, and format issues'
      });
      
      if (result.success) {
        setValidationResult(result);
      } else {
        setError(result.error || 'Validation failed');
      }
    } catch (error) {
      console.error('Validation error:', error.message);
      setError('Error during validation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  // Fetch attachments for the current issue
  const fetchIssueAttachments = async (issueKey) => {
    try {
      const result = await invoke('getIssueAttachments', { issueKey });
      
      if (result.success) {
        setIssueAttachments(result.attachments || []);
      } else {
        console.error('Failed to fetch attachments:', result.error);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error.message);
    }
  };

  // Process an attachment from Jira
  const processJiraAttachment = async (attachment) => {
    try {
      setLoading(true);
      setError('');
      setFileName(attachment.filename);
      
      const result = await invoke('processExcelAttachment', {
        attachmentId: attachment.id,
        filename: attachment.filename
      });
      
      if (result.success) {
        setError('Excel file detected from Jira attachment. Please upload the file manually for now.');
      } else {
        setError('Failed to process attachment: ' + result.error);
      }
    } catch (error) {
      setError('Error processing attachment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>ValidAIte - Excel Data Validator</h1>
          <p>Upload your Excel file for AI-powered data validation</p>
        </div>

        <FileAttachmentManager
          onValidationComplete={(validationResult, fileName) => {
            setValidationResult(validationResult);
            setFileName(fileName);
            setError('');
          }}
        />

        <RealFileAttachmentTest />

        <JiraIntegration
          currentIssueKey={currentIssueKey}
          issueAttachments={issueAttachments}
          recentUploads={recentUploads}
          isMonitoring={isMonitoring}
          onToggleMonitoring={() => setIsMonitoring(!isMonitoring)}
          onProcessAttachment={processJiraAttachment}
          loading={loading}
        />

        <DataPreview excelData={excelData} />

        <ValidationResults validationResult={validationResult} />
      </div>
    </div>
  );
}

export default App;

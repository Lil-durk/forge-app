import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { invoke, view } from '@forge/bridge';
import './App.css';


function App() {
  const [excelData, setExcelData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [recentUploads, setRecentUploads] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [issueAttachments, setIssueAttachments] = useState([]);
  const [currentIssueKey, setCurrentIssueKey] = useState(null);
  const [apiTestResult, setApiTestResult] = useState(null);
  const [testingApi, setTestingApi] = useState(false);


  // Function to process uploaded file
  const processUploadedFile = (file) => {
    console.log('=== PROCESSING UPLOADED FILE ===');
    console.log('File name:', file ? file.name : 'No file');
    console.log('File size:', file ? file.size : 'N/A');
    console.log('File type:', file ? file.type : 'N/A');
    
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
        console.log('Sheet name:', sheetName);
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log('Excel parsed successfully:');
        console.log('- Rows:', jsonData.length);
        console.log('- Columns:', Object.keys(jsonData[0] || {}).length);
        console.log('- Headers:', Object.keys(jsonData[0] || {}));
        
        setExcelData(jsonData);
        
        // Automatically trigger validation
        console.log('Starting automatic validation...');
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
    
    console.log('Starting file read...');
    reader.readAsArrayBuffer(file);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Check if it's an Excel file
      if (file.name.match(/\.(xlsx|xls)$/i)) {
        processUploadedFile(file);
      } else {
        setError('Please select an Excel file (.xlsx or .xls)');
      }
    }
  };


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
        } else {
          console.log('No issue context found');
        }
      } catch (error) {
        console.error('Error getting issue context:', error.message);
      }
    };
    
    getCurrentIssue();
  }, []);

  // Fetch attachments for the current issue
  const fetchIssueAttachments = async (issueKey) => {
    try {
      console.log('Fetching attachments for issue:', issueKey);
      const result = await invoke('getIssueAttachments', { issueKey });
      
      console.log('Attachments result:', result);
      
      if (result.success) {
        setIssueAttachments(result.attachments || []);
        console.log('Found Excel attachments:', result.excelAttachments);
        
        // If there are new Excel attachments, show them
        if (result.attachments && result.attachments.length > 0) {
          const latestAttachment = result.attachments[0];
          console.log('Latest Excel attachment:', latestAttachment.filename);
        }
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
      
      console.log('Processing Jira attachment:', attachment.filename);
      
      // Download and process the attachment
      const result = await invoke('processExcelAttachment', {
        attachmentId: attachment.id,
        filename: attachment.filename
      });
      
      if (result.success) {
        console.log('Attachment processed successfully');
        // For now, we'll show that the file was detected
        // In a full implementation, you would get the parsed Excel data from the backend
        setError('Excel file detected from Jira attachment. Please upload the file manually for now.');
      } else {
        setError('Failed to process attachment: ' + result.error);
      }
    } catch (error) {
      console.error('Error processing attachment:', error.message);
      setError('Error processing attachment: ' + error.message);
    } finally {
      setLoading(false);
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
        // Check for recent uploads (existing functionality)
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

    // Check immediately and then every 10 seconds (less frequent for attachments)
    console.log('Starting upload monitoring...');
    checkForUploads();
    const interval = setInterval(checkForUploads, 10000);

    return () => {
      console.log('Cleaning up upload monitoring interval');
      clearInterval(interval);
    };
  }, [isMonitoring, currentIssueKey]);

  // Test API key configuration
  const testApiKeyConfiguration = async () => {
    console.log('=== TESTING API KEY CONFIGURATION ===');
    setTestingApi(true);
    setApiTestResult(null);
    
    try {
      const result = await invoke('testApiKeyConfiguration');
      console.log('API test result:', result);
      setApiTestResult(result);
    } catch (error) {
      console.error('API test error:', error.message);
      setApiTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setTestingApi(false);
    }
  };

  const validateData = async (data, fileName) => {
    console.log('=== STARTING DATA VALIDATION ===');
    console.log('Data rows:', data ? data.length : 0);
    console.log('File name:', fileName);
    console.log('Timestamp:', new Date().toISOString());
    
    if (!data || data.length === 0) {
      console.log('No data to validate - returning early');
      setError('No data to validate');
      setLoading(false);
      return;
    }

    try {
      console.log('Calling backend validateExcelData...');
      const result = await invoke('validateExcelData', {
        excelData: data,
        validationRules: 'Standard data validation - check for missing values, data type consistency, and format issues'
      });
      
      console.log('=== BACKEND RESPONSE ===');
      console.log('Success:', result.success);
      console.log('Full result:', result);
      
      if (result.success) {
        console.log('Validation successful, setting results');
        setValidationResult(result);
      } else {
        console.log('Validation failed:', result.error);
        if (result.errorDetails) {
          console.log('Error details:', result.errorDetails);
        }
        setError(result.error || 'Validation failed');
      }
    } catch (error) {
      console.error('Validation error:', error.message);
      setError('Error during validation: ' + error.message);
    } finally {
      console.log('=== VALIDATION COMPLETE ===');
      setLoading(false);
    }
  };

  const getIssueIcon = (type) => {
    switch (type) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>ValidAIte - Excel Data Validator</h1>
          <p>Upload your Excel file for AI-powered data validation</p>
          
          <div className="monitoring-status">
            <div className={`status-indicator ${isMonitoring ? 'active' : 'inactive'}`}>
              <span className="status-dot"></span>
              {isMonitoring ? 'Monitoring for external uploads' : 'Monitoring disabled'}
            </div>
            <button 
              className="toggle-monitoring"
              onClick={() => setIsMonitoring(!isMonitoring)}
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>
          </div>
        </div>

        <div className="upload-section">
          <div className="file-upload-area">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              id="file-input"
              className="file-input"
            />
            <label htmlFor="file-input" className="file-upload-label">
              <div className="upload-icon">📁</div>
              <div className="upload-text">
                <strong>Drop your Excel file here or click to browse</strong>
                <p>Supports .xlsx and .xls files</p>
              </div>
            </label>
          </div>

          <div className="api-test-section">
            <button 
              className="api-test-btn"
              onClick={testApiKeyConfiguration}
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
          </div>

          {apiTestResult && (
            <div className={`api-test-result ${apiTestResult.success ? 'success' : 'error'}`} style={{
              padding: '15px',
              margin: '10px 0',
              borderRadius: '5px',
              backgroundColor: apiTestResult.success ? '#d4edda' : '#f8d7da',
              border: `1px solid ${apiTestResult.success ? '#c3e6cb' : '#f5c6cb'}`,
              color: apiTestResult.success ? '#155724' : '#721c24'
            }}>
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

          {fileName && (
            <div className="detected-file">
              <span>📄 Selected file: <strong>{fileName}</strong></span>
            </div>
          )}

          {loading && (
            <div className="validation-progress">
              <div className="spinner"></div>
              <span>🤖 AI is validating your Excel data...</span>
            </div>
          )}
        </div>

        {currentIssueKey && (
          <div className="issue-info">
            <h3>Current Issue: {currentIssueKey}</h3>
            {issueAttachments.length > 0 && (
              <div className="issue-attachments">
                <h4>Excel Attachments Found</h4>
                <div className="attachments-list">
                  {issueAttachments.map((attachment, index) => (
                    <div key={index} className="attachment-item">
                      <div className="attachment-info">
                        <span className="attachment-filename">📊 {attachment.filename}</span>
                        <span className="attachment-details">
                          {Math.round(attachment.size / 1024)} KB • {attachment.author} • {new Date(attachment.created).toLocaleString()}
                        </span>
                      </div>
                      <button 
                        className="process-attachment-btn"
                        onClick={() => processJiraAttachment(attachment)}
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : 'Validate'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {issueAttachments.length === 0 && isMonitoring && (
              <p className="no-attachments">No Excel attachments found. Upload an Excel file to this issue to validate it.</p>
            )}
          </div>
        )}

        {recentUploads.length > 0 && (
          <div className="recent-uploads">
            <h3>Recent External Uploads</h3>
            <div className="uploads-list">
              {recentUploads.slice(0, 5).map((upload, index) => (
                <div key={index} className={`upload-item ${upload.validationStatus}`}>
                  <div className="upload-info">
                    <span className="upload-filename">📄 {upload.fileName}</span>
                    <span className="upload-time">
                      {new Date(upload.uploadTime).toLocaleString()}
                    </span>
                  </div>
                  <div className={`upload-status ${upload.validationStatus}`}>
                    {upload.validationStatus === 'pending' && '⏳ Pending'}
                    {upload.validationStatus === 'completed' && '✅ Validated'}
                    {upload.validationStatus === 'error' && '❌ Error'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {excelData && (
          <div className="data-preview">
            <h3>Data Preview</h3>
            <div className="data-stats">
              <span>Rows: {excelData.length}</span>
              <span>Columns: {Object.keys(excelData[0] || {}).length}</span>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {Object.keys(excelData[0] || {}).map((header, index) => (
                      <th key={index}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {excelData.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((cell, cellIndex) => (
                        <td key={cellIndex}>{String(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {excelData.length > 5 && (
                <p className="table-note">Showing first 5 rows of {excelData.length} total rows</p>
              )}
            </div>
          </div>
        )}

        {validationResult && (
          <div className="validation-results">
            <h3>Validation Results</h3>
            
            <div className="validation-summary">
              <div className="score-section">
                <div 
                  className="score-circle"
                  style={{ borderColor: getScoreColor(validationResult.validation.overallScore) }}
                >
                  <span style={{ color: getScoreColor(validationResult.validation.overallScore) }}>
                    {validationResult.validation.overallScore}
                  </span>
                </div>
                <div className="score-label">Overall Score</div>
              </div>
              
              <div className="validation-status">
                <div className={`status-badge ${validationResult.validation.isValid ? 'valid' : 'invalid'}`}>
                  {validationResult.validation.isValid ? '✅ Valid' : '❌ Issues Found'}
                </div>
                <p>{validationResult.validation.summary}</p>
              </div>
            </div>

            {validationResult.validation.issues && validationResult.validation.issues.length > 0 && (
              <div className="issues-section">
                <h4>Issues Found</h4>
                <div className="issues-list">
                  {validationResult.validation.issues.map((issue, index) => (
                    <div key={index} className={`issue-item ${issue.type}`}>
                      <div className="issue-header">
                        <span className="issue-icon">{getIssueIcon(issue.type)}</span>
                        <span className="issue-field">{issue.field}</span>
                        <span className="issue-row">Row {issue.row}</span>
                      </div>
                      <div className="issue-message">{issue.message}</div>
                      <div className="issue-suggestion">💡 {issue.suggestion}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {validationResult.validation.recommendations && validationResult.validation.recommendations.length > 0 && (
              <div className="recommendations-section">
                <h4>Recommendations</h4>
                <ul className="recommendations-list">
                  {validationResult.validation.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

/**
 * File Attachment Manager Component
 * Handles file upload, validation, and attachment to issues during request creation
 */

import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
import * as XLSX from 'xlsx';

const FileAttachmentManager = ({ onValidationComplete }) => {
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Load pending files on component mount
  useEffect(() => {
    loadPendingFiles();
  }, []);

  const loadPendingFiles = async () => {
    try {
      const result = await invoke('getPendingFiles');
      if (result.success) {
        setPendingFiles(result.files || []);
      }
    } catch (error) {
      console.error('Error loading pending files:', error);
    }
  };

  // Handle file upload and validation
  const handleFileUpload = async (file) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Read file content
      const fileContent = await readFileAsBase64(file);
      
      // Parse Excel data for validation
      const excelData = await parseExcelFile(file);
      
      // Validate the data
      const validationResult = await invoke('validateExcelData', {
        excelData,
        validationRules: 'Standard data validation - check for missing values, data type consistency, and format issues'
      });

      // Store the file with validation results
      const storeResult = await invoke('storeUploadedFile', {
        fileData: {
          fileName: file.name,
          fileContent: fileContent,
          mimeType: file.type,
          size: file.size
        },
        validationResult
      });

      if (storeResult.success) {
        // Reload pending files
        await loadPendingFiles();
        
        // Notify parent component
        if (onValidationComplete) {
          onValidationComplete(validationResult, file.name);
        }
      } else {
        setError('Failed to store file: ' + storeResult.error);
      }

    } catch (error) {
      setError('Error processing file: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Read file as base64
  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:... prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Parse Excel file to JSON
  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Handle file input change
  const handleFileInputChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Remove a pending file
  const removePendingFile = async (fileId) => {
    try {
      const result = await invoke('removePendingFile', { fileId });
      if (result.success) {
        await loadPendingFiles();
      } else {
        setError('Failed to remove file: ' + result.error);
      }
    } catch (error) {
      setError('Error removing file: ' + error.message);
    }
  };

  // Get validation status display
  const getValidationStatusDisplay = (file) => {
    if (!file.validationResult) return { text: 'Unknown', className: 'unknown' };
    
    if (file.validationResult.success) {
      const issues = file.validationResult.issues || [];
      if (issues.length === 0) {
        return { text: '✅ Valid', className: 'valid' };
      } else {
        return { text: `⚠️ ${issues.length} Issues`, className: 'warning' };
      }
    } else {
      return { text: '❌ Invalid', className: 'invalid' };
    }
  };

  // Handle creating issue with files - using the improved method
  const handleCreateIssueWithFiles = async () => {
    if (pendingFiles.length === 0) {
      setError('No files to attach');
      return;
    }

    setLoading(true);
    setError('');

    try {
      setError('Creating issue with file information...');
      
      // Use the improved method that includes file info in description
      const createResult = await invoke('createIssueWithFileInfo', {
        summary: `ValidAIte Test Issue - ${new Date().toLocaleString()}`,
        description: `Test issue created by ValidAIte with ${pendingFiles.length} validated Excel file(s).`,
        fileIds: pendingFiles.map(f => f.fileId)
      });

      if (createResult.success) {
        setError(`✅ Successfully created issue ${createResult.issueKey} with file information included!`);
        await loadPendingFiles(); // Refresh the list
        
        // Optionally redirect to the created issue
        if (createResult.issueUrl) {
          setTimeout(() => {
            setError(`✅ Issue created! Opening ${createResult.issueKey}...`);
            window.open(createResult.issueUrl, '_blank');
          }, 2000);
        }
      } else {
        setError('Failed to create issue with files: ' + (createResult.error || 'Unknown error'));
      }
    } catch (error) {
      setError('Error creating issue with files: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="file-attachment-manager">
      <div className="upload-section">
        <h3>📎 Upload Files for Validation</h3>
        <p>Upload Excel files to validate them before attaching to your request</p>
        
        <div 
          className={`upload-area ${dragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            <div className="upload-icon">📄</div>
            <p>Drag and drop Excel files here, or</p>
            <label className="upload-button">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInputChange}
                disabled={loading}
                style={{ display: 'none' }}
              />
              Choose Files
            </label>
          </div>
        </div>

        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>Processing file...</span>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
      </div>

      {pendingFiles.length > 0 && (
        <div className="pending-files-section">
          <h3>📋 Files Ready for Attachment</h3>
          <p>These validated files will be automatically attached when you create your request</p>
          
          <div className="pending-files-list">
            {pendingFiles.map((file) => {
              const statusDisplay = getValidationStatusDisplay(file);
              return (
                <div key={file.fileId} className="pending-file-item">
                  <div className="file-info">
                    <div className="file-name">📄 {file.fileName}</div>
                    <div className="file-details">
                      {Math.round(file.size / 1024)} KB • Uploaded {new Date(file.uploadedAt).toLocaleString()}
                    </div>
                    <div className={`validation-status ${statusDisplay.className}`}>
                      {statusDisplay.text}
                    </div>
                  </div>
                  <div className="file-actions">
                    <button 
                      className="remove-file-btn"
                      onClick={() => removePendingFile(file.fileId)}
                      title="Remove file"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="attachment-info">
            <div className="info-box">
              <strong>ℹ️ How it works:</strong>
              <ol>
                <li>Files are validated using AI to check for data quality issues</li>
                <li>Validated files are stored temporarily in your session</li>
                <li>When you submit your request, files will be automatically attached</li>
                <li>You can remove files before submission if needed</li>
              </ol>
              
              <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <button 
                  className="upload-button"
                  onClick={handleCreateIssueWithFiles}
                  disabled={loading || pendingFiles.length === 0}
                  style={{ fontSize: '0.9rem', padding: '8px 16px' }}
                >
                  🎯 Create Test Issue & Attach Files
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileAttachmentManager;

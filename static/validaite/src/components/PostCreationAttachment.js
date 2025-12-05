/**
 * Post-Creation Attachment Component
 * Handles file upload, validation, and post-creation attachment workflow
 */

import React, { useState, useEffect } from 'react';
import { invoke, requestJira } from '@forge/bridge';
import * as XLSX from 'xlsx';

const PostCreationAttachment = ({ onValidationComplete }) => {
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [createdIssue, setCreatedIssue] = useState(null);

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
    setSuccess('');

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
        
        setSuccess(`✅ File "${file.name}" uploaded and validated successfully!`);
        
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
        setSuccess('File removed successfully');
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

  // Step 1: Create issue first (using Forge Bridge directly)
  const handleCreateIssueFirst = async () => {
    if (pendingFiles.length === 0) {
      setError('No files to attach. Please upload files first.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      setSuccess('Step 1: Creating issue first...');
      
      // Store files for post-attachment
      const storeResult = await invoke('storeFilesForPostAttachment', {
        fileIds: pendingFiles.map(f => f.fileId),
        issueContext: {
          summary: `ValidAIte File Validation - ${new Date().toLocaleString()}`,
          description: `Issue created for ${pendingFiles.length} validated Excel file(s).`,
          projectKey: 'VAL'
        }
      });

      if (!storeResult.success) {
        setError('Failed to store files for attachment: ' + storeResult.error);
        return;
      }

      // Create issue using Forge Bridge (frontend API call)
      const issuePayload = {
        fields: {
          project: {
            key: 'VAL'
          },
          summary: `ValidAIte File Validation - ${new Date().toLocaleString()}`,
          description: `Issue created for ${pendingFiles.length} validated Excel file(s).\n\n*Files will be attached automatically after issue creation.*`,
          issuetype: {
            name: 'Task'
          }
        }
      };

      setSuccess('Step 2: Creating issue via Jira API...');
      
      const createResponse = await requestJira('/rest/api/3/issue', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(issuePayload)
      });

      if (createResponse.status === 201) {
        const issueData = await createResponse.json();
        const issueKey = issueData.key;
        
        setCreatedIssue({
          key: issueKey,
          url: `https://io-test.atlassian.net/browse/${issueKey}`
        });
        
        setSuccess(`Step 3: Issue ${issueKey} created! Processing file attachments...`);
        
        // Step 2: Process post-creation attachments
        const attachResult = await invoke('processPostCreationAttachments', {
          issueKey: issueKey
        });

        if (attachResult.success) {
          setSuccess(`✅ Success! Issue ${issueKey} created with ${attachResult.processedCount} file(s) attached as detailed comments!`);
          
          // Step 3: Add comments using frontend API calls
          await addFileCommentsToIssue(issueKey);
          
          // Clear pending files
          await loadPendingFiles();
          
          // Open the created issue after a delay
          setTimeout(() => {
            window.open(`https://io-test.atlassian.net/browse/${issueKey}`, '_blank');
          }, 2000);
          
        } else {
          setError('Issue created but failed to attach files: ' + attachResult.error);
        }
        
      } else {
        const errorText = await createResponse.text();
        setError('Failed to create issue: ' + createResponse.status + ' ' + errorText);
      }

    } catch (error) {
      setError('Error in post-creation workflow: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add file comments to the issue using frontend API calls
  const addFileCommentsToIssue = async (issueKey) => {
    try {
      // Get comment data prepared by backend
      const commentDataResult = await invoke('getIssueCommentData', {
        issueKey: issueKey
      });

      if (commentDataResult.success && commentDataResult.comments) {
        for (const commentData of commentDataResult.comments) {
          try {
            const commentPayload = {
              body: commentData.commentBody
            };

            await requestJira(`/rest/api/3/issue/${issueKey}/comment`, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(commentPayload)
            });

            console.log(`Added comment for file: ${commentData.fileName}`);
          } catch (error) {
            console.error(`Failed to add comment for ${commentData.fileName}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error adding file comments:', error);
    }
  };

  return (
    <div className="post-creation-attachment">
      <div className="upload-section">
        <h3>🚀 NEW: Post-Creation File Attachment</h3>
        <p>Upload Excel files for validation, then create an issue with file attachments using the new workflow</p>
        
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
            <span>Processing...</span>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            {success}
          </div>
        )}
      </div>

      {pendingFiles.length > 0 && (
        <div className="pending-files-section">
          <h3>📋 Files Ready for Attachment</h3>
          <p>These validated files will be attached to the issue after creation</p>
          
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
              <strong>🚀 Post-Creation Attachment Workflow:</strong>
              <ol>
                <li>Files are validated and stored temporarily</li>
                <li>Issue is created first in Jira Service Management</li>
                <li>Files are then attached as detailed comments with validation results</li>
                <li>You can view the complete issue with all file information</li>
              </ol>
              
              <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <button 
                  className="create-issue-button"
                  onClick={handleCreateIssueFirst}
                  disabled={loading || pendingFiles.length === 0}
                  style={{ 
                    fontSize: '1rem', 
                    padding: '12px 24px',
                    backgroundColor: '#0052CC',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? '⏳ Processing...' : '🎯 Create Issue & Attach Files'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {createdIssue && (
        <div className="created-issue-info">
          <div className="success-box">
            <h3>✅ Issue Created Successfully!</h3>
            <p><strong>Issue Key:</strong> {createdIssue.key}</p>
            <p><strong>URL:</strong> <a href={createdIssue.url} target="_blank" rel="noopener noreferrer">{createdIssue.url}</a></p>
            <p>Files have been attached as detailed comments with validation results.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCreationAttachment;
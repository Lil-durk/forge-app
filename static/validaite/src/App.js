import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { invoke } from '@forge/bridge';
import './App.css';

function App() {
  const [excelData, setExcelData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [isMonitoring] = useState(true);
  const [context, setContext] = useState(null);

  // Mock API call for validation (in a real Forge app, this would call the backend resolver)
  const mockAPI = {
    validateExcelData: async (excelData, fileName) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock validation result
      return {
        success: true,
        validation: {
          isValid: Math.random() > 0.3,
          overallScore: Math.floor(Math.random() * 40) + 60,
          issues: [
            {
              type: "warning",
              field: "email",
              row: 3,
              message: "Email format appears invalid",
              suggestion: "Check email format for row 3"
            },
            {
              type: "error",
              field: "phone",
              row: 5,
              message: "Missing required phone number",
              suggestion: "Add phone number for row 5"
            }
          ],
          summary: "Data validation completed with some issues found",
          recommendations: [
            "Review email formats",
            "Fill in missing required fields",
            "Check for duplicate entries"
          ]
        },
        dataStats: {
          totalRows: excelData.length,
          totalColumns: Object.keys(excelData[0] || {}).length,
          headers: Object.keys(excelData[0] || {})
        }
      };
    }
  };

  // Function to process uploaded file
  const processUploadedFile = (file) => {
    if (!file) return;
    
    setFileName(file.name);
    setError('');
    setValidationResult(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setExcelData(jsonData);
        
        // Automatically trigger validation
        validateData(jsonData, file.name);
      } catch (error) {
        setError('Error reading Excel file: ' + error.message);
        setLoading(false);
      }
    };
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

  // Get context from Forge
  useEffect(() => {
    const getContext = async () => {
      try {
        const ctx = await invoke('getContext');
        setContext(ctx);
      } catch (error) {
        console.log('Could not get context:', error);
      }
    };
    
    getContext();
  }, []);

  const validateData = async (data, fileName) => {
    if (!data || data.length === 0) {
      setError('No data to validate');
      setLoading(false);
      return;
    }

    try {
      const result = await mockAPI.validateExcelData(data, fileName);
      
      if (result.success) {
        setValidationResult(result);
      } else {
        setError(result.error || 'Validation failed');
      }
    } catch (error) {
      setError('Error during validation: ' + error.message);
    } finally {
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

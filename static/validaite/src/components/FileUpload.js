/**
 * File Upload Component
 * Handles Excel file upload functionality and file input management
 */

import React from 'react';

const FileUpload = ({ onFileUpload, loading, fileName, error }) => {
  return (
    <div className="upload-section">
      <div className="file-upload-area">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={onFileUpload}
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

      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;

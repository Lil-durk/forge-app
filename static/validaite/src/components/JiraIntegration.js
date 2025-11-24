/**
 * Jira Integration Component
 * Handles Jira issue attachments and external upload monitoring
 */

import React from 'react';

const JiraIntegration = ({ 
  currentIssueKey, 
  issueAttachments, 
  recentUploads, 
  isMonitoring, 
  onToggleMonitoring, 
  onProcessAttachment, 
  loading 
}) => {
  return (
    <div className="jira-integration">
      <div className="monitoring-status">
        <div className={`status-indicator ${isMonitoring ? 'active' : 'inactive'}`}>
          <span className="status-dot"></span>
          {isMonitoring ? 'Monitoring for external uploads' : 'Monitoring disabled'}
        </div>
        <button 
          className="toggle-monitoring"
          onClick={onToggleMonitoring}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
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
                      <span className="attachment-filename">{attachment.filename}</span>
                      <span className="attachment-details">
                        {Math.round(attachment.size / 1024)} KB • {attachment.author} • {new Date(attachment.created).toLocaleString()}
                      </span>
                    </div>
                    <button 
                      className="process-attachment-btn"
                      onClick={() => onProcessAttachment(attachment)}
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
    </div>
  );
};

export default JiraIntegration;

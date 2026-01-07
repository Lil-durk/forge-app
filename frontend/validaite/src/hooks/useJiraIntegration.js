/**
 * Custom hook for Jira integration functionality
 * Handles issue context, attachments, and upload monitoring
 */

import { useEffect, useCallback } from 'react';
import { invoke, view } from '@forge/bridge';

export const useJiraIntegration = ({
  currentIssueKey,
  setCurrentIssueKey,
  setIssueAttachments,
  recentUploads,
  setRecentUploads,
  isMonitoring,
  setFileName,
  setError,
  setValidationResult
}) => {
  
  // Fetch attachments for the current issue
  const fetchIssueAttachments = useCallback(async (issueKey) => {
    try {
      const result = await invoke('getIssueAttachments', { issueKey });
      
      if (result.success) {
        setIssueAttachments(result.attachments || []);
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch attachments:', result.error);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching attachments:', error.message);
      }
    }
  }, [setIssueAttachments]);

  // Initialize Jira context and get current issue
  useEffect(() => {
    const getCurrentIssue = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('Getting current issue context...');
        }
        const context = await view.getContext();
        
        if (context && context.extension && context.extension.issue) {
          const issueKey = context.extension.issue.key;
          if (process.env.NODE_ENV === 'development') {
            console.log('Current issue key:', issueKey);
          }
          setCurrentIssueKey(issueKey);
          await fetchIssueAttachments(issueKey);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('No issue context found');
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error getting issue context:', error.message);
        }
      }
    };
    
    getCurrentIssue();
  }, [setCurrentIssueKey, setIssueAttachments, fetchIssueAttachments]);

  // Monitor for uploads and attachments
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Upload monitoring effect triggered. Is monitoring:', isMonitoring);
    }
    
    if (!isMonitoring) {
      return;
    }

    const checkForUploads = async () => {
      try {
        const result = await invoke('getRecentUploads');
        
        if (result.success && result.uploads) {
          setRecentUploads(result.uploads);
          
          const pendingUploads = result.uploads.filter(
            upload => upload.validationStatus === 'pending'
          );
          
          if (pendingUploads.length > 0) {
            const latestUpload = pendingUploads[0];
            if (process.env.NODE_ENV === 'development') {
              console.log('Processing pending upload:', latestUpload.fileName);
            }
            setFileName(latestUpload.fileName);
            setError('');
            setValidationResult(null);
          }
        }
        
        if (currentIssueKey) {
          await fetchIssueAttachments(currentIssueKey);
        }
        
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Upload check error:', error.message);
        }
      }
    };

    // Start monitoring with 10 second intervals
    checkForUploads();
    const interval = setInterval(checkForUploads, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [isMonitoring, currentIssueKey, setRecentUploads, setFileName, setError, setValidationResult, fetchIssueAttachments]);

  // Process an attachment from Jira
  const processJiraAttachment = async (attachment, setLoading, setFileName, setError) => {
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

  return {
    fetchIssueAttachments,
    processJiraAttachment
  };
};

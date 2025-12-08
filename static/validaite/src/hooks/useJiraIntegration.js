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
        console.error('Failed to fetch attachments:', result.error);
      }
    } catch (error) {
      console.error('Error fetching attachments:', error.message);
    }
  }, [setIssueAttachments]);

  // Initialize Jira context and get current issue
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
          
          await fetchIssueAttachments(issueKey);
        } else {
          console.log('No issue context found');
        }
      } catch (error) {
        console.error('Error getting issue context:', error.message);
      }
    };
    
    getCurrentIssue();
  }, [setCurrentIssueKey, setIssueAttachments, fetchIssueAttachments]);

  // Monitor for uploads and attachments
  useEffect(() => {
    console.log('=== MONITORING EFFECT ===');
    console.log('Is monitoring:', isMonitoring);
    
    if (!isMonitoring) {
      console.log('Monitoring disabled, returning early');
      return;
    }

    const checkForUploads = async () => {
      try {
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
        
        if (currentIssueKey) {
          await fetchIssueAttachments(currentIssueKey);
        }
        
      } catch (error) {
        console.error('Upload check error:', error.message);
      }
    };

    console.log('Starting upload monitoring...');
    checkForUploads();
    const interval = setInterval(checkForUploads, 10000);

    return () => {
      console.log('Cleaning up upload monitoring interval');
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

/**
 * Custom hook to detect and log the current JSM portal request page context
 * This hook uses Forge Bridge API to access context information about the current page
 */

import { useState, useEffect } from 'react';
import { view } from '@forge/bridge';

export const usePageContext = () => {
  const [pageContext, setPageContext] = useState(null);
  const [requestType, setRequestType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    /**
     * Fetch the current page context from Forge Bridge
     * This will give us information about the current JSM portal page
     */
    const fetchPageContext = async () => {
      try {
        setLoading(true);
        
        // Get the current context from Forge Bridge
        const context = await view.getContext();
        
        console.log('🔍 ValidAIte - Page Context:', context);
        
        // Extract relevant information about the current page
        const pageInfo = {
          moduleKey: context.moduleKey,
          extension: context.extension,
          siteUrl: context.siteUrl,
          cloudId: context.cloudId,
          accountId: context.accountId
        };

        setPageContext(pageInfo);

        // Simple request type detection
        let currentRequestType = 'JSM Portal Request Form';
        
        if (pageInfo.extension?.requestType?.name) {
          currentRequestType = pageInfo.extension.requestType.name;
        } else if (pageInfo.moduleKey) {
          currentRequestType = pageInfo.moduleKey;
        }

        setRequestType(currentRequestType);

        // Log a summary message
        console.log(`🎯 ValidAIte is running on: ${currentRequestType}`);

      } catch (err) {
        console.error('❌ ValidAIte - Error fetching page context:', err);
        setError(err.message);
        setRequestType('JSM Portal');
      } finally {
        setLoading(false);
      }
    };

    fetchPageContext();
  }, []);

  // Return the hook's state and utilities
  return {
    pageContext,
    requestType,
    loading,
    error,
    // Utility function to get a human-readable page description
    getPageDescription: () => {
      if (loading) return 'Loading page context...';
      if (error) return 'Unable to determine page context';
      return requestType || 'Unknown Request Page';
    }
  };
};

export default usePageContext;

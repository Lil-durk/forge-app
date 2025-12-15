/**
 * Custom hook for conditional display logic
 * Controls whether the ValidAIte app should be visible on the current JSM request form
 */

import { useState, useEffect } from 'react';
import { usePageContext } from './usePageContext';

/**
 * Configuration for which request forms should show the ValidAIte app
 * You can modify these criteria to match your specific requirements
 */
const DISPLAY_CRITERIA = {
  allowedRequestTypeNames: [
    'Request a new account',
    'Report a system problem',
    'Request new software',
  ],
  
  allowedRequestTypeIds: [
    '9',
    '11'
  ],
  showOnAllForms: false, // Set to true to bypass all restrictions
};

export const useConditionalDisplay = () => {
  const { pageContext, requestType, loading, error } = usePageContext();
  const [displayMode, setDisplayMode] = useState('minimal'); // 'full' or 'minimal'
  const [displayReason, setDisplayReason] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(true);

  useEffect(() => {
    const evaluateDisplayConditions = async () => {
      try {
        setIsEvaluating(true);
        
        // Wait for page context to load
        if (loading) {
          return;
        }
        
        // If there's an error getting context, default to minimal display
        if (error) {
          setDisplayMode('minimal');
          setDisplayReason('Error loading page context');
          return;
        }
        
        // If configured to show on all forms (useful for testing)
        if (DISPLAY_CRITERIA.showOnAllForms) {
          setDisplayMode('full');
          setDisplayReason('Configured to show on all forms');
          return;
        }
        
        // Extract request type ID from URL as fallback
        let urlRequestTypeId = null;
        try {
          const currentUrl = window.location.href;
          const urlMatch = currentUrl.match(/\/create\/(\d+)/);
          if (urlMatch) {
            urlRequestTypeId = urlMatch[1];
          }
        } catch (e) {
          console.log('Could not extract request type ID from URL:', e);
        }

        console.log('🔍 ValidAIte - Evaluating display conditions for:', {
          requestType,
          pageContext,
          urlRequestTypeId,
          contextRequestTypeId: pageContext?.extension?.requestType?.id,
          allowedIds: DISPLAY_CRITERIA.allowedRequestTypeIds
        });
        
        // Check against allowed request type names
        if (DISPLAY_CRITERIA.allowedRequestTypeNames && DISPLAY_CRITERIA.allowedRequestTypeNames.length > 0) {
          const isAllowedByName = DISPLAY_CRITERIA.allowedRequestTypeNames.some(
            allowedName => requestType && requestType.toLowerCase().includes(allowedName.toLowerCase())
          );
          
          if (isAllowedByName) {
            setDisplayMode('full');
            setDisplayReason(`Request type "${requestType}" is in allowed list`);
            return;
          }
        }
        
        // Check against allowed request type IDs (try both context and URL)
        if (DISPLAY_CRITERIA.allowedRequestTypeIds && DISPLAY_CRITERIA.allowedRequestTypeIds.length > 0) {
          // The actual path is extension.request.typeId (as number)
          const contextTypeId = pageContext?.extension?.request?.typeId;
          const contextIdString = contextTypeId ? String(contextTypeId) : null;
          const urlId = urlRequestTypeId;
          
          // Check context ID first (convert number to string for comparison)
          if (contextIdString && DISPLAY_CRITERIA.allowedRequestTypeIds.includes(contextIdString)) {
            setDisplayMode('full');
            setDisplayReason(`Request type ID "${contextIdString}" (from context.extension.request.typeId) is in allowed list`);
            return;
          }
          
          // Check URL ID as fallback
          if (urlId && DISPLAY_CRITERIA.allowedRequestTypeIds.includes(urlId)) {
            setDisplayMode('full');
            setDisplayReason(`Request type ID "${urlId}" (from URL) is in allowed list`);
            return;
          }
          
          console.log('🚫 ValidAIte - No matching request type ID found:', {
            contextTypeId,
            contextIdString,
            urlId,
            allowedIds: DISPLAY_CRITERIA.allowedRequestTypeIds
          });
        }
        
        // Check against allowed project keys
        if (DISPLAY_CRITERIA.allowedProjectKeys && DISPLAY_CRITERIA.allowedProjectKeys.length > 0 && pageContext?.extension?.project?.key) {
          const isAllowedByProject = DISPLAY_CRITERIA.allowedProjectKeys.includes(
            pageContext.extension.project.key
          );
          
          if (isAllowedByProject) {
            setDisplayMode('full');
            setDisplayReason(`Project key "${pageContext.extension.project.key}" is in allowed list`);
            return;
          }
        }
        
        // Check for custom field value (this would require additional API call)
        if (DISPLAY_CRITERIA.requiredCustomFieldValue && DISPLAY_CRITERIA.requiredCustomFieldValue.fieldName) {
          // Note: This would require implementing a custom field check
          // For now, we'll log that this feature is available but not implemented
          console.log('🔧 ValidAIte - Custom field check not yet implemented');
        }
        
        // If no conditions matched, show minimal display
        setDisplayMode('minimal');
        setDisplayReason('Current request form does not match display criteria - showing minimal view');
        
        console.log('🔄 ValidAIte - App will show minimal view:', {
          requestType,
          reason: 'No matching display criteria'
        });
        
      } catch (evaluationError) {
        console.error('❌ ValidAIte - Error evaluating display conditions:', evaluationError);
        setDisplayMode('minimal');
        setDisplayReason('Error evaluating display conditions');
      } finally {
        setIsEvaluating(false);
      }
    };
    
    evaluateDisplayConditions();
  }, [pageContext, requestType, loading, error]);

  return {
    displayMode,
    shouldDisplay: displayMode === 'full', // Backward compatibility
    displayReason,
    isEvaluating,
    pageContext,
    requestType,
    
    // Utility functions for debugging
    getDisplayCriteria: () => DISPLAY_CRITERIA,
    
    // Function to temporarily override display (useful for testing)
    forceDisplay: (mode = 'full') => {
      setDisplayMode(mode);
      setDisplayReason(`Forced display mode: ${mode}`);
    }
  };
};

export default useConditionalDisplay;

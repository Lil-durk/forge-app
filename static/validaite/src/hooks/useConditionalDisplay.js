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
  showOnAllForms: true, // Set to true to bypass all restrictions
};

export const useConditionalDisplay = () => {
  const { pageContext, requestType, loading, error } = usePageContext();
  const [shouldDisplay, setShouldDisplay] = useState(false);
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
        
        // If there's an error getting context, default to not showing
        if (error) {
          setShouldDisplay(false);
          setDisplayReason('Error loading page context');
          return;
        }
        
        // If configured to show on all forms (useful for testing)
        if (DISPLAY_CRITERIA.showOnAllForms) {
          setShouldDisplay(true);
          setDisplayReason('Configured to show on all forms');
          return;
        }
        
        console.log('🔍 ValidAIte - Evaluating display conditions for:', {
          requestType,
          pageContext
        });
        
        // Check against allowed request type names
        if (DISPLAY_CRITERIA.allowedRequestTypeNames && DISPLAY_CRITERIA.allowedRequestTypeNames.length > 0) {
          const isAllowedByName = DISPLAY_CRITERIA.allowedRequestTypeNames.some(
            allowedName => requestType && requestType.toLowerCase().includes(allowedName.toLowerCase())
          );
          
          if (isAllowedByName) {
            setShouldDisplay(true);
            setDisplayReason(`Request type "${requestType}" is in allowed list`);
            return;
          }
        }
        
        // Check against allowed request type IDs
        if (DISPLAY_CRITERIA.allowedRequestTypeIds && DISPLAY_CRITERIA.allowedRequestTypeIds.length > 0 && pageContext?.extension?.requestType?.id) {
          const isAllowedById = DISPLAY_CRITERIA.allowedRequestTypeIds.includes(
            pageContext.extension.requestType.id
          );
          
          if (isAllowedById) {
            setShouldDisplay(true);
            setDisplayReason(`Request type ID "${pageContext.extension.requestType.id}" is in allowed list`);
            return;
          }
        }
        
        // Check against allowed project keys
        if (DISPLAY_CRITERIA.allowedProjectKeys && DISPLAY_CRITERIA.allowedProjectKeys.length > 0 && pageContext?.extension?.project?.key) {
          const isAllowedByProject = DISPLAY_CRITERIA.allowedProjectKeys.includes(
            pageContext.extension.project.key
          );
          
          if (isAllowedByProject) {
            setShouldDisplay(true);
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
        
        // If no conditions matched, don't display
        setShouldDisplay(false);
        setDisplayReason('Current request form does not match display criteria');
        
        console.log('🚫 ValidAIte - App will not be displayed:', {
          requestType,
          reason: 'No matching display criteria'
        });
        
      } catch (evaluationError) {
        console.error('❌ ValidAIte - Error evaluating display conditions:', evaluationError);
        setShouldDisplay(false);
        setDisplayReason('Error evaluating display conditions');
      } finally {
        setIsEvaluating(false);
      }
    };
    
    evaluateDisplayConditions();
  }, [pageContext, requestType, loading, error]);

  return {
    shouldDisplay,
    displayReason,
    isEvaluating,
    pageContext,
    requestType,
    
    // Utility functions for debugging
    getDisplayCriteria: () => DISPLAY_CRITERIA,
    
    // Function to temporarily override display (useful for testing)
    forceDisplay: (force = true) => {
      setShouldDisplay(force);
      setDisplayReason(force ? 'Forced display for testing' : 'Force display disabled');
    }
  };
};

export default useConditionalDisplay;

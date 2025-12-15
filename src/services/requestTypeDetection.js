/**
 * Request Type Detection Service
 * Detects and analyzes Jira Service Management request types from page context
 */

import api, { route } from '@forge/api';

/**
 * Detects the request type from the current page context
 * @param {Object} context - Page context object containing URL and other metadata
 * @returns {Object} Request type information including ID, name, and service desk details
 */
export const detectRequestType = async (context) => {
  try {
    // Extract request type ID from URL if available
    const url = context.extension?.url || context.siteUrl || '';
    const requestTypeIdMatch = url.match(/requestType\/(\d+)/);
    const extractedRequestTypeId = requestTypeIdMatch ? requestTypeIdMatch[1] : null;
    
    // Extract service desk ID from URL if available
    const serviceDeskIdMatch = url.match(/servicedesk\/(\d+)/);
    const serviceDeskId = serviceDeskIdMatch ? serviceDeskIdMatch[1] : null;
    
    let requestTypeId = extractedRequestTypeId;
    let requestTypeData = null;
    
    // Try to get request type information via API if we have an ID
    if (requestTypeId && serviceDeskId) {
      try {
        const requestTypeResponse = await api.asUser().requestJira(route`/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype/${requestTypeId}`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (requestTypeResponse.status === 200) {
          requestTypeData = await requestTypeResponse.json();
        }
      } catch (apiError) {
        // API call failed, continue with other methods
      }
    }
    
    // If we have service desk ID but no request type, try to get available request types
    if (serviceDeskId && !requestTypeData) {
      try {
        const requestTypesResponse = await api.asUser().requestJira(route`/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (requestTypesResponse.status === 200) {
          const requestTypesData = await requestTypesResponse.json();
          // Use the first available request type as fallback
          if (requestTypesData.values && requestTypesData.values.length > 0) {
            requestTypeData = requestTypesData.values[0];
            requestTypeId = requestTypeData.id;
          }
        }
      } catch (apiError) {
        // API call failed, continue
      }
    }
    
    // If we still don't have request type data, try URL-based extraction
    if (!requestTypeData) {
      try {
        const url = context.extension?.url || context.siteUrl;
        
        if (url && url.includes('servicedesk') && url.includes('requestType')) {
          const urlRequestTypeMatch = url.match(/requestType\/(\d+)/);
          const urlServiceDeskMatch = url.match(/servicedesk\/(\d+)/);
          
          if (urlRequestTypeMatch && urlServiceDeskMatch) {
            const urlRequestTypeId = urlRequestTypeMatch[1];
            const urlServiceDeskId = urlServiceDeskMatch[1];
            
            const requestTypeResponse = await api.asUser().requestJira(route`/rest/servicedeskapi/servicedesk/${urlServiceDeskId}/requesttype/${urlRequestTypeId}`, {
              headers: {
                'Accept': 'application/json'
              }
            });
            
            if (requestTypeResponse.status === 200) {
              requestTypeData = await requestTypeResponse.json();
              requestTypeId = urlRequestTypeId;
            }
          }
        }
      } catch (urlError) {
        // URL parsing failed, continue
      }
    }
    
    return {
      success: true,
      requestType: {
        id: requestTypeId,
        name: requestTypeData?.name || 'Unknown Request Type',
        description: requestTypeData?.description || '',
        serviceDeskId: serviceDeskId,
        fields: requestTypeData?.fields || [],
        issueTypeId: requestTypeData?.issueTypeId || null,
        groupIds: requestTypeData?.groupIds || [],
        icon: requestTypeData?.icon || null
      },
      context: {
        url: url,
        extractedFromUrl: !!extractedRequestTypeId,
        foundViaApi: !!requestTypeData,
        serviceDeskId: serviceDeskId
      }
    };
    
  } catch (error) {
    console.error('❌ ValidAIte - Error in detectRequestType:', error);
    return {
      success: false,
      error: error.message,
      requestType: null,
      context: {
        url: context.extension?.url || context.siteUrl || '',
        extractedFromUrl: false,
        foundViaApi: false,
        serviceDeskId: null
      }
    };
  }
};

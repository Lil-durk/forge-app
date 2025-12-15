/**
 * Request Type Detection Service
 * Uses Jira Service Management APIs to detect the current request type
 */

import api, { route } from '@forge/api';

/**
 * Get request type information from the current context
 * @param {Object} context - The Forge context object
 * @returns {Promise<Object>} Request type information
 */
export async function detectRequestType(context, extractedRequestTypeId = null) {
  try {
    console.log('🔍 ValidAIte - Detecting request type from context:', context);
    console.log('🔍 ValidAIte - Extracted request type ID from URL:', extractedRequestTypeId);
    
    // Extract potential request type ID from various sources
    let requestTypeId = extractedRequestTypeId; // Prioritize URL-extracted ID
    let serviceDeskId = null;
    
    // If no URL-extracted ID, try to get from extension context
    if (!requestTypeId && context.extension) {
      requestTypeId = context.extension.requestTypeId || 
                     context.extension.requestType?.id ||
                     context.extension.context?.requestTypeId;
      
      serviceDeskId = context.extension.serviceDeskId ||
                      context.extension.serviceDesk?.id ||
                      context.extension.context?.serviceDeskId;
    }
    
    console.log('🔍 ValidAIte - Final IDs to use:', { requestTypeId, serviceDeskId });
    
    // If we have a request type ID, fetch its details
    if (requestTypeId) {
      try {
        const requestTypeResponse = await api.asUser().requestJira(
          route`/rest/servicedeskapi/requesttype/${requestTypeId}`
        );
        
        if (requestTypeResponse.status === 200) {
          const requestTypeData = await requestTypeResponse.json();
          console.log('✅ ValidAIte - Found request type via API:', requestTypeData);
          
          return {
            success: true,
            requestType: {
              id: requestTypeData.id,
              name: requestTypeData.name,
              description: requestTypeData.description,
              serviceDeskId: requestTypeData.serviceDeskId
            }
          };
        }
      } catch (apiError) {
        console.log('⚠️ ValidAIte - API call failed:', apiError.message);
      }
    }
    
    // If we have a service desk ID but no request type ID, try to get request types for the service desk
    if (serviceDeskId && !requestTypeId) {
      try {
        const requestTypesResponse = await api.asUser().requestJira(
          route`/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype`
        );
        
        if (requestTypesResponse.status === 200) {
          const requestTypesData = await requestTypesResponse.json();
          console.log('📋 ValidAIte - Available request types:', requestTypesData);
          
          // For now, we can't determine which specific one without more context
          // But we can log what's available
          return {
            success: true,
            serviceDeskId: serviceDeskId,
            availableRequestTypes: requestTypesData.values || [],
            message: 'Found service desk but could not determine specific request type'
          };
        }
      } catch (apiError) {
        console.log('⚠️ ValidAIte - Service desk API call failed:', apiError.message);
      }
    }
    
    // Try to extract from current URL if available in context
    if (context.extension?.url || context.siteUrl) {
      const url = context.extension?.url || context.siteUrl;
      console.log('🌐 ValidAIte - Checking URL for request type info:', url);
      
      try {
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        
        const urlRequestTypeId = params.get('requestTypeId') || 
                                params.get('rtId') || 
                                params.get('requestType');
        
        if (urlRequestTypeId && urlRequestTypeId !== requestTypeId) {
          // Try the API call with the URL-extracted ID
          const requestTypeResponse = await api.asUser().requestJira(
            route`/rest/servicedeskapi/requesttype/${urlRequestTypeId}`
          );
          
          if (requestTypeResponse.status === 200) {
            const requestTypeData = await requestTypeResponse.json();
            console.log('✅ ValidAIte - Found request type via URL extraction:', requestTypeData);
            
            return {
              success: true,
              requestType: {
                id: requestTypeData.id,
                name: requestTypeData.name,
                description: requestTypeData.description,
                serviceDeskId: requestTypeData.serviceDeskId
              }
            };
          }
        }
      } catch (urlError) {
        console.log('⚠️ ValidAIte - URL parsing failed:', urlError.message);
      }
    }
    
    // If all else fails, return what we know
    return {
      success: false,
      message: 'Could not determine specific request type',
      context: {
        requestTypeId,
        serviceDeskId,
        moduleKey: context.moduleKey,
        availableData: Object.keys(context.extension || {})
      }
    };
    
  } catch (error) {
    console.error('❌ ValidAIte - Error in detectRequestType:', error);
    return {
      success: false,
      error: error.message,
      context: context
    };
  }
}

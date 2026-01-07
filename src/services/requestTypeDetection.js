/**
 * Request Type Detection Service
 * Detects and analyzes Jira Service Management request types from page context
 */

import api, { route } from '@forge/api';
import { createLogger } from '../utils/logger.js';
import { sanitizeString } from '../utils/inputValidation.js';

const log = createLogger('RequestTypeDetection');

/**
 * Detects the request type from the current page context
 * @param {Object} context - Page context object containing URL and other metadata
 * @returns {Object} Request type information including ID, name, and service desk details
 */
export const detectRequestType = async (context) => {
  log.info('detectRequestType', 'Starting request type detection', {
    hasContext: !!context,
    hasExtension: !!(context?.extension),
    hasSiteUrl: !!(context?.siteUrl)
  });

  try {
    // Input validation
    if (!context || typeof context !== 'object') {
      log.warn('detectRequestType', 'Invalid context provided', { context: typeof context });
      return {
        success: false,
        error: 'Invalid context provided',
        requestType: null,
        context: { extractedFromUrl: false, foundViaApi: false }
      };
    }

    // Extract and sanitize URL
    const rawUrl = context.extension?.url || context.siteUrl || '';
    const url = sanitizeString(rawUrl, 2000); // Limit URL length
    
    log.debug('detectRequestType', 'Processing URL for request type detection', {
      urlLength: url.length,
      hasServiceDesk: url.includes('servicedesk'),
      hasRequestType: url.includes('requestType')
    });

    const requestTypeIdMatch = url.match(/requestType\/(\d+)/);
    const extractedRequestTypeId = requestTypeIdMatch ? requestTypeIdMatch[1] : null;
    
    // Extract service desk ID from URL if available
    const serviceDeskIdMatch = url.match(/servicedesk\/(\d+)/);
    const serviceDeskId = serviceDeskIdMatch ? serviceDeskIdMatch[1] : null;
    
    let requestTypeId = extractedRequestTypeId;
    let requestTypeData = null;

    log.debug('detectRequestType', 'URL parsing results', {
      extractedRequestTypeId,
      serviceDeskId,
      foundBothIds: !!(extractedRequestTypeId && serviceDeskId)
    });
    
    // Try to get request type information via API if we have an ID
    if (requestTypeId && serviceDeskId) {
      try {
        log.debug('detectRequestType', 'Fetching request type data from API', {
          requestTypeId,
          serviceDeskId
        });

        const requestTypeResponse = await api.asUser().requestJira(route`/rest/servicedeskapi/servicedesk/${serviceDeskId}/requesttype/${requestTypeId}`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (requestTypeResponse.status === 200) {
          requestTypeData = await requestTypeResponse.json();
          log.info('detectRequestType', 'Successfully fetched request type data', {
            requestTypeId,
            requestTypeName: requestTypeData?.name
          });
        } else {
          log.warn('detectRequestType', 'Failed to fetch request type data', {
            status: requestTypeResponse.status,
            requestTypeId,
            serviceDeskId
          });
        }
      } catch (apiError) {
        log.warn('detectRequestType', 'API call failed for request type', apiError, {
          requestTypeId,
          serviceDeskId
        });
        // API call failed, continue with other methods
      }
    }
    
    // If we have service desk ID but no request type, try to get available request types
    if (serviceDeskId && !requestTypeData) {
      try {
        log.debug('detectRequestType', 'Fetching available request types as fallback', { serviceDeskId });

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
            log.info('detectRequestType', 'Using first available request type as fallback', {
              requestTypeId,
              requestTypeName: requestTypeData?.name,
              totalAvailable: requestTypesData.values.length
            });
          }
        }
      } catch (apiError) {
        log.warn('detectRequestType', 'Failed to fetch available request types', apiError, { serviceDeskId });
        // API call failed, continue
      }
    }
    
    // If we still don't have request type data, try URL-based extraction
    if (!requestTypeData) {
      try {
        log.debug('detectRequestType', 'Attempting secondary URL-based extraction');
        
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
              log.info('detectRequestType', 'Successfully extracted request type via secondary URL parsing', {
                requestTypeId,
                requestTypeName: requestTypeData?.name
              });
            }
          }
        }
      } catch (urlError) {
        log.warn('detectRequestType', 'Secondary URL parsing failed', urlError);
        // URL parsing failed, continue
      }
    }

    const result = {
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

    log.info('detectRequestType', 'Request type detection completed', {
      success: true,
      hasRequestTypeId: !!requestTypeId,
      hasRequestTypeData: !!requestTypeData,
      extractedFromUrl: !!extractedRequestTypeId,
      foundViaApi: !!requestTypeData,
      requestTypeName: requestTypeData?.name || 'Unknown'
    });

    return result;
    
  } catch (error) {
    log.error('detectRequestType', 'Request type detection failed', error, {
      hasContext: !!context,
      contextKeys: context ? Object.keys(context) : []
    });
    return {
      success: false,
      error: error.message,
      requestType: null,
      context: {
        url: context?.extension?.url || context?.siteUrl || '',
        extractedFromUrl: false,
        foundViaApi: false,
        serviceDeskId: null
      }
    };
  }
};

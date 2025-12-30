/**
 * Confluence Template Service
 * Manages retrieval and caching of briefing templates from Confluence pages
 */

import api, { route } from '@forge/api';
import { storage } from '@forge/api';

/**
 * Configuration for template management
 */
const TEMPLATE_CONFIG = {
  // Default space key where templates are stored
  DEFAULT_SPACE_KEY: 'TEMPLATES',
  // Cache TTL in milliseconds (24 hours)
  CACHE_TTL: 24 * 60 * 60 * 1000,
  // Template page title pattern
  TEMPLATE_TITLE_PATTERN: 'Briefing Template - Request Type {requestTypeId}',
  // Fallback template if specific one not found
  FALLBACK_TEMPLATE_TITLE: 'Default Briefing Template'
};

/**
 * Retrieves a briefing template from Confluence based on request type ID
 * @param {string} requestTypeId - The Jira request type ID
 * @param {string} spaceKey - Optional space key (defaults to TEMPLATES)
 * @returns {Object} Template data including structure and metadata
 */
export const getTemplateByRequestType = async (requestTypeId, spaceKey = TEMPLATE_CONFIG.DEFAULT_SPACE_KEY) => {
  try {
    console.log(`🔍 ValidAIte - Fetching template for request type: ${requestTypeId}`);
    
    // Check cache first
    const cacheKey = `template_${requestTypeId}_${spaceKey}`;
    const cachedTemplate = await getCachedTemplate(cacheKey);
    
    if (cachedTemplate) {
      console.log('✅ ValidAIte - Template found in cache');
      return {
        success: true,
        template: cachedTemplate.template,
        metadata: cachedTemplate.metadata,
        fromCache: true
      };
    }

    // Search for specific template page
    const templateTitle = TEMPLATE_CONFIG.TEMPLATE_TITLE_PATTERN.replace('{requestTypeId}', requestTypeId);
    let templateData = await searchTemplateInSpace(templateTitle, spaceKey);
    
    // If specific template not found, try fallback
    if (!templateData) {
      console.log(`⚠️ ValidAIte - Specific template not found, trying fallback: ${TEMPLATE_CONFIG.FALLBACK_TEMPLATE_TITLE}`);
      templateData = await searchTemplateInSpace(TEMPLATE_CONFIG.FALLBACK_TEMPLATE_TITLE, spaceKey);
    }
    
    if (!templateData) {
      throw new Error(`No template found for request type ${requestTypeId} in space ${spaceKey}`);
    }

    // Parse template content
    const parsedTemplate = await parseTemplateContent(templateData);
    
    // Cache the result
    await cacheTemplate(cacheKey, parsedTemplate, {
      requestTypeId,
      spaceKey,
      pageId: templateData.id,
      lastUpdated: templateData.version?.when || new Date().toISOString(),
      retrievedAt: new Date().toISOString()
    });

    console.log('✅ ValidAIte - Template retrieved and cached successfully');
    
    return {
      success: true,
      template: parsedTemplate,
      metadata: {
        requestTypeId,
        spaceKey,
        pageId: templateData.id,
        title: templateData.title,
        lastUpdated: templateData.version?.when || new Date().toISOString(),
        retrievedAt: new Date().toISOString()
      },
      fromCache: false
    };

  } catch (error) {
    console.error('❌ ValidAIte - Error retrieving template:', error.message);
    return {
      success: false,
      error: error.message,
      template: null,
      metadata: null
    };
  }
};

/**
 * Searches for a template page in a Confluence space
 * @param {string} title - Page title to search for
 * @param {string} spaceKey - Confluence space key
 * @returns {Object|null} Page data or null if not found
 */
const searchTemplateInSpace = async (title, spaceKey) => {
  try {
    // Search for pages by title in the specified space
    const searchResponse = await api.asUser().requestConfluence(route`/wiki/rest/api/content`, {
      headers: {
        'Accept': 'application/json'
      },
      query: {
        spaceKey: spaceKey,
        title: title,
        type: 'page',
        status: 'current',
        expand: 'body.storage,version,space'
      }
    });

    if (searchResponse.status === 200) {
      const searchData = await searchResponse.json();
      
      if (searchData.results && searchData.results.length > 0) {
        return searchData.results[0]; // Return first matching page
      }
    }
    
    return null;
  } catch (error) {
    console.error(`❌ ValidAIte - Error searching for template "${title}":`, error.message);
    return null;
  }
};

/**
 * Parses template content from Confluence page
 * @param {Object} pageData - Confluence page data
 * @returns {Object} Parsed template structure
 */
const parseTemplateContent = async (pageData) => {
  try {
    const content = pageData.body?.storage?.value || '';
    
    // Extract Excel template structure from Confluence content
    // This could be in various formats: table, macro, attachment, etc.
    
    // Look for table structure first
    const tableMatch = content.match(/<table[^>]*>(.*?)<\/table>/s);
    if (tableMatch) {
      return parseTableTemplate(tableMatch[1]);
    }
    
    // Look for structured data in macro format
    const macroMatch = content.match(/<ac:structured-macro[^>]*ac:name="excel-template"[^>]*>(.*?)<\/ac:structured-macro>/s);
    if (macroMatch) {
      return parseMacroTemplate(macroMatch[1]);
    }
    
    // Look for attachment references
    const attachmentMatch = content.match(/<ri:attachment ri:filename="([^"]*\.xlsx?)"[^>]*\/>/);
    if (attachmentMatch) {
      return await parseAttachmentTemplate(pageData.id, attachmentMatch[1]);
    }
    
    // Fallback: parse as plain text structure
    return parseTextTemplate(content);
    
  } catch (error) {
    console.error('❌ ValidAIte - Error parsing template content:', error.message);
    throw new Error(`Failed to parse template: ${error.message}`);
  }
};

/**
 * Parses HTML table into template structure
 * @param {string} tableHtml - HTML table content
 * @returns {Object} Template structure
 */
const parseTableTemplate = (tableHtml) => {
  // Extract headers and structure from HTML table
  const headerMatch = tableHtml.match(/<th[^>]*>(.*?)<\/th>/g);
  const headers = headerMatch ? headerMatch.map(th => th.replace(/<[^>]*>/g, '').trim()) : [];
  
  return {
    type: 'table',
    structure: {
      headers: headers,
      requiredFields: headers.filter(h => h.includes('*') || h.toLowerCase().includes('required')),
      optionalFields: headers.filter(h => !h.includes('*') && !h.toLowerCase().includes('required'))
    },
    metadata: {
      totalColumns: headers.length,
      hasHeaders: headers.length > 0
    }
  };
};

/**
 * Parses Confluence macro into template structure
 * @param {string} macroContent - Macro content
 * @returns {Object} Template structure
 */
const parseMacroTemplate = (macroContent) => {
  // Parse structured macro parameters
  const paramMatches = macroContent.match(/<ac:parameter ac:name="([^"]*)"[^>]*>(.*?)<\/ac:parameter>/g);
  const structure = {};
  
  if (paramMatches) {
    paramMatches.forEach(param => {
      const nameMatch = param.match(/ac:name="([^"]*)"/);
      const valueMatch = param.match(/>(.*?)<\/ac:parameter>/s);
      
      if (nameMatch && valueMatch) {
        structure[nameMatch[1]] = valueMatch[1].trim();
      }
    });
  }
  
  return {
    type: 'macro',
    structure: structure,
    metadata: {
      macroType: 'excel-template'
    }
  };
};

/**
 * Parses Excel attachment as template
 * @param {string} pageId - Confluence page ID
 * @param {string} filename - Attachment filename
 * @returns {Object} Template structure
 */
const parseAttachmentTemplate = async (pageId, filename) => {
  try {
    // Get attachment content
    const attachmentResponse = await api.asUser().requestConfluence(route`/wiki/rest/api/content/${pageId}/child/attachment`, {
      headers: {
        'Accept': 'application/json'
      },
      query: {
        filename: filename,
        expand: 'version'
      }
    });
    
    if (attachmentResponse.status === 200) {
      const attachmentData = await attachmentResponse.json();
      
      if (attachmentData.results && attachmentData.results.length > 0) {
        const attachment = attachmentData.results[0];
        
        return {
          type: 'attachment',
          structure: {
            filename: filename,
            attachmentId: attachment.id,
            downloadUrl: attachment._links?.download
          },
          metadata: {
            fileSize: attachment.extensions?.fileSize,
            mediaType: attachment.extensions?.mediaType,
            lastModified: attachment.version?.when
          }
        };
      }
    }
    
    throw new Error(`Attachment ${filename} not found`);
    
  } catch (error) {
    console.error('❌ ValidAIte - Error parsing attachment template:', error.message);
    throw error;
  }
};

/**
 * Parses plain text content into template structure
 * @param {string} content - Plain text content
 * @returns {Object} Template structure
 */
const parseTextTemplate = (content) => {
  // Extract field names from text content
  const fieldMatches = content.match(/(?:^|\n)\s*[-*]\s*([^\n]+)/g);
  const fields = fieldMatches ? fieldMatches.map(match => match.replace(/(?:^|\n)\s*[-*]\s*/, '').trim()) : [];
  
  return {
    type: 'text',
    structure: {
      fields: fields,
      requiredFields: fields.filter(f => f.includes('*') || f.toLowerCase().includes('required')),
      optionalFields: fields.filter(f => !f.includes('*') && !f.toLowerCase().includes('required'))
    },
    metadata: {
      totalFields: fields.length,
      extractedFromText: true
    }
  };
};

/**
 * Retrieves cached template
 * @param {string} cacheKey - Cache key
 * @returns {Object|null} Cached template or null
 */
const getCachedTemplate = async (cacheKey) => {
  try {
    const cached = await storage.get(cacheKey);
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }
    
    // Remove expired cache
    if (cached) {
      await storage.delete(cacheKey);
    }
    
    return null;
  } catch (error) {
    console.error('❌ ValidAIte - Error retrieving cached template:', error.message);
    return null;
  }
};

/**
 * Caches template data
 * @param {string} cacheKey - Cache key
 * @param {Object} template - Template data
 * @param {Object} metadata - Template metadata
 */
const cacheTemplate = async (cacheKey, template, metadata) => {
  try {
    const cacheData = {
      template,
      metadata,
      cachedAt: Date.now(),
      expiresAt: Date.now() + TEMPLATE_CONFIG.CACHE_TTL
    };
    
    await storage.set(cacheKey, cacheData);
    console.log(`✅ ValidAIte - Template cached with key: ${cacheKey}`);
  } catch (error) {
    console.error('❌ ValidAIte - Error caching template:', error.message);
  }
};

/**
 * Lists all available templates in a space
 * @param {string} spaceKey - Confluence space key
 * @returns {Array} List of available templates
 */
export const listAvailableTemplates = async (spaceKey = TEMPLATE_CONFIG.DEFAULT_SPACE_KEY) => {
  try {
    const searchResponse = await api.asUser().requestConfluence(route`/wiki/rest/api/content`, {
      headers: {
        'Accept': 'application/json'
      },
      query: {
        spaceKey: spaceKey,
        type: 'page',
        status: 'current',
        title: 'Briefing Template',
        expand: 'version,space'
      }
    });

    if (searchResponse.status === 200) {
      const searchData = await searchResponse.json();
      
      return {
        success: true,
        templates: searchData.results.map(page => ({
          id: page.id,
          title: page.title,
          requestTypeId: extractRequestTypeFromTitle(page.title),
          lastUpdated: page.version?.when,
          spaceKey: page.space?.key
        }))
      };
    }
    
    return { success: false, templates: [], error: 'Failed to fetch templates' };
    
  } catch (error) {
    console.error('❌ ValidAIte - Error listing templates:', error.message);
    return { success: false, templates: [], error: error.message };
  }
};

/**
 * Extracts request type ID from template title
 * @param {string} title - Template page title
 * @returns {string|null} Request type ID or null
 */
const extractRequestTypeFromTitle = (title) => {
  const match = title.match(/Request Type (\d+)/);
  return match ? match[1] : null;
};

/**
 * Clears template cache
 * @param {string} requestTypeId - Optional specific request type to clear
 */
export const clearTemplateCache = async (requestTypeId = null) => {
  try {
    if (requestTypeId) {
      const cacheKey = `template_${requestTypeId}_${TEMPLATE_CONFIG.DEFAULT_SPACE_KEY}`;
      await storage.delete(cacheKey);
      console.log(`✅ ValidAIte - Cleared cache for request type: ${requestTypeId}`);
    } else {
      // Clear all template caches (this is a simplified approach)
      console.log('✅ ValidAIte - Template cache clear requested (implement full cache clear if needed)');
    }
  } catch (error) {
    console.error('❌ ValidAIte - Error clearing template cache:', error.message);
  }
};

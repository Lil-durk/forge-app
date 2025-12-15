/**
 * PageContextDisplay Component
 * Displays the current JSM portal request page context information
 * This component shows which request page the app is currently running on
 */

import React from 'react';
import { usePageContext } from '../hooks/usePageContext';

const PageContextDisplay = () => {
  const { requestType, loading, error, pageContext } = usePageContext();

  // Don't render anything if we're still loading
  if (loading) {
    return (
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f4f5f7', 
        border: '1px solid #dfe1e6', 
        borderRadius: '4px',
        marginBottom: '16px',
        fontSize: '14px',
        color: '#6b778c'
      }}>
        🔍 Detecting current request page...
      </div>
    );
  }

  // Show error state if context detection failed
  if (error) {
    return (
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#ffebe6', 
        border: '1px solid #ff8f73', 
        borderRadius: '4px',
        marginBottom: '16px',
        fontSize: '14px',
        color: '#bf2600'
      }}>
        ⚠️ Unable to detect request page context: {error}
      </div>
    );
  }

  // Main display when context is successfully detected
  return (
    <div style={{ 
      padding: '12px', 
      backgroundColor: '#e3fcef', 
      border: '1px solid #36b37e', 
      borderRadius: '4px',
      marginBottom: '16px'
    }}>
      <div style={{ 
        fontSize: '14px', 
        fontWeight: 'bold', 
        color: '#006644',
        marginBottom: '4px'
      }}>
        📍 Current Request Page
      </div>
      <div style={{ 
        fontSize: '13px', 
        color: '#006644'
      }}>
        {requestType || 'Unknown Request Type'}
      </div>
      
      {/* Additional context information for debugging */}
      {process.env.NODE_ENV === 'development' && pageContext && (
        <details style={{ marginTop: '8px' }}>
          <summary style={{ 
            fontSize: '12px', 
            color: '#6b778c', 
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            🔧 Debug Info (Development Only)
          </summary>
          <div style={{ 
            marginTop: '8px', 
            padding: '8px', 
            backgroundColor: '#f4f5f7', 
            borderRadius: '3px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#42526e'
          }}>
            <div><strong>Module:</strong> {pageContext.moduleKey || 'N/A'}</div>
            <div><strong>Site URL:</strong> {pageContext.siteUrl || 'N/A'}</div>
            <div><strong>Cloud ID:</strong> {pageContext.cloudId || 'N/A'}</div>
            
            {pageContext.requestType && (
              <>
                <div><strong>Request Type ID:</strong> {pageContext.requestType.id || 'N/A'}</div>
                <div><strong>Request Type Key:</strong> {pageContext.requestType.key || 'N/A'}</div>
                <div><strong>Request Type Name:</strong> {pageContext.requestType.name || 'N/A'}</div>
              </>
            )}
            
            {pageContext.serviceDesk && (
              <>
                <div><strong>Service Desk:</strong> {pageContext.serviceDesk.name || pageContext.serviceDesk.key || 'N/A'}</div>
                <div><strong>Service Desk ID:</strong> {pageContext.serviceDesk.id || 'N/A'}</div>
              </>
            )}
            
            {pageContext.project && (
              <div><strong>Project:</strong> {pageContext.project.name || pageContext.project.key || 'N/A'}</div>
            )}
            
            {pageContext.request && (
              <>
                <div><strong>Request ID:</strong> {pageContext.request.id || 'N/A'}</div>
                <div><strong>Request Key:</strong> {pageContext.request.key || 'N/A'}</div>
              </>
            )}
            
            {pageContext.customer && (
              <div><strong>Customer:</strong> {pageContext.customer.displayName || pageContext.customer.accountId || 'N/A'}</div>
            )}
            
            <details style={{ marginTop: '8px' }}>
              <summary style={{ cursor: 'pointer', fontSize: '10px' }}>Full Extension Object</summary>
              <pre style={{ 
                marginTop: '4px', 
                fontSize: '9px', 
                backgroundColor: '#ffffff', 
                padding: '4px', 
                borderRadius: '2px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {JSON.stringify(pageContext.fullExtension, null, 2)}
              </pre>
            </details>
          </div>
        </details>
      )}
    </div>
  );
};

export default PageContextDisplay;

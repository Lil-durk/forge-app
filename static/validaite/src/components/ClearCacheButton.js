/**
 * Clear Cache Button Component
 * Provides functionality to clear the AI validation cache when code changes are made
 */

import React, { useState } from 'react';
import { invoke } from '@forge/bridge';

const ClearCacheButton = ({ onCacheCleared }) => {
  const [isClearing, setIsClearing] = useState(false);
  const [lastCleared, setLastCleared] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);

  // Get cache statistics
  const getCacheStats = async () => {
    try {
      const result = await invoke('getCacheStatistics');
      if (result.success) {
        setCacheStats(result.stats);
      }
    } catch (error) {
      console.error('Error getting cache stats:', error);
    }
  };

  // Clear the validation cache
  const handleClearCache = async () => {
    setIsClearing(true);
    
    try {
      const result = await invoke('clearValidationCache');
      
      if (result.success) {
        setLastCleared(new Date());
        setCacheStats(null);
        
        // Notify parent component if callback provided
        if (onCacheCleared) {
          onCacheCleared(result);
        }
        
        // Show success message
        console.log(`✅ Cache cleared successfully! Removed ${result.clearedCount} cached results.`);
      } else {
        console.error('❌ Failed to clear cache:', result.error);
      }
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  // Load cache stats on component mount
  React.useEffect(() => {
    getCacheStats();
  }, []);

  return (
    <div className="clear-cache-section">
      <div className="clear-cache-header">
        <h3>🧹 Cache Management</h3>
        <p className="cache-description">
          Clear the AI validation cache to force re-analysis of files when you've made code changes.
        </p>
      </div>

      <div className="cache-info">
        {cacheStats && (
          <div className="cache-stats">
            <span className="cache-count">
              📊 {cacheStats.totalCachedResults} cached validation{cacheStats.totalCachedResults !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        
        {lastCleared && (
          <div className="last-cleared">
            <span className="last-cleared-text">
              ✅ Last cleared: {lastCleared.toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      <div className="cache-actions">
        <button
          onClick={handleClearCache}
          disabled={isClearing}
          className={`clear-cache-btn ${isClearing ? 'clearing' : ''}`}
          title="Clear all cached validation results to force AI re-analysis"
        >
          {isClearing ? (
            <>
              <span className="spinner">🔄</span>
              Clearing Cache...
            </>
          ) : (
            <>
              <span className="icon">🗑️</span>
              Clear Cache
            </>
          )}
        </button>

        <button
          onClick={getCacheStats}
          className="refresh-stats-btn"
          title="Refresh cache statistics"
        >
          <span className="icon">🔄</span>
          Refresh Stats
        </button>
      </div>

      <div className="cache-help">
        <details>
          <summary>ℹ️ When to use Clear Cache</summary>
          <ul>
            <li>After modifying validation rules or AI prompts</li>
            <li>When you want the AI to reconsider the same file</li>
            <li>After updating data analysis logic</li>
            <li>When testing different validation approaches</li>
          </ul>
        </details>
      </div>

      <style jsx>{`
        .clear-cache-section {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }

        .clear-cache-header h3 {
          margin: 0 0 8px 0;
          color: #495057;
          font-size: 16px;
        }

        .cache-description {
          margin: 0 0 12px 0;
          color: #6c757d;
          font-size: 14px;
          line-height: 1.4;
        }

        .cache-info {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .cache-stats {
          background: #e3f2fd;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #1565c0;
        }

        .last-cleared {
          background: #e8f5e8;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #2e7d32;
        }

        .cache-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .clear-cache-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .clear-cache-btn:hover:not(:disabled) {
          background: #c82333;
          transform: translateY(-1px);
        }

        .clear-cache-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
          transform: none;
        }

        .clear-cache-btn.clearing {
          background: #fd7e14;
        }

        .refresh-stats-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }

        .refresh-stats-btn:hover {
          background: #5a6268;
          transform: translateY(-1px);
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .cache-help {
          margin-top: 12px;
        }

        .cache-help details {
          font-size: 12px;
          color: #6c757d;
        }

        .cache-help summary {
          cursor: pointer;
          padding: 4px 0;
          font-weight: 500;
        }

        .cache-help summary:hover {
          color: #495057;
        }

        .cache-help ul {
          margin: 8px 0 0 16px;
          padding: 0;
        }

        .cache-help li {
          margin: 4px 0;
          line-height: 1.3;
        }

        .icon {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default ClearCacheButton;

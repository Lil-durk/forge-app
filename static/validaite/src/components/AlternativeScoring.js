/**
 * Alternative Scoring System - Health Meter & Confidence Matrix
 * A completely different approach to the 0-100 numerical scoring system
 */

import React, { useState, useEffect } from 'react';

const AlternativeScoring = ({ validationResult, isActive = false }) => {
  const [animationClass, setAnimationClass] = useState('');

  // Convert 0-100 score to alternative metrics
  const convertScore = (score) => {
    // Health Level (5 levels: Critical, Poor, Fair, Good, Excellent)
    let healthLevel;
    let healthColor;
    let healthHearts;
    
    if (score >= 90) {
      healthLevel = 'Excellent';
      healthColor = '#2563eb'; // blue-600 - special color for data health circle
      healthHearts = 5;
    } else if (score >= 75) {
      healthLevel = 'Good';
      healthColor = '#2563eb'; // blue-600 - special color for data health circle
      healthHearts = 4;
    } else if (score >= 60) {
      healthLevel = 'Fair';
      healthColor = '#2563eb'; // blue-600 - special color for data health circle
      healthHearts = 3;
    } else if (score >= 40) {
      healthLevel = 'Poor';
      healthColor = '#2563eb'; // blue-600 - special color for data health circle
      healthHearts = 2;
    } else {
      healthLevel = 'Critical';
      healthColor = '#2563eb'; // blue-600 - special color for data health circle
      healthHearts = 1;
    }

    // Confidence Matrix (Quality vs Risk)
    const quality = score >= 70 ? 'High' : score >= 50 ? 'Medium' : 'Low';
    const risk = score >= 70 ? 'Low' : score >= 50 ? 'Medium' : 'High';

    // Readiness Shield Level
    const shieldLevel = Math.ceil(score / 20); // 1-5 shields
    
    return {
      healthLevel,
      healthColor,
      healthHearts,
      quality,
      risk,
      shieldLevel,
      trustScore: score >= 80 ? 'Trusted' : score >= 60 ? 'Verified' : 'Pending'
    };
  };

  useEffect(() => {
    if (isActive) {
      setAnimationClass('alternative-scoring-enter');
      const timer = setTimeout(() => setAnimationClass('alternative-scoring-active'), 100);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!validationResult) return null;

  const metrics = convertScore(validationResult.validation.overallScore);
  const validation = validationResult.validation;

  const renderHeartMeter = () => {
    const hearts = [];
    for (let i = 1; i <= 5; i++) {
      hearts.push(
        <div
          key={i}
          className={`heart ${i <= metrics.healthHearts ? 'filled' : 'empty'}`}
          style={{
            animationDelay: `${i * 0.1}s`
          }}
        >
          {i <= metrics.healthHearts ? '💚' : '🤍'}
        </div>
      );
    }
    return hearts;
  };

  const renderShields = () => {
    const shields = [];
    for (let i = 1; i <= 5; i++) {
      shields.push(
        <div
          key={i}
          className={`shield ${i <= metrics.shieldLevel ? 'active' : 'inactive'}`}
          style={{
            animationDelay: `${i * 0.15}s`
          }}
        >
          {i <= metrics.shieldLevel ? '🛡️' : '⚪'}
        </div>
      );
    }
    return shields;
  };

  const getQualityRiskColor = (quality, risk) => {
    if (quality === 'High' && risk === 'Low') return '#10B981';
    if (quality === 'High' && risk === 'Medium') return '#22C55E';
    if (quality === 'Medium' && risk === 'Low') return '#22C55E';
    if (quality === 'Medium' && risk === 'Medium') return '#EAB308';
    if (quality === 'Low' && risk === 'High') return '#EF4444';
    return '#F97316';
  };

  // Generate improvement suggestions
  const getImprovementSuggestions = () => {
    const suggestions = [];
    
    if (validation.issues && validation.issues.length > 0) {
      // Get top 3 most important issues
      const topIssues = validation.issues
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
        })
        .slice(0, 3);
      
      topIssues.forEach(issue => {
        suggestions.push(issue.suggestion);
      });
    }
    
    if (suggestions.length === 0) {
      suggestions.push("Your data looks great! Consider reviewing for any minor optimizations.");
    }
    
    return suggestions;
  };

  const improvementSuggestions = getImprovementSuggestions();

  return (
    <div className={`alternative-scoring ${animationClass}`}>
      
      {/* Header */}
      <div className="alt-scoring-header">
        <h3>Health Analytics</h3>
        <p>Data quality assessment</p>
      </div>

      {/* Two Main Sections */}
      <div className="simple-layout">
        
        {/* Section 1: Health Status */}
        <div className="health-status-card">
          <div className="status-header">
            <h4>Data Health: <span style={{ color: metrics.healthColor }}>{metrics.healthLevel}</span></h4>
          </div>
          
          <div className="health-visual">
            <div className="health-indicator" style={{ backgroundColor: metrics.healthColor }}>
              <span className="health-score">{metrics.healthHearts}/5</span>
            </div>
          </div>
        </div>

        {/* Section 2: Improvement Summary */}
        <div className="improvement-summary-card">
          <div className="summary-header">
            <h4>What to Improve</h4>
            <div className="priority-indicator" style={{
              backgroundColor: metrics.healthHearts >= 4 ? '#ffffff' : 
                             metrics.healthHearts >= 3 ? '#6b7280' : '#000000',
              color: metrics.healthHearts >= 4 ? '#000000' : '#ffffff',
              border: metrics.healthHearts >= 4 ? '2px solid #000000' : 'none'
            }}>
              {metrics.healthHearts >= 4 ? 'Low Priority' : 
               metrics.healthHearts >= 3 ? 'Medium Priority' : 'High Priority'}
            </div>
          </div>
          
          <div className="improvement-list">
            {improvementSuggestions.map((suggestion, index) => (
              <div key={index} className="improvement-item">
                <span className="improvement-number">{index + 1}</span>
                <p>{suggestion}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default AlternativeScoring;

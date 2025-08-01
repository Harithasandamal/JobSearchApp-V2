/**
 * SESSION CONTINUITY BANNER
 * Shows when user has existing session data and can continue
 */

import React from 'react';
import useTheme from '../../hooks/useTheme';

const SessionContinuityBanner = ({ 
  hasExistingSession,
  sessionData,
  onContinueSession,
  onStartFresh,
  sessionAge
}) => {
  const { theme } = useTheme();

  if (!hasExistingSession) {
    return null;
  }

  const formatSessionAge = (age) => {
    const hours = Math.floor(age / (1000 * 60 * 60));
    const minutes = Math.floor((age % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
  };

  const getSessionSummary = () => {
    const summary = [];
    
    if (sessionData.jobsFound?.length > 0) {
      summary.push(`${sessionData.jobsFound.length} jobs found`);
    }
    
    if (sessionData.selectedJobs?.length > 0) {
      summary.push(`${sessionData.selectedJobs.length} jobs selected`);
    }
    
    if (sessionData.scoredJobs?.length > 0) {
      summary.push(`${sessionData.scoredJobs.length} jobs scored`);
    }
    
    if (sessionData.analysisData) {
      summary.push('analysis completed');
    }

    return summary.length > 0 ? summary.join(', ') : 'previous session';
  };

  return (
    <div className={`session-banner ${theme}`}>
      <div className="banner-icon">💾</div>
      
      <div className="banner-content">
        <div className="banner-title">Continue Previous Session?</div>
        <div className="banner-details">
          <span className="session-summary">{getSessionSummary()}</span>
          <span className="session-age">• Last updated {formatSessionAge(sessionAge)}</span>
        </div>
      </div>

      <div className="banner-actions">
        <button 
          className="session-action continue"
          onClick={onContinueSession}
          title="Continue where you left off"
        >
          <span className="action-icon">▶️</span>
          <span className="action-text">Continue</span>
        </button>
        
        <button 
          className="session-action fresh"
          onClick={onStartFresh}
          title="Start a new session (keeps previous data for now)"
        >
          <span className="action-icon">🆕</span>
          <span className="action-text">Start Fresh</span>
        </button>
      </div>
    </div>
  );
};

export default SessionContinuityBanner;
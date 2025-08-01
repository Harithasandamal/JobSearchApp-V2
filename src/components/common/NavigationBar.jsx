/**
 * NAVIGATION BAR COMPONENT
 * Provides back/forward navigation and session management
 */

import React from 'react';
import useTheme from '../../hooks/useTheme';

const NavigationBar = ({ 
  canNavigateBack, 
  canNavigateForward,
  previousScreen,
  nextScreen,
  onNavigateBack,
  onNavigateForward,
  currentScreen,
  hasExistingSession,
  onClearSession
}) => {
  const { theme } = useTheme();

  // Don't show navigation bar on welcome screen unless there's a session to manage
  if (currentScreen === 'welcome' && !hasExistingSession) {
    return null;
  }

  const getScreenName = (screen) => {
    const screenNames = {
      'welcome': 'Welcome',
      'searching': 'Searching', 
      'searched': 'Search Results',
      'scoring': 'Scoring Jobs',
      'scored': 'Job Scores',
      'analyzing': 'Analyzing Job',
      'analyzed': 'Analysis Results'
    };
    return screenNames[screen] || screen;
  };

  return (
    <div className={`navigation-bar ${theme}`}>
      <div className="nav-controls">
        {/* Back Button */}
        <button 
          className={`nav-btn back-btn ${!canNavigateBack ? 'disabled' : ''}`}
          onClick={onNavigateBack}
          disabled={!canNavigateBack}
          title={canNavigateBack ? `Back to ${getScreenName(previousScreen)}` : 'Cannot go back'}
        >
          <span className="nav-icon">←</span>
          <span className="nav-text">Back</span>
          {canNavigateBack && (
            <span className="nav-preview">{getScreenName(previousScreen)}</span>
          )}
        </button>

        {/* Forward Button */}
        <button 
          className={`nav-btn forward-btn ${!canNavigateForward ? 'disabled' : ''}`}
          onClick={onNavigateForward}
          disabled={!canNavigateForward}
          title={canNavigateForward ? `Forward to ${getScreenName(nextScreen)}` : 'Cannot go forward'}
        >
          <span className="nav-text">Forward</span>
          <span className="nav-icon">→</span>
          {canNavigateForward && (
            <span className="nav-preview">{getScreenName(nextScreen)}</span>
          )}
        </button>
      </div>

      {/* Current Screen Indicator */}
      <div className="current-screen">
        <span className="screen-label">Current:</span>
        <span className="screen-name">{getScreenName(currentScreen)}</span>
      </div>

      {/* Session Management */}
      {hasExistingSession && currentScreen === 'welcome' && (
        <div className="session-controls">
          <button 
            className="session-btn clear-session"
            onClick={onClearSession}
            title="Start fresh session (clears all data)"
          >
            <span className="session-icon">🗑️</span>
            <span className="session-text">Clear Session</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default NavigationBar;
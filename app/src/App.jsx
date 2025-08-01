import React, { useState, useEffect, Suspense, lazy } from 'react';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ThemeToggle from './components/ui/ThemeToggle';
import { defaultSuburb } from './data/melbourneSuburbs';
import useTheme from './hooks/useTheme';
import useLocalStorage from './hooks/useLocalStorage';
import useWorkflowLogger from './hooks/useWorkflowLogger';
import useSessionPersistence from './hooks/useSessionPersistence';
import NavigationBar from './components/common/NavigationBar';
import SessionContinuityBanner from './components/common/SessionContinuityBanner';

// Lazy load screen components for code splitting
const WelcomeScreen = lazy(() => import('./components/WelcomeScreen'));
const SearchingScreen = lazy(() => import('./components/SearchingScreen'));
const SearchedScreen = lazy(() => import('./components/SearchedScreen'));
const ScoringScreen = lazy(() => import('./components/ScoringScreen'));
const ScoredScreen = lazy(() => import('./components/ScoredScreen'));
const AnalyzingScreen = lazy(() => import('./components/AnalyzingScreen'));
const AnalyzedScreen = lazy(() => import('./components/AnalyzedScreen'));

function App() {
  const { theme, setTheme, locked: themeLocked, setLocked: setThemeLocked } = useTheme();
  const [localState, updateLocalState, clearLocalState] = useLocalStorage('appState', {});
  const workflowLogger = useWorkflowLogger();
  
  // Enhanced session persistence and navigation
  const {
    sessionData,
    updateSession,
    clearSession,
    navigateWithHistory,
    navigateBack,
    navigateForward,
    canNavigateBack,
    canNavigateForward,
    previousScreen,
    nextScreen,
    hasExistingSession,
    sessionAge
  } = useSessionPersistence();
  
  // Use session data for current screen (with fallback to session persistence)
  const currentScreen = sessionData.currentScreen || 'welcome';
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Use session data for app state (enhanced with persistence)
  const appState = {
    resume: sessionData.searchParams?.resume || 'Shamalka Resume v2.pdf',
    location: sessionData.searchParams?.location || defaultSuburb,
    distance: sessionData.searchParams?.distance || '5 km',
    postedAgo: sessionData.searchParams?.postedAgo || '3 days',
    keyword: sessionData.searchParams?.keyword || '',
    searchProcessId: sessionData.searchProcessId,
    selectedJobs: sessionData.selectedJobs || [],
    selectedJobForAnalysis: sessionData.selectedJobForAnalysis,
    jobsFound: sessionData.jobsFound || [],
    scoredJobs: sessionData.scoredJobs || [],
    analysisData: sessionData.analysisData
  };

  // Maximize window and ensure fresh start on component mount
  useEffect(() => {
    if (window.screen && window.screen.availWidth && window.screen.availHeight) {
      window.resizeTo(window.screen.availWidth, window.screen.availHeight);
      window.moveTo(0, 0);
    }
    
    // Ensure fresh app state on startup
    setAppState(prev => ({
      ...prev,
      searchProcessId: null,
      selectedJobs: [],
      selectedJobForAnalysis: null,
      jobsFound: [],
      scoredJobs: [],
      analysisData: null
    }));
    
    // Ensure welcome screen and unlock theme on fresh start
    setCurrentScreen('welcome');
    setThemeLocked(false);
    updateLocalState({ currentScreen: 'welcome' });
  }, []);

  // Graceful backend shutdown on browser close (development only)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only send shutdown if running on localhost
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        navigator.sendBeacon('http://localhost:3002/api/shutdown');
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Determine if search is locked (after search)
  const searchLockedScreens = [
    'searching',
    'searched',
    'scoring',
    'scored',
    'analyzing',
    'analyzed'
  ];
  const isSearchLocked = searchLockedScreens.includes(currentScreen);

  // Determine if scoring has started (after scoring)
  const scoringLockedScreens = [
    'scoring',
    'scored',
    'analyzing',
    'analyzed'
  ];
  const isScoringLocked = scoringLockedScreens.includes(currentScreen);

  // Enhanced navigation function with session persistence and logging
  const navigateTo = (screen) => {
    const fromScreen = currentScreen;
    workflowLogger.logNavigation(screen, fromScreen);
    
    // Use session-aware navigation with history
    navigateWithHistory(screen);
    
    // Unlock theme when returning to welcome screen
    if (screen === 'welcome') {
      setThemeLocked(false);
    }
  };

  // Enhanced app state updater with session persistence
  const updateAppState = (updates) => {
    // Update session data based on the type of updates
    const sessionUpdates = {};
    
    // Handle search parameters
    if (updates.location || updates.distance || updates.postedAgo || updates.keyword || updates.resume) {
      sessionUpdates.searchParams = {
        ...sessionData.searchParams,
        ...(updates.location && { location: updates.location }),
        ...(updates.distance && { distance: updates.distance }),
        ...(updates.postedAgo && { postedAgo: updates.postedAgo }),
        ...(updates.keyword && { keyword: updates.keyword }),
        ...(updates.resume && { resume: updates.resume })
      };
    }
    
    // Handle job data
    if (updates.jobsFound !== undefined) sessionUpdates.jobsFound = updates.jobsFound;
    if (updates.selectedJobs !== undefined) sessionUpdates.selectedJobs = updates.selectedJobs;
    if (updates.scoredJobs !== undefined) sessionUpdates.scoredJobs = updates.scoredJobs;
    
    // Handle analysis data
    if (updates.analysisData !== undefined) sessionUpdates.analysisData = updates.analysisData;
    if (updates.selectedJobForAnalysis !== undefined) sessionUpdates.selectedJobForAnalysis = updates.selectedJobForAnalysis;
    
    // Handle process tracking
    if (updates.searchProcessId !== undefined) sessionUpdates.searchProcessId = updates.searchProcessId;
    
    // Update session with all changes
    updateSession(sessionUpdates);
  };

  // Log app initialization
  useEffect(() => {
    workflowLogger.logAction('App initialized', `Theme: ${theme}, Screen: ${currentScreen}`);
    workflowLogger.logScreenLoad('app');
  }, []);

  // Log theme changes
  useEffect(() => {
    if (theme) {
      workflowLogger.logAction('Theme changed', `New theme: ${theme}`);
    }
  }, [theme]);

  const resetApp = () => {
    workflowLogger.logAction('App reset', 'User clicked reset button');
    clearLocalState();
    clearSession(); // Clear session data instead of just local state
    setThemeLocked(false);
    workflowLogger.logNavigation('welcome', currentScreen);
  };

  // Session continuity handlers
  const handleContinueSession = () => {
    workflowLogger.logAction('Session continued', `Resuming from ${currentScreen}`);
    // Already using session data, so just navigate to the current screen
    navigateTo(currentScreen);
  };

  const handleStartFresh = () => {
    workflowLogger.logAction('Started fresh session', 'User chose to start new session');
    clearSession();
    navigateTo('welcome');
  };

  // Enhanced navigation handlers with logging
  const handleNavigateBack = () => {
    workflowLogger.logAction('Navigation back', `From ${currentScreen} to ${previousScreen}`);
    navigateBack();
  };

  const handleNavigateForward = () => {
    workflowLogger.logAction('Navigation forward', `From ${currentScreen} to ${nextScreen}`);
    navigateForward();
  };

  // Pass setThemeLocked to WelcomeScreen so it can lock the theme immediately on search
  const renderCurrentScreen = () => {
    const commonProps = {
      appState,
      updateAppState,
      navigateTo
    };
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen {...commonProps} searchLocked={false} scoringLocked={false} setThemeLocked={setThemeLocked} />;
      case 'searching':
        return <SearchingScreen {...commonProps} searchLocked={true} scoringLocked={false} />;
      case 'searched':
        return <SearchedScreen {...commonProps} searchLocked={true} scoringLocked={false} />;
      case 'scoring':
        return <ScoringScreen {...commonProps} searchLocked={true} scoringLocked={true} />;
      case 'scored':
        return <ScoredScreen {...commonProps} searchLocked={true} scoringLocked={true} />;
      case 'analyzing':
        return <AnalyzingScreen {...commonProps} searchLocked={true} scoringLocked={true} />;
      case 'analyzed':
        return <AnalyzedScreen {...commonProps} searchLocked={true} scoringLocked={true} />;
      default:
        return <WelcomeScreen {...commonProps} searchLocked={false} scoringLocked={false} setThemeLocked={setThemeLocked} />;
    }
  };

  return (
    <div className={`App ${isTransitioning ? 'transitioning' : ''} ${theme}`}>
      <ThemeToggle locked={themeLocked || isSearchLocked} />
      
      {/* Session Continuity Banner - shows when user has existing session data */}
      <SessionContinuityBanner
        hasExistingSession={hasExistingSession}
        sessionData={sessionData}
        onContinueSession={handleContinueSession}
        onStartFresh={handleStartFresh}
        sessionAge={sessionAge}
      />
      
      {/* Navigation Bar - provides back/forward navigation */}
      <NavigationBar
        canNavigateBack={canNavigateBack}
        canNavigateForward={canNavigateForward}
        previousScreen={previousScreen}
        nextScreen={nextScreen}
        onNavigateBack={handleNavigateBack}
        onNavigateForward={handleNavigateForward}
        currentScreen={currentScreen}
        hasExistingSession={hasExistingSession}
        onClearSession={resetApp}
      />
      
      <Suspense fallback={<LoadingSpinner />}>
        {renderCurrentScreen()}
      </Suspense>
    </div>
  );
}

export default App; 
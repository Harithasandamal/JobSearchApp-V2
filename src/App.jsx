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
  
  const [currentScreen, setCurrentScreen] = useState(() => {
    // Always start fresh with welcome screen on app load
    const screen = 'welcome';
    // Clear any cached screen state to ensure fresh start
    if (localState?.currentScreen && localState.currentScreen !== 'welcome') {
      updateLocalState({ currentScreen: 'welcome' });
    }
    // Log initial screen on app load
    setTimeout(() => workflowLogger.logNavigation(screen, null), 100);
    return screen;
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [appState, setAppState] = useState({
    resume: 'Shamalka Resume v2.pdf',
    location: defaultSuburb,
    distance: '5 km',
    postedAgo: '3 days',
    keyword: '',
    searchProcessId: null,
    selectedJobs: [],
    selectedJobForAnalysis: null,
    jobsFound: [],
    scoredJobs: [],
    analysisData: null
  });

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

  // Enhanced navigation function with logging
  const navigateTo = (screen) => {
    const fromScreen = currentScreen;
    workflowLogger.logNavigation(screen, fromScreen);
    setCurrentScreen(screen);
    updateLocalState({ currentScreen: screen });
    
    // Unlock theme when returning to welcome screen
    if (screen === 'welcome') {
      setThemeLocked(false);
    }
  };

  const updateAppState = (updates) => {
    setAppState(prev => ({ ...prev, ...updates }));
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
    setCurrentScreen('welcome');
    setThemeLocked(false);
    workflowLogger.logNavigation('welcome', currentScreen);
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
    <div className={`App ${isTransitioning ? 'transitioning' : ''}`}>
      <ThemeToggle locked={themeLocked || isSearchLocked} />
      <Suspense fallback={<LoadingSpinner />}>
        {renderCurrentScreen()}
      </Suspense>
    </div>
  );
}

export default App; 
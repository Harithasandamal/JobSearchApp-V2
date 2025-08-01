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
import NavigationBar from './components/common/NavigationBar';

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
  
  // Simple in-session navigation state
  const [navigationHistory, setNavigationHistory] = useState(['welcome']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [currentScreen, setCurrentScreen] = useState('welcome');
  
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
    
    // Unlock theme on fresh start
    setThemeLocked(false);
  }, [setThemeLocked]);

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

  // Simple navigation with in-session history
  const navigateTo = (screen) => {
    const fromScreen = currentScreen;
    workflowLogger.logNavigation(screen, fromScreen);
    
    // Add to navigation history
    setNavigationHistory(prev => {
      const newHistory = [...prev.slice(0, historyIndex + 1), screen];
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
    
    setCurrentScreen(screen);
    updateLocalState({ currentScreen: screen });
    
    // Unlock theme when returning to welcome screen
    if (screen === 'welcome') {
      setThemeLocked(false);
    }
  };

  // Simple app state updater
  const updateAppState = (updates) => {
    setAppState(prev => ({ ...prev, ...updates }));
  };

  // Log app initialization and ensure default location
  useEffect(() => {
    workflowLogger.logAction('App initialized', `Theme: ${theme}, Screen: ${currentScreen}`);
    workflowLogger.logScreenLoad('app');
    
    // Ensure default location is Dandenong (reset any cached Carlton)
    if (appState.location !== defaultSuburb) {
      console.log(`🔄 Resetting location from "${appState.location}" to default "${defaultSuburb}"`);
      updateAppState({ location: defaultSuburb });
    }
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
    // Clear any cached location data to ensure default is used
    localStorage.removeItem('appState');
    setAppState({
      resume: 'Shamalka Resume v2.pdf',
      location: defaultSuburb, // Ensure Dandenong is used as default
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
    setCurrentScreen('welcome');
    setNavigationHistory(['welcome']);
    setHistoryIndex(0);
    setThemeLocked(false);
    workflowLogger.logNavigation('welcome', currentScreen);
  };

  // Navigation history handlers
  const canNavigateBack = historyIndex > 0;
  const canNavigateForward = historyIndex < navigationHistory.length - 1;
  const previousScreen = canNavigateBack ? navigationHistory[historyIndex - 1] : null;
  const nextScreen = canNavigateForward ? navigationHistory[historyIndex + 1] : null;

  const handleNavigateBack = () => {
    if (canNavigateBack) {
      workflowLogger.logAction('Navigation back', `From ${currentScreen} to ${previousScreen}`);
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentScreen(navigationHistory[newIndex]);
    }
  };

  const handleNavigateForward = () => {
    if (canNavigateForward) {
      workflowLogger.logAction('Navigation forward', `From ${currentScreen} to ${nextScreen}`);
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentScreen(navigationHistory[newIndex]);
    }
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
      
      {/* Navigation Bar - provides back/forward navigation within session */}
      <NavigationBar
        canNavigateBack={canNavigateBack}
        canNavigateForward={canNavigateForward}
        previousScreen={previousScreen}
        nextScreen={nextScreen}
        onNavigateBack={handleNavigateBack}
        onNavigateForward={handleNavigateForward}
        currentScreen={currentScreen}
        hasExistingSession={false}
        onClearSession={resetApp}
      />
      
      <Suspense fallback={<LoadingSpinner />}>
        {renderCurrentScreen()}
      </Suspense>
    </div>
  );
}

export default App; 
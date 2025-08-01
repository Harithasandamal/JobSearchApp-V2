import React, { useState, useEffect, Suspense, lazy } from 'react';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ThemeToggle from './components/ui/ThemeToggle';
import { defaultSuburb } from './data/melbourneSuburbs';
import useTheme from './hooks/useTheme';
import useDataPersistence from './hooks/useDataPersistence';
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
  const dataPersistence = useDataPersistence();
  const workflowLogger = useWorkflowLogger();
  
  const [currentScreen, setCurrentScreen] = useState(() => {
    // Check if this is a page refresh or fresh start
    if (dataPersistence.isPageRefresh && dataPersistence.persistentState.currentScreen) {
      // Page refresh - restore previous screen
      const restoredScreen = dataPersistence.persistentState.currentScreen;
      console.log(`🔄 Page refresh detected - restoring screen: ${restoredScreen}`);
      setTimeout(() => workflowLogger.logNavigation(restoredScreen, null, 'page_refresh'), 100);
      return restoredScreen;
    } else {
      // Fresh start - begin at welcome screen
      console.log('🆕 Fresh app start - beginning at welcome screen');
      setTimeout(() => workflowLogger.logNavigation('welcome', null, 'fresh_start'), 100);
      return 'welcome';
    }
  });
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const [appState, setAppState] = useState(() => {
    // Initialize with default values, then restore from persistence if page refresh
    const defaultState = {
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
    };

    if (dataPersistence.isPageRefresh && dataPersistence.persistentState) {
      // Page refresh - restore previous state
      const restored = dataPersistence.persistentState;
      console.log(`🔄 Restoring app state from persistence`);
      return {
        ...defaultState,
        ...restored.searchParams,
        selectedJobs: restored.selectedJobs || [],
        jobsFound: restored.jobsFound || [],
        scoredJobs: restored.scoredJobs || [],
        analysisData: restored.analysisData
      };
    }

    return defaultState;
  });

  // Maximize window on component mount
  useEffect(() => {
    if (window.screen && window.screen.availWidth && window.screen.availHeight) {
      window.resizeTo(window.screen.availWidth, window.screen.availHeight);
      window.moveTo(0, 0);
    }
    
    // Only reset state if this is a FRESH START (not page refresh)
    if (!dataPersistence.isPageRefresh) {
      console.log('🆕 Fresh start - clearing previous session data');
      setAppState(prev => ({
        ...prev,
        searchProcessId: null,
        selectedJobs: [],
        selectedJobForAnalysis: null,
        jobsFound: [],
        scoredJobs: [],
        analysisData: null
      }));
      
      // Fresh start - go to welcome screen and unlock theme
      setCurrentScreen('welcome');
      setThemeLocked(false);
      dataPersistence.updatePersistentState({ 
        currentScreen: 'welcome',
        searchParams: {},
        selectedJobs: [],
        jobsFound: [],
        scoredJobs: [],
        analysisData: null
      });
    } else {
      console.log('🔄 Page refresh - preserving session data');
      // Page refresh - theme lock status depends on current screen
      const isInSearchFlow = ['searching', 'searched', 'scoring', 'scored', 'analyzing', 'analyzed'].includes(currentScreen);
      setThemeLocked(isInSearchFlow);
    }
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

  // Enhanced navigation function with logging and persistence
  const navigateTo = (screen) => {
    const fromScreen = currentScreen;
    workflowLogger.logNavigation(screen, fromScreen);
    setCurrentScreen(screen);
    
    // Update persistent state for page refresh recovery
    dataPersistence.updatePersistentState({ currentScreen: screen });
    
    // Unlock theme when returning to welcome screen
    if (screen === 'welcome') {
      setThemeLocked(false);
    }
  };

  const updateAppState = (updates) => {
    setAppState(prev => {
      const newState = { ...prev, ...updates };
      
      // Persist important state changes
      dataPersistence.updatePersistentState({
        searchParams: {
          resume: newState.resume,
          location: newState.location,
          distance: newState.distance,
          postedAgo: newState.postedAgo,
          keyword: newState.keyword
        },
        selectedJobs: newState.selectedJobs || [],
        jobsFound: newState.jobsFound || [],
        scoredJobs: newState.scoredJobs || [],
        analysisData: newState.analysisData
      });
      
      return newState;
    });
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
    
    // Clear all persistent and session data
    dataPersistence.clearAllData();
    
    // Reset app state
    setAppState({
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
    
    setCurrentScreen('welcome');
    setThemeLocked(false);
    workflowLogger.logNavigation('welcome', currentScreen);
  };

  // Pass enhanced props including data persistence to all screens
  const renderCurrentScreen = () => {
    const commonProps = {
      appState,
      updateAppState,
      navigateTo,
      dataPersistence // Provide data persistence capabilities to all screens
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
      <Suspense fallback={<LoadingSpinner />}>
        {renderCurrentScreen()}
      </Suspense>
    </div>
  );
}

export default App; 
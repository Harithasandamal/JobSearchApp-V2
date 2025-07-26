import React, { useState, useEffect, Suspense, lazy } from 'react';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ThemeToggle from './components/ui/ThemeToggle';
import { defaultSuburb } from './data/melbourneSuburbs';
import useTheme from './hooks/useTheme';

// Lazy load screen components for code splitting
const WelcomeScreen = lazy(() => import('./components/WelcomeScreen'));
const SearchingScreen = lazy(() => import('./components/SearchingScreen'));
const SearchedScreen = lazy(() => import('./components/SearchedScreen'));
const ScoringScreen = lazy(() => import('./components/ScoringScreen'));
const ScoredScreen = lazy(() => import('./components/ScoredScreen'));
const AnalyzingScreen = lazy(() => import('./components/AnalyzingScreen'));
const AnalyzedScreen = lazy(() => import('./components/AnalyzedScreen'));

function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [themeLocked, setThemeLocked] = useState(false);
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

  const themeHook = useTheme();

  // Maximize window on component mount
  useEffect(() => {
    if (window.screen && window.screen.availWidth && window.screen.availHeight) {
      window.resizeTo(window.screen.availWidth, window.screen.availHeight);
      window.moveTo(0, 0);
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

  const navigateTo = (screen) => {
    if (screen !== currentScreen) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentScreen(screen);
        setIsTransitioning(false);
        
        // When returning to welcome screen, unlock theme and reset state for fresh search
        if (screen === 'welcome') {
          console.log('🏠 Returning to welcome screen - unlocking theme and resetting state');
          setThemeLocked(false);
          themeHook.setLocked(false);
          
          // Reset app state for fresh search (but keep user preferences)
          setAppState(prev => ({
            resume: prev.resume, // Keep resume
            location: prev.location, // Keep location
            distance: prev.distance, // Keep distance  
            postedAgo: prev.postedAgo, // Keep postedAgo
            keyword: prev.keyword, // Keep keyword
            // Reset search-related data
            searchProcessId: null,
            selectedJobs: [],
            selectedJobForAnalysis: null,
            jobsFound: [],
            scoredJobs: [],
            analysisData: null
          }));
        } else {
          // Lock theme for all other screens
          console.log(`🔒 Navigating to ${screen} - locking theme`);
          setThemeLocked(true);
          themeHook.setLocked(true);
        }
      }, 100);
    }
  };

  const updateAppState = (updates) => {
    setAppState(prev => ({ ...prev, ...updates }));
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
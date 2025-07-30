import { useState } from 'react';
import seekApiService from '../services/seekApi';
import useTheme from './useTheme';

const useSearchHandler = ({ updateAppState, navigateTo, setThemeLocked }) => {
  const [isSearching, setIsSearching] = useState(false);
  const themeHook = useTheme();

  const detectCurrentTheme = () => {
    // Multi-source theme detection for reliability
    const rootElement = document.documentElement;
    const domHasDarkClass = rootElement.classList.contains('dark-theme');
    const reactThemeState = themeHook.theme;
    const localStorageTheme = localStorage.getItem('theme');
    
    // Determine actual current theme (prioritize visual state)
    let currentTheme;
    if (domHasDarkClass) {
      currentTheme = 'dark';
    } else if (rootElement.classList.contains('light-theme') || !domHasDarkClass) {
      currentTheme = 'light';  
    } else {
      // Fallback to localStorage or React state
      currentTheme = localStorageTheme || reactThemeState || 'light';
    }
    
    console.log('🎨 Theme Detection Summary:');
    console.log('  - DOM dark-theme class:', domHasDarkClass);
    console.log('  - React state:', reactThemeState);
    console.log('  - localStorage:', localStorageTheme);
    console.log('  - Final detected theme:', currentTheme);
    
    return currentTheme;
  };

  const handleSearchJobs = async (localState) => {
    console.log('🚀 Search initiated with localState:', localState);
    
    // Lock theme toggle immediately
    if (setThemeLocked) setThemeLocked(true);
    
    const currentTheme = detectCurrentTheme();
    console.log('🎯 Final theme decision:', currentTheme);
    
    // Validate required fields (keyword is now optional)
    if (!localState.location || localState.location.trim() === '') {
      alert('Please select a location.');
      if (setThemeLocked) setThemeLocked(false);
      return;
    }

    // Set searching state to prevent multiple clicks
    setIsSearching(true);
    console.log('✅ Form validation passed, proceeding with search');

    // Update app state immediately to sync form data
    updateAppState({
      location: localState.location,
      distance: localState.distance,
      postedAgo: localState.postedAgo,
      keyword: localState.keyword,
      // Reset any previous search data
      jobsFound: [],
      selectedJobs: [],
      scoredJobs: [],
      analysisData: null,
      selectedJobForAnalysis: null,
      searchProcessId: null
    });

    // LIGHT MODE: Show SearchingScreen with progress, then display test jobs
    if (currentTheme === 'light') {
      console.log('🌞 LIGHT MODE - Starting search with progress simulation');
      
      // Navigate to searching screen first
      navigateTo('searching');
      
      try {
        // Start simulated light mode search process
        const response = await seekApiService.startSearch(localState, true); // testMode = true
        console.log('🌞 Light mode search process started:', response.processId);
        
        updateAppState({ searchProcessId: response.processId });
        setIsSearching(false);
        
      } catch (error) {
        console.error('❌ Light mode search failed:', error);
        alert(`Light mode search failed: ${error.message}`);
        if (setThemeLocked) setThemeLocked(false);
        navigateTo('welcome');
        setIsSearching(false);
      }
      return;
    }

    // DARK MODE: Real search with working scraper logic
    if (currentTheme === 'dark') {
      console.log('🌙 DARK MODE - Real search with working scraper logic');
      
      const searchParams = {
        ...localState,
        keyword: localState.keyword && localState.keyword.trim() !== '' ? localState.keyword.trim() : null
      };

      console.log('🔍 Search params:', searchParams);
      
      // Build the SEEK URL and open externally for comparison
      try {
        // Get URL from backend API for consistency
        const response = await fetch('http://localhost:3002/api/build-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(searchParams)
        });
        
        if (response.ok) {
          const { url: seekUrl } = await response.json();
          console.log('🔗 Opening SEEK URL for comparison:', seekUrl);
          window.open(seekUrl, '_blank', 'noopener,noreferrer');
          console.log('🌐 SEEK page opened - compare results with SearchedScreen');
        } else {
          // Fallback: build URL directly if API fails
          const fallbackUrl = `https://www.seek.com.au/jobs/in-${searchParams.location.replace(/\s+/g, '-')}?daterange=3&distance=${searchParams.distance.replace(' km', '')}&sortmode=ListedDate`;
          console.log('🔗 Fallback URL:', fallbackUrl);
          window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
        }
      } catch (urlError) {
        console.error('❌ Failed to build/open SEEK URL:', urlError);
        // Simple fallback
        const simpleUrl = `https://www.seek.com.au/jobs?q=${searchParams.keyword || ''}&l=${searchParams.location}`;
        window.open(simpleUrl, '_blank', 'noopener,noreferrer');
      }
      
      // Go to searching screen first
      navigateTo('searching');
      
      try {
        // Use real search with working scraper (testMode = false, but using good scraping logic)
        const response = await seekApiService.startSearch(searchParams, false);
        console.log('🔍 Real search process started:', response.processId);
        
        updateAppState({ searchProcessId: response.processId });
      } catch (error) {
        console.error('❌ Real search failed:', error);
        alert(`Search failed: ${error.message}`);
        if (setThemeLocked) setThemeLocked(false);
        navigateTo('welcome');
      } finally {
        setIsSearching(false);
      }
      return;
    }

    // Should never reach here
    console.error('❌ Theme detection failed completely');
    setIsSearching(false);
    if (setThemeLocked) setThemeLocked(false);
    alert('Theme detection error. Please refresh the page.');
  };

  return {
    isSearching,
    handleSearchJobs
  };
};

export default useSearchHandler; 
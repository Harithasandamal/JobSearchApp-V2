/**
 * Search Progress Hook - Manages search progress steps and auto-progression
 * Extracted from SearchingScreen.jsx for better maintainability
 */
import { useState, useEffect } from 'react';
import useTheme from './useTheme';

const useSearchProgress = (appState) => {
  const themeHook = useTheme();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);

  // Unified search steps for both light and dark modes
  const [searchSteps, setSearchSteps] = useState([
    { id: 1, text: 'Initializing Browser Engine', status: 'pending' },
    { id: 2, text: 'Connecting to Job Sources', status: 'pending' },
    { id: 3, text: 'Loading Job Listings', status: 'pending' },
    { id: 4, text: 'Extracting Job Information', status: 'pending' },
    { id: 5, text: 'Processing & Validating Results', status: 'pending' }
  ]);

  // Initialize first step immediately when component mounts
  useEffect(() => {
    if (appState.searchProcessId) {
      console.log('🎬 Initializing search progress...');
      
      // Light mode: Auto-tick steps quickly since we already have hardcoded URLs
      if (themeHook.theme === 'light') {
        console.log('🌞 Light mode: Auto-advancing steps (URLs already available)');
        
        // Step 1: Browser Engine
        setCurrentStep(1);
        setProgress(10);
        setSearchSteps(prev => prev.map((step, index) => ({
          ...step,
          status: index === 0 ? 'in-progress' : 'pending'
        })));
        
        // Auto-advance through steps since URLs are hardcoded
        setTimeout(() => {
          // Step 2: Job Sources
          setCurrentStep(2);
          setProgress(25);
          setSearchSteps(prev => prev.map((step, index) => ({
            ...step,
            status: index <= 0 ? 'completed' : index === 1 ? 'in-progress' : 'pending'
          })));
        }, 800);
        
        setTimeout(() => {
          // Step 3: Loading Listings (URLs ready)
          setCurrentStep(3);
          setProgress(40);
          setSearchSteps(prev => prev.map((step, index) => ({
            ...step,
            status: index <= 1 ? 'completed' : index === 2 ? 'in-progress' : 'pending'
          })));
        }, 1600);
        
        setTimeout(() => {
          // Step 4: Ready for actual scraping
          setCurrentStep(4);
          setProgress(55);
          setSearchSteps(prev => prev.map((step, index) => ({
            ...step,
            status: index <= 2 ? 'completed' : index === 3 ? 'in-progress' : 'pending'
          })));
        }, 2400);
        
      } else {
        // Dark mode: Normal initialization
        setCurrentStep(1);
        setProgress(5);
        setSearchSteps(prev => prev.map((step, index) => ({
          ...step,
          status: index === 0 ? 'in-progress' : 'pending'
        })));
      }
    }
  }, [appState.searchProcessId, themeHook.theme]);

  // Clear error when searchProcessId is received
  useEffect(() => {
    if (appState.searchProcessId) {
      setError(null);
    }
  }, [appState.searchProcessId]);

  return {
    progress,
    setProgress,
    currentStep,
    setCurrentStep,
    searchSteps,
    setSearchSteps,
    error,
    setError
  };
};

export default useSearchProgress;
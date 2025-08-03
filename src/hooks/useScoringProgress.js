/**
 * Scoring Progress Hook - Manages scoring progress steps and auto-progression
 * Follows the same pattern as useSearchProgress for consistency
 */
import { useState, useEffect } from 'react';
import useTheme from './useTheme';

const useScoringProgress = (appState) => {
  const themeHook = useTheme();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);

  // 4 main data extraction steps following the new workflow
  const [scoringSteps, setScoringSteps] = useState([
    { 
      id: 1, 
      text: '📥 Downloading Job Pages', 
      description: 'Downloading HTML content from each selected job posting',
      status: 'pending' 
    },
    { 
      id: 2, 
      text: '📄 Converting to Markdown', 
      description: 'Extracting job details and converting to markdown format',
      status: 'pending' 
    },
    { 
      id: 3, 
      text: '🤖 Extracting Data with ChatGPT', 
      description: 'Using ChatGPT to extract mandatory, preferred, responsibilities, questions, and other details',
      status: 'pending' 
    },
    { 
      id: 4, 
      text: '📊 Compiling Results', 
      description: 'Organizing extracted data for user interaction',
      status: 'pending' 
    }
  ]);

  // Initialize first step when scoring starts
  useEffect(() => {
    if (appState.selectedJobs && appState.selectedJobs.length > 0) {
      console.log('🎯 Initializing scoring progress...');
      
      // Light mode: Auto-tick steps quickly for demo
      if (themeHook.theme === 'light') {
        console.log('🌞 Light mode: Auto-advancing scoring steps');
        
        // Step 1: Downloading Job Pages (0-25%)
        setCurrentStep(1);
        setProgress(15);
        setScoringSteps(prev => prev.map((step, index) => ({
          ...step,
          status: index === 0 ? 'processing' : 'pending'
        })));
        
        // Auto-advance through steps
        setTimeout(() => {
          // Step 2: Converting to Markdown (25-50%)
          setCurrentStep(2);
          setProgress(40);
          setScoringSteps(prev => prev.map((step, index) => ({
            ...step,
            status: index <= 0 ? 'completed' : index === 1 ? 'processing' : 'pending'
          })));
        }, 1500);
        
        setTimeout(() => {
          // Step 3: Extracting Data with ChatGPT (50-75%)
          setCurrentStep(3);
          setProgress(65);
          setScoringSteps(prev => prev.map((step, index) => ({
            ...step,
            status: index <= 1 ? 'completed' : index === 2 ? 'processing' : 'pending'
          })));
        }, 3000);
        
        setTimeout(() => {
          // Step 4: Compiling Results (75-100%)
          setCurrentStep(4);
          setProgress(100);
          setScoringSteps(prev => prev.map((step, index) => ({
            ...step,
            status: index <= 2 ? 'completed' : index === 3 ? 'processing' : 'pending'
          })));
        }, 4500);
        
      } else {
        // Dark mode: Normal initialization
        setCurrentStep(1);
        setProgress(5);
        setScoringSteps(prev => prev.map((step, index) => ({
          ...step,
          status: index === 0 ? 'processing' : 'pending'
        })));
      }
    }
  }, [appState.selectedJobs, themeHook.theme]);

  // Clear error when scoring process starts
  useEffect(() => {
    if (appState.scoringProcessId) {
      setError(null);
    }
  }, [appState.scoringProcessId]);

  return {
    progress,
    setProgress,
    currentStep,
    setCurrentStep,
    scoringSteps,
    setScoringSteps,
    error,
    setError
  };
};

export default useScoringProgress; 
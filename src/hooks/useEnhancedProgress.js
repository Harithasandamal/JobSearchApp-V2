/**
 * Enhanced Progress Hook - Provides smooth, real-time loading with accurate time distribution
 * Replaces the basic progress tracking with advanced interpolation and visual feedback
 */
import { useState, useEffect, useRef } from 'react';
import useTheme from './useTheme';

const useEnhancedProgress = (type = 'search') => {
  const themeHook = useTheme();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [stepDetails, setStepDetails] = useState({});
  
  // Animation frame reference for smooth progress
  const animationRef = useRef(null);
  const lastProgressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const startTimeRef = useRef(null);
  const stepStartTimeRef = useRef(null);

  // Define steps based on type
  const getSteps = () => {
    if (type === 'search') {
      return [
        { 
          id: 1, 
          text: 'Initializing Browser Engine', 
          description: 'Setting up browser instances for job scraping',
          weight: 10,
          status: 'pending' 
        },
        { 
          id: 2, 
          text: 'Connecting to Job Sources', 
          description: 'Establishing connections to job platforms',
          weight: 15,
          status: 'pending' 
        },
        { 
          id: 3, 
          text: 'Loading Job Listings', 
          description: 'Collecting job URLs and basic information',
          weight: 25,
          status: 'pending' 
        },
        { 
          id: 4, 
          text: 'Extracting Job Information', 
          description: 'Scraping detailed job data from each listing',
          weight: 35,
          status: 'pending' 
        },
        { 
          id: 5, 
          text: 'Processing & Validating Results', 
          description: 'Validating and organizing final job data',
          weight: 15,
          status: 'pending' 
        }
      ];
    } else if (type === 'extraction') {
      return [
        { 
          id: 1, 
          text: '📥 Downloading Job Pages', 
          description: 'Downloading HTML content from each selected job posting',
          weight: 25,
          status: 'pending' 
        },
        { 
          id: 2, 
          text: '📄 Converting to Markdown', 
          description: 'Extracting job details and converting to markdown format',
          weight: 25,
          status: 'pending' 
        },
        { 
          id: 3, 
          text: '🤖 Extracting Data with ChatGPT', 
          description: 'Using ChatGPT to extract mandatory, preferred, responsibilities, questions, and other details',
          weight: 35,
          status: 'pending' 
        },
        { 
          id: 4, 
          text: '📊 Compiling Results', 
          description: 'Organizing extracted data for user interaction',
          weight: 15,
          status: 'pending' 
        }
      ];
    }
    return [];
  };

  const [steps, setSteps] = useState(getSteps());

  // Smooth progress animation
  const animateProgress = () => {
    const currentTime = Date.now();
    const elapsed = currentTime - startTimeRef.current;
    const duration = 500; // 500ms for smooth transition
    
    if (elapsed < duration) {
      const easeOut = 1 - Math.pow(1 - elapsed / duration, 3);
      const currentProgress = lastProgressRef.current + (targetProgressRef.current - lastProgressRef.current) * easeOut;
      
      setProgress(currentProgress);
      animationRef.current = requestAnimationFrame(animateProgress);
    } else {
      setProgress(targetProgressRef.current);
      lastProgressRef.current = targetProgressRef.current;
    }
  };

  // Update progress smoothly
  const updateProgress = (newProgress, stepIndex = null) => {
    if (newProgress < 0 || newProgress > 100) return;
    
    targetProgressRef.current = newProgress;
    
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animateProgress();
    
    // Update step if provided
    if (stepIndex !== null && stepIndex !== currentStep) {
      setCurrentStep(stepIndex);
      stepStartTimeRef.current = Date.now();
      
      // Update step statuses
      setSteps(prev => prev.map((step, index) => {
        if (index < stepIndex) {
          return { ...step, status: 'completed' };
        } else if (index === stepIndex) {
          return { ...step, status: 'processing' };
        } else {
          return { ...step, status: 'pending' };
        }
      }));
    }
  };

  // Initialize progress tracking
  const initializeProgress = (mode = 'dark') => {
    console.log(`🎬 Initializing ${type} progress...`);
    
    setIsLoading(true);
    setLoadingMessage('Starting process...');
    startTimeRef.current = Date.now();
    stepStartTimeRef.current = Date.now();
    
    // Light mode: Quick initialization
    if (mode === 'light') {
      console.log(`🌞 Light mode: Quick ${type} initialization`);
      updateProgress(5, 0);
      
      // Auto-advance through steps for light mode
      const stepDelays = type === 'search' ? [800, 1600, 2400, 3200] : [1500, 3000, 4500];
      const stepProgresses = type === 'search' ? [25, 50, 75, 90] : [40, 65, 85];
      
      stepDelays.forEach((delay, index) => {
        setTimeout(() => {
          updateProgress(stepProgresses[index], index + 1);
        }, delay);
      });
      
      // Complete after all steps
      setTimeout(() => {
        updateProgress(100, steps.length - 1);
        setIsLoading(false);
        setLoadingMessage('Process completed');
      }, stepDelays[stepDelays.length - 1] + 1000);
      
    } else {
      // Dark mode: Normal initialization
      updateProgress(5, 0);
    }
  };

  // Map backend progress to frontend smoothly
  const mapBackendProgress = (backendProgress, backendStep, totalJobs = 1, currentJob = 1) => {
    if (!startTimeRef.current) {
      initializeProgress(themeHook.theme);
    }
    
    // Calculate smooth progress based on backend data
    let mappedProgress = 0;
    
    if (type === 'search') {
      // Search progress mapping
      if (backendProgress <= 30) {
        mappedProgress = 5 + (backendProgress / 30) * 20; // 5-25%
      } else if (backendProgress <= 50) {
        mappedProgress = 25 + ((backendProgress - 30) / 20) * 25; // 25-50%
      } else if (backendProgress <= 75) {
        mappedProgress = 50 + ((backendProgress - 50) / 25) * 25; // 50-75%
      } else {
        mappedProgress = 75 + ((backendProgress - 75) / 25) * 25; // 75-100%
      }
    } else if (type === 'extraction') {
      // Extraction progress mapping
      const jobProgress = (currentJob - 1) / totalJobs;
      const stepProgress = backendProgress / 100;
      mappedProgress = (jobProgress * 100) + (stepProgress * (100 / totalJobs));
    }
    
    // Update loading message
    const currentStepData = steps[currentStep];
    if (currentStepData) {
      setLoadingMessage(`${currentStepData.text} - ${Math.round(mappedProgress)}%`);
    }
    
    updateProgress(mappedProgress, currentStep);
  };

  // Complete process
  const completeProgress = () => {
    updateProgress(100, steps.length - 1);
    setIsLoading(false);
    setLoadingMessage('Process completed successfully');
    
    // Mark all steps as completed
    setSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
  };

  // Handle error
  const handleError = (errorMessage) => {
    setError(errorMessage);
    setIsLoading(false);
    setLoadingMessage('Process failed');
    
    // Mark current step as failed
    setSteps(prev => prev.map((step, index) => 
      index === currentStep ? { ...step, status: 'failed' } : step
    ));
  };

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    progress,
    currentStep,
    steps,
    error,
    isLoading,
    loadingMessage,
    stepDetails,
    initializeProgress,
    mapBackendProgress,
    completeProgress,
    handleError,
    setError
  };
};

export default useEnhancedProgress; 
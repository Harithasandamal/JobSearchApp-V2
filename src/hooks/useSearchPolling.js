/**
 * Search Polling Hook - Manages backend search status polling
 * Extracted from SearchingScreen.jsx for better maintainability  
 */
import { useEffect } from 'react';
import seekApiService from '../services/seekApi';

const useSearchPolling = ({ 
  appState, 
  updateAppState, 
  navigateTo, 
  setCurrentStep, 
  setProgress, 
  setSearchSteps, 
  setJobsFound, 
  setError 
}) => {

  // Start real SEEK search when component mounts
  useEffect(() => {
    if (!appState.searchProcessId) return;

    const processId = appState.searchProcessId;
    console.log('🌙 Setting up search polling for process ID:', processId);

    let isMounted = true;
    let interval;

    const pollForProgress = async () => {
      try {
        console.log('📡 Polling search status for process ID:', processId);
        const status = await seekApiService.getSearchStatus(processId);
        console.log('🔍 Poll result:', status);
        
        if (!isMounted) return;

        if (status.status === 'completed') {
          console.log('✅ Search completed! Status:', status);
          // All steps completed
          setCurrentStep(4);
          setProgress(100);
          setSearchSteps(prev => prev.map((step, index) => ({ ...step, status: 'completed' })));
          
          const jobs = status.jobs || [];
          console.log('📋 Jobs found:', jobs.length, jobs);
          setJobsFound(jobs);
          updateAppState({ jobsFound: jobs });
          
          // Navigate to searched screen
          console.log('🚀 Navigating to searched screen...');
          if (isMounted) {
            navigateTo('searched');
          }
          
          clearInterval(interval);
        } else if (status.status === 'failed') {
          console.log('❌ Search failed');
          setError('Search failed');
          setSearchSteps(prev => prev.map(step => ({ ...step, status: 'failed' })));
          clearInterval(interval);
        } else {
          console.log('⏳ Search still running, progress:', status.progress);
          
          // Clear any error since search is running successfully
          setError(null);
          
          // Dynamic progress tracking based on actual backend progress
          const progressPercent = status.progress || 0;
          console.log('📊 Progress update:', progressPercent + '%');
          
          // Map progress to steps with improved thresholds for smoother updates
          let currentStepIndex = 0;
          let stepProgress = progressPercent;
          
          if (progressPercent >= 5) {
            currentStepIndex = 1; // Browser launched
          }
          if (progressPercent >= 15) {
            currentStepIndex = 2; // Connected to SEEK
          }
          if (progressPercent >= 25) {
            currentStepIndex = 3; // Page loaded
          }
          if (progressPercent >= 60) {
            currentStepIndex = 4; // Data extracted
          }
          if (progressPercent >= 90) {
            currentStepIndex = 4; // Processing complete
          }
          
          console.log('🎯 Current step index:', currentStepIndex, 'Progress:', stepProgress + '%');
          
          setProgress(stepProgress);
          setCurrentStep(currentStepIndex);
          
          // Update step statuses based on progress - more granular updates
          setSearchSteps(prev => prev.map((step, index) => ({
            ...step,
            status: index < currentStepIndex ? 'completed' : 
                   index === currentStepIndex ? 'in-progress' : 'pending'
          })));
        }
      } catch (error) {
        console.error('❌ Error polling search status:', error);
        setError('Failed to get search status');
        clearInterval(interval);
      }
    };

    // Start polling immediately for faster initial response
    console.log('🚀 Starting immediate polling...');
    pollForProgress();
    
    // Then poll every 500ms for very responsive updates
    interval = setInterval(pollForProgress, 500);

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [appState.searchProcessId, navigateTo, updateAppState, setCurrentStep, setProgress, setSearchSteps, setJobsFound, setError]);

};

export default useSearchPolling;
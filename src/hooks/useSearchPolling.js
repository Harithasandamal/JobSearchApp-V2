/**
 * Search Polling Hook - Manages backend search status polling
 * Extracted from SearchingScreen.jsx for better maintainability  
 */
import { useEffect, useState } from 'react';
import seekApiService from '../services/seekApi';

const useSearchPolling = ({ 
  appState, 
  updateAppState, 
  navigateTo, 
  setJobsFound, 
  onProgressUpdate,
  onComplete,
  onError
}) => {
  const [searchProcessId, setSearchProcessId] = useState(null);
  const [searchStatus, setSearchStatus] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Start real SEEK search when component mounts
  useEffect(() => {
    if (!appState.searchProcessId) return;

    const processId = appState.searchProcessId;
    setSearchProcessId(processId);
    console.log('🌙 Setting up search polling for process ID:', processId);

    let isMounted = true;
    let interval;

    const pollForProgress = async () => {
      try {
        console.log('📡 Polling search status for process ID:', processId);
        const status = await seekApiService.getSearchStatus(processId);
        console.log('🔍 Poll result:', status);
        console.log('🔍 Status type:', typeof status.status);
        console.log('🔍 Status value:', status.status);
        console.log('🔍 Progress:', status.progress);
        console.log('🔍 Jobs length:', status.jobs ? status.jobs.length : 0);
        
        if (!isMounted) return;

        setSearchStatus(status);

        if (status.status === 'completed') {
          console.log('✅ Search completed! Status:', status);
          console.log('📊 Status details:', {
            processId: status.processId,
            status: status.status,
            progress: status.progress,
            jobCount: status.jobCount,
            jobsLength: status.jobs ? status.jobs.length : 0
          });
          
          const jobs = status.jobs || [];
          console.log('📋 Jobs found:', jobs.length, jobs);
          setJobsFound(jobs);
          updateAppState({ jobsFound: jobs });
          
          // Call enhanced progress callbacks
          if (onComplete) {
            console.log('🎯 Calling onComplete callback...');
            onComplete();
          }
          
          // Add small delay to ensure loading bar reaches 100% before navigation
          console.log('🚀 Navigating to searched screen in 500ms...');
          setTimeout(() => {
            if (isMounted) {
              console.log('🎯 Executing navigation to searched screen...');
              navigateTo('searched');
            } else {
              console.log('⚠️ Component unmounted, skipping navigation');
            }
          }, 500);
          
          clearInterval(interval);
        } else if (status.status === 'failed') {
          console.log('❌ Search failed');
          setSearchError('Search failed');
          
          // Call enhanced progress callbacks
          if (onError) {
            onError('Search failed');
          }
          
          clearInterval(interval);
        } else {
          console.log('⏳ Search still running, progress:', status.progress);
          
          // Clear any error since search is running successfully
          setSearchError(null);
          
          // Check if progress is 100% but status is still 'running' (backend completed but status not updated)
          if (status.progress >= 100 && status.status === 'running') {
            console.log('⚠️ Progress is 100% but status is still running - backend may have completed');
            // Force completion after a short delay
            setTimeout(() => {
              if (isMounted) {
                console.log('🔄 Forcing completion due to 100% progress...');
                const jobs = status.jobs || [];
                setJobsFound(jobs);
                updateAppState({ jobsFound: jobs });
                
                if (onComplete) {
                  onComplete();
                }
                
                setTimeout(() => {
                  if (isMounted) {
                    navigateTo('searched');
                  }
                }, 500);
                
                clearInterval(interval);
              }
            }, 1000);
            return;
          }
          
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
          
          // Call enhanced progress callbacks
          if (onProgressUpdate) {
            onProgressUpdate({
              progress: stepProgress,
              currentStep: currentStepIndex,
              totalJobs: status.totalJobs || 1,
              currentJob: status.currentJob || 1,
              status: status.status
            });
          }
        }
      } catch (error) {
        console.error('❌ Error polling search status:', error);
        setSearchError('Failed to get search status');
        
        // Call enhanced progress callbacks
        if (onError) {
          onError('Failed to get search status');
        }
        
        clearInterval(interval);
      }
    };

    // Start polling immediately for faster initial response
    console.log('🚀 Starting immediate polling...');
    pollForProgress();
    
    // Then poll every 300ms for very responsive updates
    interval = setInterval(pollForProgress, 300);

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [appState.searchProcessId, navigateTo, updateAppState, setJobsFound, onProgressUpdate, onComplete, onError]);

  return {
    searchProcessId,
    searchStatus,
    searchError
  };
};

export default useSearchPolling;
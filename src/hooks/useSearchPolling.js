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
  const [pollStartTime, setPollStartTime] = useState(null);
  const [lastProgressTime, setLastProgressTime] = useState(null);
  const [lastProgress, setLastProgress] = useState(0);

  // Start real SEEK search when component mounts
  useEffect(() => {
    if (!appState.searchProcessId) return;

    const processId = appState.searchProcessId;
    setSearchProcessId(processId);
    setPollStartTime(Date.now());
    setLastProgressTime(null); // Don't set until we get actual progress
    setLastProgress(0);
    setSearchError(null); // Clear any existing errors when search starts
    console.log('🌙 Setting up search polling for process ID:', processId);

    let isMounted = true;
    let interval;

    const pollForProgress = async () => {
      try {
        // DISABLED: Timeout mechanism causing false errors
        // const currentTime = Date.now();
        // const elapsedTime = currentTime - pollStartTime;
        
        // console.log('⏱️ Timeout check:', {
        //   elapsedTime: Math.round(elapsedTime / 1000) + 's',
        //   lastProgressTime: lastProgressTime ? Math.round((currentTime - lastProgressTime) / 1000) + 's ago' : 'null',
        //   lastProgress: lastProgress + '%'
        // });
        
        // // Don't check timeout for the first 10 seconds to allow search to start
        // if (elapsedTime < 10000) {
        //   console.log('⏱️ Skipping timeout check - search just started');
        // } else {
        //   // Only timeout if no progress for 2 minutes AND we've been running for at least 3 minutes
        //   // AND we have a valid lastProgressTime (not the initial value)
        //   if (elapsedTime > 180000 && lastProgressTime && (currentTime - lastProgressTime) > 120000) { // 3 min total + 2 min no progress
        //     console.log('⏰ Intelligent timeout: No progress for 2 minutes after 3 minutes total');
        //     setSearchError('Search timeout - please try again');
        //     if (onError) {
        //       onError('Search timeout');
        //     }
        //     clearInterval(interval);
        //     return;
        //   }
          
        //   // Absolute timeout after 10 minutes (emergency fallback)
        //   if (elapsedTime > 600000) { // 10 minutes
        //     console.log('⏰ Absolute timeout reached (10 minutes)');
        //     setSearchError('Search timeout - please try again');
        //     if (onError) {
        //       onError('Search timeout');
        //     }
        //     clearInterval(interval);
        //     return;
        //   }
        // }
        
        console.log('📡 Polling search status for process ID:', processId);
        const status = await seekApiService.getSearchStatus(processId);
        console.log('🔍 Poll result:', status);
        console.log('🔍 Status type:', typeof status.status);
        console.log('🔍 Status value:', status.status);
        console.log('🔍 Progress:', status.progress);
        console.log('🔍 Jobs length:', status.jobs ? status.jobs.length : 0);
        
        if (!isMounted) return;

        setSearchStatus(status);
        
        // Clear any error if we got a valid response from backend
        if (status && (status.status === 'running' || status.status === 'completed' || status.status === 'failed')) {
          setSearchError(null);
          console.log('✅ Clearing error - got valid response from backend');
        }

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
          
          // Jump to 100% after 500ms delay, then navigate
          console.log('🚀 Jumping to 100% and navigating in 500ms...');
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
                
                // Jump to 100% after 500ms delay, then navigate
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
          
          // Additional check: if jobs are present but status is still running
          if (status.jobs && status.jobs.length > 0 && status.status === 'running' && status.progress >= 95) {
            console.log('⚠️ Jobs found but status still running - forcing completion...');
            setTimeout(() => {
              if (isMounted) {
                console.log('🔄 Forcing completion due to jobs presence...');
                const jobs = status.jobs || [];
                setJobsFound(jobs);
                updateAppState({ jobsFound: jobs });
                
                if (onComplete) {
                  onComplete();
                }
                
                // Jump to 100% after 500ms delay, then navigate
                setTimeout(() => {
                  if (isMounted) {
                    navigateTo('searched');
                  }
                }, 500);
                
                clearInterval(interval);
              }
            }, 500);
            return;
          }
          
          // Dynamic progress tracking based on actual backend progress
          const progressPercent = status.progress || 0;
          console.log('📊 Progress update:', progressPercent + '%');
          
          // Track progress changes for intelligent timeout
          if (progressPercent > lastProgress) {
            setLastProgress(progressPercent);
            setLastProgressTime(Date.now());
            console.log('📈 Progress increased from', lastProgress, 'to', progressPercent);
            
            // Clear any error since progress is being made
            if (searchError) {
              setSearchError(null);
              console.log('✅ Clearing error due to progress');
            }
          } else if (progressPercent === lastProgress && lastProgressTime === null) {
            // If we haven't set lastProgressTime yet but have progress, set it now
            setLastProgressTime(Date.now());
            console.log('📈 Initial progress set:', progressPercent);
          }
          
          // Map progress to steps with proper distribution for 3 loading screens
          // Progress: 5% to 95% (5% before 1st step, 95% after last step)
          let currentStepIndex = 0;
          let stepProgress = 5; // Start at 5%
          
          // Step 1: Initializing Browser Engine (5% - 20%)
          if (progressPercent >= 5) {
            currentStepIndex = 1;
            stepProgress = Math.min(progressPercent, 20);
          }
          
          // Step 2: Connecting to Job Sources (20% - 40%)
          if (progressPercent >= 20) {
            currentStepIndex = 2;
            stepProgress = Math.min(progressPercent, 40);
          }
          
          // Step 3: Loading Job Listings (40% - 60%)
          if (progressPercent >= 40) {
            currentStepIndex = 3;
            stepProgress = Math.min(progressPercent, 60);
          }
          
          // Step 4: Extracting Job Information (60% - 80%)
          if (progressPercent >= 60) {
            currentStepIndex = 4;
            stepProgress = Math.min(progressPercent, 80);
          }
          
          // Step 5: Processing & Validating Results (80% - 95%)
          if (progressPercent >= 80) {
            currentStepIndex = 5;
            stepProgress = Math.min(progressPercent, 95);
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
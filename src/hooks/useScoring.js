import { useState, useEffect, useRef } from 'react';
import scoringApiService from '../services/scoringApi';
import useScoringProgress from './useScoringProgress';

const useScoring = (selectedJobs, updateAppState, navigateTo, callbacks = {}) => {
     const [scoredJobs, setScoredJobs] = useState([]);
   const [error, setError] = useState(null);
   const [scoringStatus, setScoringStatus] = useState(null);
   const processStartedRef = useRef(false);
   const completedRef = useRef(false);

  // Use the new scoring progress hook
  const { 
    progress, 
    setProgress, 
    currentStep, 
    setCurrentStep, 
    scoringSteps, 
    setScoringSteps, 
    error: progressError, 
    setError: setProgressError 
  } = useScoringProgress({ selectedJobs: selectedJobs });

  // Merge errors from progress hook
  useEffect(() => {
    if (progressError) {
      setError(progressError);
      if (callbacks.onError) {
        callbacks.onError(progressError);
      }
    }
  }, [progressError, callbacks]);

  // Start real scoring process
  useEffect(() => {
    if (scoringSteps.length === 0 || processStartedRef.current || !selectedJobs) return;

         processStartedRef.current = true; // Mark process as started
     completedRef.current = false; // Reset completion flag

    const startRealScoring = async () => {
      try {
        console.log('🚀 Starting job data extraction...');
        
        // Only extract data from jobs with valid URLs
        const jobsToExtract = (selectedJobs || []).filter(job => job.url && job.url.startsWith('http'));
        if (jobsToExtract.length === 0) {
          const errorMsg = 'No valid job URLs found for data extraction.';
          setError(errorMsg);
          if (callbacks.onError) {
            callbacks.onError(errorMsg);
          }
          return;
        }
        
        // Start the data extraction process
        const response = await scoringApiService.startScoring(jobsToExtract);
        const processId = response.processId;
        
        console.log('✅ Data extraction process started:', processId);
        
        // Poll for results
        scoringApiService.pollScoringResults(
          processId,
                     // Progress callback
           (status) => {
             // Update status
             setScoringStatus(status);
             
             // Only log significant progress changes
             if (status.progress > 0 && status.progress % 25 === 0) {
               console.log('📊 Data extraction progress:', status.progress + '%');
             }
             
             // Ensure progress doesn't go backwards
             const newProgress = status.progress || 0;
             setProgress(prevProgress => Math.max(prevProgress, newProgress));
            
                         // Map progress to data extraction steps
             let currentStepIndex = 0;
             
             // Step 1: Downloading Job Pages (0-25%)
             if (status.progress >= 5) currentStepIndex = 1;
             // Step 2: Converting to Markdown (25-50%)
             if (status.progress >= 10) currentStepIndex = 2;
             // Step 3: Extracting Data with ChatGPT (50-75%)
             if (status.progress >= 15) currentStepIndex = 3;
             // Step 4: Compiling Results (75-100%)
             if (status.progress >= 20) currentStepIndex = 4;
            
            setCurrentStep(currentStepIndex);
            
            // Update step statuses
            setScoringSteps(prev => prev.map((step, index) => {
              if (index < currentStepIndex) {
                return { ...step, status: 'completed' };
              } else if (index === currentStepIndex) {
                return { ...step, status: 'processing' };
              } else {
                return { ...step, status: 'pending' };
              }
            }));
            
            // Call enhanced progress callbacks
            if (callbacks.onProgressUpdate) {
              callbacks.onProgressUpdate({
                progress: newProgress,
                currentStep: currentStepIndex,
                totalJobs: jobsToExtract.length,
                currentJob: status.currentJob || 1,
                status: status.status
              });
            }
          },
                     // Complete callback
           (status) => {
             // Prevent multiple completion calls
             if (completedRef.current) {
               console.log('⚠️ Completion already processed, skipping...');
               return;
             }
             completedRef.current = true;
             
             console.log('✅ Data extraction completed successfully');
             
             // Update status
             setScoringStatus(status);
            
                         // All steps completed
             setCurrentStep(4);
             setProgress(100);
             setScoringSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
             
             // Force UI update
             setTimeout(() => {
               setProgress(100);
             }, 50);
            
                         // Process extraction results
             let extractedJobsData = [];
             
             // Check for extractedJobs first (new format)
             if (status.extractedJobs && Array.isArray(status.extractedJobs)) {
               extractedJobsData = status.extractedJobs;
             } else if (status.results && status.results.extractedJobs && Array.isArray(status.results.extractedJobs)) {
               // Check for results.extractedJobs (backend format)
               extractedJobsData = status.results.extractedJobs;
             } else if (status.results && status.results.scoredJobs && Array.isArray(status.results.scoredJobs)) {
               // Fallback for legacy format
               extractedJobsData = status.results.scoredJobs;
             }
             
             if (extractedJobsData.length > 0) {
               // Handle the new extraction method results
               extractedJobsData = extractedJobsData.map(job => {
                return {
                  ...job,
                  // Ensure all required fields are present
                  id: job.id,
                  title: job.title,
                  company: job.company,
                  location: job.location,
                  url: job.url,
                  postedAgo: job.postedAgo || 'N/A',
                  
                  // New 5-list structure
                  mandatoryRequirements: job.mandatoryRequirements || [],
                  preferredRequirements: job.preferredRequirements || [],
                  responsibilities: job.responsibilities || [],
                  employerQuestions: job.employerQuestions || [],
                  otherDetails: job.otherDetails || [],
                  
                  // User interaction data (initialized as empty)
                  checkedMandatory: job.checkedMandatory || [],
                  checkedPreferred: job.checkedPreferred || [],
                  checkedEmployerQuestions: job.checkedEmployerQuestions || [],
                  checkedOtherDetails: job.checkedOtherDetails || [],
                  
                  // Compatibility score (starts at 0)
                  compatibilityScore: job.compatibilityScore || 0,
                  maxPossibleScore: job.maxPossibleScore || 0,
                  score: job.compatibilityScore || 0, // For backwards compatibility
                  
                  // Metadata
                  timestamp: job.timestamp || new Date().toISOString(),
                  extractionMethod: job.extractionMethod || 'chatgpt-data-extraction'
                };
              });
                         } else {
               console.warn('⚠️ No extraction results found');
               console.log('Available keys in status:', Object.keys(status));
               if (status.results) {
                 console.log('Available keys in results:', Object.keys(status.results));
               }
               extractedJobsData = [];
             }
            
                         console.log(`📊 Processed ${extractedJobsData.length} extracted jobs`);
            
                         setScoredJobs(extractedJobsData);
             updateAppState({ scoredJobs: extractedJobsData });
             
             // Call enhanced progress callbacks
             if (callbacks.onComplete) {
               callbacks.onComplete();
             }
             
             // Navigate to scored screen immediately
             console.log('🚀 Navigating to scored screen...');
             
                            // Then navigate
               setTimeout(() => {
                 navigateTo('scored');
               }, 100);
          },
          // Error callback
          (error) => {
            console.error('❌ Data extraction failed:', error);
            setError(error.message);
            setScoringSteps(prev => prev.map(step => ({ ...step, status: 'failed' })));
            
            // Call enhanced progress callbacks
            if (callbacks.onError) {
              callbacks.onError(error.message);
            }
          }
        );
        
      } catch (error) {
        console.error('❌ Failed to start data extraction:', error);
        setError(error.message);
        
        // Call enhanced progress callbacks
        if (callbacks.onError) {
          callbacks.onError(error.message);
        }
      }
    };

         startRealScoring();
   }, [scoringSteps.length, selectedJobs, navigateTo, updateAppState, callbacks]);

  return {
    progress,
    currentStep,
    scoredJobs,
    scoringSteps,
    error,
    scoringStatus,
    setError
  };
};

export default useScoring; 
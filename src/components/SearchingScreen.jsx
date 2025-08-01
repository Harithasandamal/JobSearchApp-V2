import React, { useState, useEffect } from 'react';
import ProgressChecklist from './common/ProgressChecklist';
import ResumeUpload from './ResumeUpload';
import seekApiService from '../services/seekApi';
import { formatLocation, formatDistance, formatPostedAgo, formatKeyword } from '../utils/formatters';
import useTheme from '../hooks/useTheme';

const SearchingScreen = ({ appState, updateAppState, navigateTo, scoringLocked }) => {
  const themeHook = useTheme();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [jobsFound, setJobsFound] = useState([]);
  const [error, setError] = useState(null);
  

  const [resumeFile, setResumeFile] = useState({
    name: appState.resume || 'Shamalka Resume v2.pdf',
    file: null,
    isDefault: appState.resume === 'Shamalka Resume v2.pdf' || appState.resume === 'Default Resume.pdf'
  });
  
  // Unified search steps for both light and dark modes
  const [searchSteps, setSearchSteps] = useState([
    { id: 1, text: 'Initializing Browser Engine', status: 'pending' },
    { id: 2, text: 'Connecting to Job Sources', status: 'pending' },
    { id: 3, text: 'Loading Job Listings', status: 'pending' },
    { id: 4, text: 'Extracting Job Information', status: 'pending' },
    { id: 5, text: 'Processing & Validating Results', status: 'pending' }
  ]);

  // Keep resumeFile in sync with appState.resume
  useEffect(() => {
    if (appState.resume && appState.resume !== resumeFile.name) {
      if (appState.resume === 'Default Resume.pdf' || appState.resume === 'Shamalka Resume v2.pdf') {
        setResumeFile({ name: 'Shamalka Resume v2.pdf', file: null, isDefault: true });
      } else {
        setResumeFile({ name: appState.resume, file: null, isDefault: false });
      }
    }
  }, [appState.resume]);

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
  }, [appState.searchProcessId, navigateTo, updateAppState]);

  const handleStop = async () => {
    const processId = appState.searchProcessId;
    if (processId) {
      try {
        await seekApiService.stopSearch(processId);
      } catch (error) {
        console.error('Error stopping search:', error);
      }
    }
    navigateTo('welcome');
  };

  return (
    <>
      <div className="left-panel">
        {/* Resume Section */}
        <div className="form-group">
          <ResumeUpload
            resumeFile={resumeFile}
            setResumeFile={setResumeFile}
            scoringLocked={scoringLocked}
            updateAppState={updateAppState}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Location:</label>
          <div className="search-param-display">
            {formatLocation(appState.location)}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Distance:</label>
          <div className="search-param-display">
            {formatDistance(appState.distance)}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Posted Ago:</label>
          <div className="search-param-display">
            {formatPostedAgo(appState.postedAgo)}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Keyword:</label>
          <div className="search-param-display">
            {formatKeyword(appState.keyword)}
          </div>
        </div>

        {/* Action Buttons */}
        <button className="btn btn-warning" disabled>
          Searching SEEK...
        </button>

        <div className="nav-buttons">
          <button className="btn btn-danger" onClick={handleStop}>
            Stop
          </button>
        </div>
      </div>

      <div className="right-panel">
        <div className="screen-header">
          {themeHook.theme === 'light' ? 
            'Searching: Test Jobs' : 
            `Searching: ${formatKeyword(appState.keyword)} Jobs in ${formatDistance(appState.distance)} from ${formatLocation(appState.location)}, Posted within last ${formatPostedAgo(appState.postedAgo)}`
          }
        </div>

        {error && (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '15px', 
            borderRadius: '5px', 
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {!appState.searchProcessId && !error && (
          <div style={{ 
            backgroundColor: '#d1ecf1', 
            color: '#0c5460', 
            padding: '15px', 
            borderRadius: '5px', 
            marginBottom: '20px',
            border: '1px solid #bee5eb'
          }}>
            <strong>Initializing:</strong> Starting search process...
          </div>
        )}

        <ProgressChecklist items={searchSteps} />
        
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <span style={{ color: '#666' }}>
            {Math.round(progress)}% Complete - {searchSteps[currentStep]?.text || 'Initializing...'}
          </span>
        </div>
      </div>
    </>
  );
};

export default SearchingScreen; 
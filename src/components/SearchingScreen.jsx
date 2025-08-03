import React, { useState, useEffect } from 'react';
import ProgressChecklist from './common/ProgressChecklist';
import ResumeUpload from './ResumeUpload';
import { formatLocation, formatDistance, formatPostedAgo, formatKeyword } from '../utils/formatters';
import useTheme from '../hooks/useTheme';
import useSearchPolling from '../hooks/useSearchPolling';
import useResumeSync from '../hooks/useResumeSync';

const SearchingScreen = ({ appState, updateAppState, navigateTo, scoringLocked }) => {
  const themeHook = useTheme();
  const [jobsFound, setJobsFound] = useState([]);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);

  // Custom hooks for modular functionality
  const { resumeFile, setResumeFile } = useResumeSync(appState);

  // Search polling hook
  const { 
    searchProcessId, 
    searchStatus, 
    searchError 
  } = useSearchPolling({
    appState,
    updateAppState,
    navigateTo,
    setJobsFound,
    onProgressUpdate: (status) => {
      // Update progress based on backend status with proper distribution (5% to 95%)
      if (status.progress !== undefined) {
        // Map backend progress (0-100) to frontend progress (5-95)
        const mappedProgress = 5 + (status.progress * 0.9); // 5% to 95%
        setProgress(mappedProgress);
      }
      
      // Map progress to steps with proper thresholds for 3 loading screens
      let stepIndex = 0;
      if (status.progress >= 5) stepIndex = 1;   // Initializing Browser Engine
      if (status.progress >= 20) stepIndex = 2;  // Connecting to Job Sources
      if (status.progress >= 40) stepIndex = 3;  // Loading Job Listings
      if (status.progress >= 60) stepIndex = 4;  // Extracting Job Information
      if (status.progress >= 80) stepIndex = 5;  // Processing & Validating Results
      
      setCurrentStep(stepIndex);
    },
    onComplete: () => {
      // Jump to 100% after half second delay
      setTimeout(() => {
        setProgress(100);
        setCurrentStep(5); // All steps completed
      }, 500);
    },
    onError: (error) => {
      setError(error);
    }
  });

  // Handle search errors
  useEffect(() => {
    if (searchError) {
      setError(searchError);
    }
  }, [searchError]);

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

  // Define search steps
  const searchSteps = [
    { id: 1, text: 'Initializing Browser Engine', status: 'pending' },
    { id: 2, text: 'Connecting to Job Sources', status: 'pending' },
    { id: 3, text: 'Loading Job Listings', status: 'pending' },
    { id: 4, text: 'Extracting Job Information', status: 'pending' },
    { id: 5, text: 'Processing & Validating Results', status: 'pending' }
  ];

  // Update step statuses based on current step
  const updatedSteps = searchSteps.map((step, index) => {
    if (index < currentStep) {
      return { ...step, status: 'completed' };
    } else if (index === currentStep) {
      return { ...step, status: 'processing' };
    } else {
      return { ...step, status: 'pending' };
    }
  });

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

        <ProgressChecklist items={updatedSteps} />
        
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <span style={{ color: '#666' }}>
            {Math.round(progress)}% Complete - {updatedSteps[currentStep]?.text || 'Initializing...'}
          </span>
        </div>
      </div>
    </>
  );
};

export default SearchingScreen; 
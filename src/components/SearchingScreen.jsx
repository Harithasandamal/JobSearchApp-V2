import React, { useState, useEffect } from 'react';
import ProgressChecklist from './common/ProgressChecklist';
import ResumeUpload from './ResumeUpload';
import { formatLocation, formatDistance, formatPostedAgo, formatKeyword } from '../utils/formatters';
import useTheme from '../hooks/useTheme';
import useSearchPolling from '../hooks/useSearchPolling';
import useResumeSync from '../hooks/useResumeSync';
import seekApiService from '../services/seekApi';

const SearchingScreen = ({ appState, updateAppState, navigateTo, scoringLocked }) => {
  const themeHook = useTheme();
  const [jobsFound, setJobsFound] = useState([]);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);
  const [searchMode, setSearchMode] = useState('dark'); // Default to dark mode

  // Custom hooks for modular functionality
  const { resumeFile, setResumeFile } = useResumeSync(appState);

  // Determine search mode based on theme
  useEffect(() => {
    setSearchMode(themeHook.theme === 'light' ? 'light' : 'dark');
  }, [themeHook.theme]);

  // Define search steps based on mode
  const getSearchSteps = (mode) => {
    if (mode === 'light') {
      // Light mode: Skip URL building step since we have URLs locally
      return [
        { id: 1, text: 'Initializing Search Engine', status: 'pending' },
        { id: 2, text: 'Loading Sample Data', status: 'pending' },
        { id: 3, text: 'Processing Job Listings', status: 'pending' },
        { id: 4, text: 'Formatting Results', status: 'pending' },
        { id: 5, text: 'Completing Search', status: 'pending' }
      ];
    } else {
      // Dark mode: Include URL building step
      return [
        { id: 1, text: 'Initializing Browser', status: 'pending' },
        { id: 2, text: 'Building Search URL', status: 'pending' },
        { id: 3, text: 'Loading SEEK Page', status: 'pending' },
        { id: 4, text: 'Extracting Job Listings', status: 'pending' },
        { id: 5, text: 'Processing Results', status: 'pending' },
        { id: 6, text: 'Completing Search', status: 'pending' }
      ];
    }
  };

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
      // Update progress based on backend status with proper distribution (0% to 100%)
      if (status.progress !== undefined) {
        // Use actual backend progress (0-100)
        setProgress(status.progress);
      }
      
      // Map progress to steps with proper thresholds based on mode
      let stepIndex = 0;
      const totalSteps = searchMode === 'light' ? 5 : 6;
      
      if (searchMode === 'light') {
        // Light mode step mapping (5 steps)
        if (status.progress >= 0) stepIndex = 1;   // Initializing Search Engine
        if (status.progress >= 20) stepIndex = 2;  // Loading Sample Data
        if (status.progress >= 40) stepIndex = 3;  // Processing Job Listings
        if (status.progress >= 60) stepIndex = 4;  // Formatting Results
        if (status.progress >= 80) stepIndex = 5;  // Completing Search
      } else {
        // Dark mode step mapping (6 steps)
        if (status.progress >= 0) stepIndex = 1;   // Initializing Browser
        if (status.progress >= 15) stepIndex = 2;  // Building Search URL
        if (status.progress >= 30) stepIndex = 3;  // Loading SEEK Page
        if (status.progress >= 50) stepIndex = 4;  // Extracting Job Listings
        if (status.progress >= 70) stepIndex = 5;  // Processing Results
        if (status.progress >= 85) stepIndex = 6;  // Completing Search
      }
      
      setCurrentStep(stepIndex);
    },
    onComplete: () => {
      // Jump to 100% after half second delay
      setTimeout(() => {
        setProgress(100);
        setCurrentStep(searchMode === 'light' ? 5 : 6); // All steps completed
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

  // Get search steps based on current mode
  const searchSteps = getSearchSteps(searchMode);

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
          {error && (
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.reload()}
              style={{ marginLeft: '10px' }}
            >
              Retry Search
            </button>
          )}
        </div>
      </div>

      <div className="right-panel">
        <div className="screen-header">
          {searchMode === 'light' ? 
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
            <br />
            <small style={{ color: '#856404' }}>
              Try refreshing the page or checking your internet connection.
            </small>
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
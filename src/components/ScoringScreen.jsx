import React, { useState, useEffect } from 'react';
import ResumeLabel from './common/ResumeLabel';
import ProgressChecklist from './common/ProgressChecklist';
import ProgressBar from './ui/ProgressBar';
import useScoring from '../hooks/useScoring';
import useTheme from '../hooks/useTheme';
import useEnhancedProgress from '../hooks/useEnhancedProgress';
import { formatLocation, formatDistance, formatPostedAgo, formatKeyword } from '../utils/formatters';

const ScoringScreen = ({ appState, updateAppState, navigateTo }) => {
  const { theme } = useTheme();
  const [resumeFile, setResumeFile] = useState({
    name: appState.resume || 'Default Resume.pdf',
    file: null,
    isDefault: appState.resume === 'Default Resume.pdf'
  });

  // Enhanced progress hook for extraction (background only)
  const { 
    progress, 
    currentStep, 
    steps, 
    error, 
    isLoading, 
    loadingMessage,
    mapBackendProgress,
    completeProgress,
    handleError,
    initializeProgress
  } = useEnhancedProgress('extraction');

  // Use custom hook for scoring logic with enhanced progress integration
  const { scoredJobs, scoringSteps, scoringError } = useScoring(
    appState.selectedJobs, 
    updateAppState, 
    navigateTo,
    {
      onProgressUpdate: (status) => {
        // Map backend progress to frontend smoothly
        if (status.progress !== undefined) {
          const totalJobs = appState.selectedJobs?.length || 1;
          const currentJob = status.currentJob || 1;
          mapBackendProgress(status.progress, status.currentStep, totalJobs, currentJob);
        }
      },
      onComplete: () => {
        completeProgress();
      },
      onError: (error) => {
        handleError(error);
      }
    }
  );

  // Keep resumeFile in sync with appState.resume
  useEffect(() => {
    if (appState.resume && appState.resume !== resumeFile.name) {
      if (appState.resume === 'Default Resume.pdf') {
        setResumeFile({ name: 'Default Resume.pdf', file: null, isDefault: true });
      } else {
        setResumeFile({ name: appState.resume, file: null, isDefault: false });
      }
    }
  }, [appState.resume]);

  // Initialize progress when extraction starts
  useEffect(() => {
    if (appState.selectedJobs && appState.selectedJobs.length > 0 && !isLoading) {
      initializeProgress(theme);
    }
  }, [appState.selectedJobs, theme]);

  // Handle scoring errors
  useEffect(() => {
    if (scoringError) {
      handleError(scoringError);
    }
  }, [scoringError]);

  const handleStop = () => {
    navigateTo('searched');
  };

  return (
    <>
      <div className="left-panel">
        {/* Resume Section */}
        <div className="form-group">
          <ResumeLabel resumeFile={resumeFile} />
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
          Extracting Job Data...
        </button>

        <div className="nav-buttons">
          <button className="btn btn-danger" onClick={handleStop}>
            Stop Extraction
          </button>
        </div>
      </div>

      <div className="right-panel">
        <div className="screen-header">
          {theme === 'light' ? 
            `Extracting: ${appState.selectedJobs?.length || 0} Test Jobs` : 
            `Extracting: ${appState.selectedJobs?.length || 0} of ${formatKeyword(appState.keyword)} Jobs in ${formatDistance(appState.distance)} from ${formatLocation(appState.location)}, Posted within last ${formatPostedAgo(appState.postedAgo)}`
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

        {!appState.scoringProcessId && !error && (
          <div style={{
            backgroundColor: '#d1ecf1',
            color: '#0c5460',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #bee5eb'
          }}>
            <strong>Initializing:</strong> Starting data extraction process...
          </div>
        )}
        
        <ProgressChecklist items={steps} />
        
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <span style={{ color: '#666' }}>
            {Math.round(progress)}% Complete - {steps[currentStep]?.text || 'Initializing...'}
          </span>
        </div>
      </div>
    </>
  );
};

export default ScoringScreen; 
import React, { useState, useEffect } from 'react';
import ResumeLabel from './common/ResumeLabel';
import ProgressChecklist from './common/ProgressChecklist';
import ProgressBar from './ui/ProgressBar';
import useScoring from '../hooks/useScoring';
import useTheme from '../hooks/useTheme';
import { formatLocation, formatDistance, formatPostedAgo, formatKeyword } from '../utils/formatters';

const ScoringScreen = ({ appState, updateAppState, navigateTo }) => {
  const { theme } = useTheme();
  const [resumeFile, setResumeFile] = useState({
    name: appState.resume || 'Default Resume.pdf',
    file: null,
    isDefault: appState.resume === 'Default Resume.pdf'
  });
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);

  // Use custom hook for scoring logic
  const { scoredJobs, scoringSteps, scoringError } = useScoring(
    appState.selectedJobs, 
    updateAppState, 
    navigateTo,
    {
      onProgressUpdate: (status) => {
        // Update progress based on backend status with proper distribution (5% to 95%)
        if (status.progress !== undefined) {
          // Map backend progress (0-100) to frontend progress (5-95)
          const mappedProgress = 5 + (status.progress * 0.9); // 5% to 95%
          setProgress(mappedProgress);
        }
        
        // Map progress to extraction steps (more accurate for dark mode)
        let stepIndex = 0;
        if (status.progress >= 10) stepIndex = 1;  // Downloading pages
        if (status.progress >= 30) stepIndex = 2;  // Converting to markdown
        if (status.progress >= 60) stepIndex = 3;  // ChatGPT extraction
        if (status.progress >= 90) stepIndex = 4;  // Compiling results
        
        setCurrentStep(stepIndex);
      },
      onComplete: () => {
        // Jump to 100% after half second delay
        setTimeout(() => {
          setProgress(100);
          setCurrentStep(4); // All steps completed
        }, 500);
      },
      onError: (error) => {
        setError(error);
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

  // Handle scoring errors
  useEffect(() => {
    if (scoringError) {
      setError(scoringError);
    }
  }, [scoringError]);

  const handleStop = () => {
    navigateTo('searched');
  };

  // Define extraction steps
  const extractionSteps = [
    { id: 1, text: '📥 Downloading Job Pages', status: 'pending' },
    { id: 2, text: '📄 Converting to Markdown', status: 'pending' },
    { id: 3, text: '🤖 Extracting Data with ChatGPT', status: 'pending' },
    { id: 4, text: '📊 Compiling Results', status: 'pending' }
  ];

  // Update step statuses based on current step
  const updatedSteps = extractionSteps.map((step, index) => {
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

export default ScoringScreen; 
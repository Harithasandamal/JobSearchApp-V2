import React, { useState, useEffect } from 'react';
import ResumeLabel from './common/ResumeLabel';
import ProgressChecklist from './common/ProgressChecklist';
import ProgressBar from './ui/ProgressBar';
import useScoring from '../hooks/useScoring';
import { formatLocation, formatDistance, formatPostedAgo, formatKeyword } from '../utils/formatters';

const ScoringScreen = ({ appState, updateAppState, navigateTo }) => {
  const [resumeFile, setResumeFile] = useState({
    name: appState.resume || 'Shamalka Resume v2.pdf',
    file: null,
    isDefault: appState.resume === 'Shamalka Resume v2.pdf' || appState.resume === 'Default Resume.pdf'
  });

  // Use custom hook for scoring logic
  const { progress, currentStep, scoredJobs, scoringSteps, error, setError } = useScoring(
    appState.selectedJobs, 
    updateAppState, 
    navigateTo,
    resumeFile
  );

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
        <div className="stage-label">
          {appState.jobsFound.length} Jobs Found.
        </div>

        <div className="stage-label">
          Scoring
        </div>

        <button className="btn btn-warning" disabled>
          Scoring in Progress...
        </button>

        <div className="nav-buttons">
          <button className="btn btn-danger" onClick={handleStop}>
            Stop Scoring
          </button>
        </div>
      </div>

      <div className="right-panel">
        <div className="screen-header">
          Scoring: {appState.selectedJobs?.length || 0} of {formatKeyword(appState.keyword)} Jobs in {formatDistance(appState.distance)} from {formatLocation(appState.location)}, Posted within last {formatPostedAgo(appState.postedAgo)}
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
        
        <ProgressChecklist items={scoringSteps} />
        
        <ProgressBar 
          progress={progress}
          currentStep={currentStep}
          steps={scoringSteps}
        />
      </div>
    </>
  );
};

export default ScoringScreen; 
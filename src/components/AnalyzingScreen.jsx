import React, { useState, useEffect } from 'react';
import { useScoring } from '../hooks/useScoring';
import { formatLocation, formatDistance, formatPostedAgo } from '../utils/formatters';
import ResumeLabel from './common/ResumeLabel';
import ProgressChecklist from './common/ProgressChecklist';
import ProgressBar from './ui/ProgressBar';

const AnalyzingScreen = ({ appState, updateAppState, navigateTo }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(5); // Start at 5%
  const [error, setError] = useState(null);
  const [resumeFile, setResumeFile] = useState({ name: 'Default Resume.pdf', file: null, isDefault: true });

  // Mock progress simulation for analyzing screen
  useEffect(() => {
    const analyzeSteps = [
      { step: 1, progress: 20, text: 'Analyzing Job Requirements', delay: 1000 },
      { step: 2, progress: 40, text: 'Matching Skills & Experience', delay: 1500 },
      { step: 3, progress: 60, text: 'Calculating Compatibility Scores', delay: 2000 },
      { step: 4, progress: 80, text: 'Generating Detailed Analysis', delay: 1500 },
      { step: 5, progress: 95, text: 'Finalizing Results', delay: 1000 }
    ];

    let currentStepIndex = 0;
    const totalSteps = analyzeSteps.length;

    const simulateProgress = () => {
      if (currentStepIndex < totalSteps) {
        const step = analyzeSteps[currentStepIndex];
        setCurrentStep(step.step);
        setProgress(step.progress);
        
        setTimeout(() => {
          currentStepIndex++;
          if (currentStepIndex < totalSteps) {
            simulateProgress();
          } else {
            // Complete the analysis
            setTimeout(() => {
              setProgress(100);
              setCurrentStep(5);
              // Navigate to analyzed screen after completion
              setTimeout(() => {
                navigateTo('analyzed');
              }, 500);
            }, 500);
          }
        }, step.delay);
      }
    };

    // Start the mock progress simulation
    simulateProgress();
  }, [navigateTo]);

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

  const handleStop = () => {
    navigateTo('scored');
  };

  // Define analysis steps
  const analysisSteps = [
    { id: 1, text: '🔍 Analyzing Job Requirements', status: 'pending' },
    { id: 2, text: '🎯 Matching Skills & Experience', status: 'pending' },
    { id: 3, text: '📊 Calculating Compatibility Scores', status: 'pending' },
    { id: 4, text: '📋 Generating Detailed Analysis', status: 'pending' },
    { id: 5, text: '✅ Finalizing Results', status: 'pending' }
  ];

  // Update step statuses based on current step
  const updatedSteps = analysisSteps.map((step, index) => {
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
            {appState.keyword || 'All jobs'}
          </div>
        </div>

        <div className="form-group">
          <div className="search-status-button">
            Analyzing Results...
          </div>
        </div>

        <div className="form-group">
          <button className="stop-button" onClick={handleStop}>
            Stop
          </button>
        </div>
      </div>

      <div className="right-panel">
        <div className="search-header">
          Analyzing: Job Compatibility & Requirements
        </div>

        {error && (
          <div className="error-banner">
            Error: {error}
          </div>
        )}

        <div className="progress-section">
          <ProgressChecklist steps={updatedSteps} />
          <ProgressBar progress={progress} />
          <div className="progress-text">
            {progress}% Complete - {updatedSteps[currentStep]?.text || 'Initializing...'}
          </div>
        </div>
      </div>
    </>
  );
};

export default AnalyzingScreen; 
import React, { useState, useEffect } from 'react';
import ProgressChecklist from './common/ProgressChecklist';
import ResumeLabel from './common/ResumeLabel';
import useTheme from '../hooks/useTheme';
import { formatLocation, formatDistance, formatPostedAgo, formatKeyword } from '../utils/formatters';

const AnalyzingScreen = ({ appState, updateAppState, navigateTo }) => {
  const { theme } = useTheme();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisData, setAnalysisData] = useState(null);
  const [resumeFile, setResumeFile] = useState({
    name: appState.resume || 'Shamalka Resume v2.pdf',
    file: null,
    isDefault: appState.resume === 'Shamalka Resume v2.pdf' || appState.resume === 'Default Resume.pdf'
  });
  const [analyzingSteps, setAnalyzingSteps] = useState([
    { id: 1, text: 'Resume-Job Compatibility', status: 'completed' },
    { id: 2, text: 'Gap-Analysis and Transferrable Skills ...', status: 'pending' },
    { id: 3, text: 'Company research for history and background ...', status: 'pending' },
    { id: 4, text: 'Recruiter Details ...', status: 'pending' },
    { id: 5, text: 'Finalizing Report ...', status: 'pending' }
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

  // Simulate successive analyzing progress
  useEffect(() => {
    const stepDurations = [2000, 3500, 3000, 2500, 1500]; // Duration for each step in ms
    const stepProgress = [20, 40, 60, 80, 100]; // Progress percentage for each step
    
    let currentStepIndex = 0;
    
    const processStep = () => {
      if (currentStepIndex >= analyzingSteps.length) {
        // All steps completed, generate analysis data and navigate
        const demoAnalysisData = {
          jobTitle: appState.selectedJobForAnalysis?.title || 'Job Title',
          company: appState.selectedJobForAnalysis?.company || 'Company',
          location: appState.selectedJobForAnalysis?.location || 'Location',
          score: appState.selectedJobForAnalysis?.score || 85,
          analysis: {
            compatibility: 'High compatibility with your skills and experience',
            gaps: 'Minor gaps in specific technical skills',
            recommendations: 'Focus on highlighting relevant experience',
            companyInfo: 'Established company with good growth potential',
            recruiterInfo: 'Direct application recommended'
          }
        };
        setAnalysisData(demoAnalysisData);
        updateAppState({ analysisData: demoAnalysisData });
        navigateTo('analyzed');
        return;
      }

      // Start current step
      setCurrentStep(currentStepIndex);
      
      // Update step status to processing
      setAnalyzingSteps(prevSteps => {
        const newSteps = [...prevSteps];
        newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], status: 'processing' };
        return newSteps;
      });
      
      // Animate progress bar for this step
      const startProgress = currentStepIndex === 0 ? 0 : stepProgress[currentStepIndex - 1];
      const endProgress = stepProgress[currentStepIndex];
      const duration = stepDurations[currentStepIndex];
      const increment = (endProgress - startProgress) / (duration / 50); // Update every 50ms
      
      let currentProgress = startProgress;
      const progressInterval = setInterval(() => {
        currentProgress += increment;
        if (currentProgress >= endProgress) {
          currentProgress = endProgress;
          clearInterval(progressInterval);
          
          // Mark step as completed
          setAnalyzingSteps(prevSteps => {
            const newSteps = [...prevSteps];
            newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], status: 'completed' };
            return newSteps;
          });
          
          // Move to next step after a short delay
          setTimeout(() => {
            currentStepIndex++;
            processStep();
          }, 500);
        }
        setProgress(currentProgress);
      }, 50);
    };

    // Start the process
    processStep();
  }, [appState.selectedJobForAnalysis, navigateTo, updateAppState, analyzingSteps.length]);

  const handleStop = () => {
    navigateTo('scored');
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
          Analyzing
        </div>

        <div className="stage-label">
          {appState.scoredJobs.length} Jobs Scored
        </div>

        <button className="btn btn-warning" disabled>
          Analyzing ...
        </button>

        <div className="nav-buttons">
          <button className="btn btn-danger" onClick={handleStop}>
            Stop
          </button>
        </div>
      </div>

      <div className="right-panel">
        <div className="screen-header">
          {theme === 'light' ? 
            'Analyzing: Test Job' : 
            `Analyzing: ${appState.selectedJobForAnalysis?.title || 'Job'} at ${appState.selectedJobForAnalysis?.company || 'Company'}`
          }
        </div>

        <ProgressChecklist items={analyzingSteps} />
        
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <span style={{ color: '#666' }}>
            {Math.round(progress)}% Complete - {analyzingSteps[currentStep]?.text || 'Initializing...'}
          </span>
        </div>
      </div>
    </>
  );
};

export default AnalyzingScreen; 
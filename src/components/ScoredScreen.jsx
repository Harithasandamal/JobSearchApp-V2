import React, { useState, useEffect, useCallback } from 'react';
import ResumeUpload from './ResumeUpload';
import JobTable from './ui/JobTable';
import AnalysisGrid from './ui/AnalysisGrid';
import useJobSelection from '../hooks/useJobSelection';
import useTheme from '../hooks/useTheme';
import { formatLocation, formatDistance, formatPostedAgo, formatKeyword } from '../utils/formatters';

const ScoredScreen = ({ appState, updateAppState, navigateTo }) => {
  const { theme } = useTheme();
  const [resumeFile, setResumeFile] = useState({
    name: appState.resume || 'Default Resume.pdf',
    file: null,
    isDefault: appState.resume === 'Default Resume.pdf'
  });

  // Use custom hook for job selection logic
  const { selectedJobId, selectedJob, handleJobSelection } = useJobSelection(appState.scoredJobs);

  // Handle job updates from AnalysisGrid
  const handleJobUpdate = useCallback((updatedJob) => {
    if (updatedJob && appState.scoredJobs) {
      const updatedJobs = appState.scoredJobs.map(job => 
        job.id === updatedJob.id ? updatedJob : job
      );
      updateAppState({ scoredJobs: updatedJobs });
    }
  }, [appState.scoredJobs, updateAppState]);

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
  
  // Debug: Log all scored jobs and selected job analysis
  useEffect(() => {
    console.log('🟢 ScoredScreen - All scored jobs:', appState.scoredJobs);
    if (selectedJob) {
      console.log('🟢 ScoredScreen - Selected job analysis:', selectedJob);
    }
  }, [appState.scoredJobs, selectedJob]);

  const handleJobClick = useCallback((jobUrl) => {
    if (jobUrl) {
      window.open(jobUrl, '_blank');
    }
  }, []);

  const handleAnalyzeJob = () => {
    updateAppState({ selectedJobForAnalysis: selectedJob });
    navigateTo('analyzing');
  };

  const handleBack = () => {
    navigateTo('searched');
  };

  const handleNext = () => {
    // This would typically go to a different screen, but for demo we'll go to analyzing
    handleAnalyzeJob();
  };

  const handleExit = () => {
    window.close();
  };

  return (
    <>
      <div className="left-panel">
        {/* Resume Section */}
        <div className="form-group">
          <ResumeUpload 
            resumeFile={resumeFile} 
            setResumeFile={setResumeFile}
            scoringLocked={false}
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
        <div className="stage-label">
          {appState.jobsFound.length} Jobs Found.
        </div>

        <div className="stage-label">
          {appState.scoredJobs.length} Jobs Extracted
        </div>

        <button 
          className="btn btn-warning"
          disabled={!selectedJobId}
          onClick={handleAnalyzeJob}
        >
          Analyze Job
        </button>

        <div className="nav-buttons">
          <button className="btn" onClick={handleBack}>
            Back
          </button>
          <button className="btn btn-primary" onClick={handleNext}>
            Next
          </button>
          <button className="btn btn-danger" onClick={handleExit}>
            Exit
          </button>
        </div>
      </div>

      <div className="right-panel">
        <div className="screen-header">
          {theme === 'light' ? 
            `Extracted: ${appState.scoredJobs?.length || 0} Test Jobs` : 
            `Extracted: ${appState.scoredJobs?.length || 0} of ${formatKeyword(appState.keyword)} Jobs in ${formatDistance(appState.distance)} from ${formatLocation(appState.location)}, Posted within last ${formatPostedAgo(appState.postedAgo)}`
          }
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)', gap: '0px' }}>
          {/* Fixed height table section - maximum 5 rows */}
          <div style={{ 
            width: '100%', 
            height: '300px', // Optimized height for 5 rows
            flexShrink: 0 
          }}>
            <JobTable 
              jobs={appState.scoredJobs}
              selectedJobId={selectedJobId}
              onJobSelection={handleJobSelection}
              onJobClick={handleJobClick}
            />
          </div>

          {/* Analysis grid takes remaining space */}
          <div style={{ 
            flex: 1, 
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            marginTop: '0px'
          }}>
            <AnalysisGrid selectedJob={selectedJob} onJobUpdate={handleJobUpdate} />
          </div>
        </div>
      </div>
    </>
  );
};

export default ScoredScreen; 
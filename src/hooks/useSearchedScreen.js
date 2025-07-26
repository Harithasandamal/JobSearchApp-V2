import { useState, useEffect } from 'react';

const useSearchedScreen = ({ appState, updateAppState, navigateTo }) => {
  const [selectedJobs, setSelectedJobs] = useState([]); // No selection by default
  const [resumeFile, setResumeFile] = useState({
    name: appState.resume || 'Shamalka Resume v2.pdf',
    file: null,
    isDefault: appState.resume === 'Shamalka Resume v2.pdf' || appState.resume === 'Default Resume.pdf'
  });

  // Keep resumeFile in sync with appState.resume
  useEffect(() => {
    if (appState.resume && appState.resume !== resumeFile.name) {
      if (appState.resume === 'Default Resume.pdf' || appState.resume === 'Shamalka Resume v2.pdf') {
        setResumeFile({ name: 'Shamalka Resume v2.pdf', file: null, isDefault: true });
      } else {
        setResumeFile({ name: appState.resume, file: null, isDefault: false });
      }
    }
  }, [appState.resume, resumeFile.name]);

  // Debug: Log jobs data
  useEffect(() => {
    console.log('🔍 SearchedScreen - Jobs found:', appState.jobsFound);
    console.log('🔍 SearchedScreen - Jobs length:', appState.jobsFound?.length || 0);
    
    // Debug: Log first few job details for verification
    if (appState.jobsFound && appState.jobsFound.length > 0) {
      console.log('✅ Jobs successfully loaded in SearchedScreen:');
      appState.jobsFound.slice(0, 3).forEach((job, index) => {
        console.log(`📋 Job ${index + 1}:`);
        console.log(`   Title: ${job.title || 'NO TITLE'}`);
        console.log(`   Company: ${job.company || 'NO COMPANY'}`);
        console.log(`   Location: ${job.location || 'NO LOCATION'}`);
        console.log(`   Posted: ${job.postedAgo || 'NO POSTED AGO'}`);
        console.log(`   URL: ${job.url || 'NO URL'}`);
      });
    } else {
      console.log('⚠️ No jobs found in SearchedScreen');
    }
  }, [appState.jobsFound]);

  const handleJobSelection = (jobId) => {
    setSelectedJobs(prev => {
      if (prev.includes(jobId)) {
        return prev.filter(id => id !== jobId);
      } else {
        // Limit selection to 5 jobs maximum
        if (prev.length >= 5) {
          return prev;
        }
        return [...prev, jobId];
      }
    });
  };

  const handleScoreJobs = () => {
    const selectedJobData = appState.jobsFound.filter(job => selectedJobs.includes(job.id));
    updateAppState({ 
      selectedJobs: selectedJobData,
      analysisData: null,
      selectedJobForAnalysis: null
    });
    navigateTo('scoring');
  };

  const handleBack = () => {
    navigateTo('welcome');
  };

  const handleExit = () => {
    window.close();
  };

  // Defensive: Always treat jobsFound as an array
  const jobsFound = Array.isArray(appState.jobsFound) ? appState.jobsFound : [];

  return {
    selectedJobs,
    resumeFile,
    setResumeFile,
    jobsFound,
    handleJobSelection,
    handleScoreJobs,
    handleBack,
    handleExit
  };
};

export default useSearchedScreen; 
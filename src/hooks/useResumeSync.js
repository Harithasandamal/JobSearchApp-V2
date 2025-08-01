/**
 * Resume Sync Hook - Manages resume file synchronization with app state
 * Extracted from SearchingScreen.jsx for better maintainability
 */
import { useState, useEffect } from 'react';

const useResumeSync = (appState) => {
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

  return {
    resumeFile,
    setResumeFile
  };
};

export default useResumeSync;
/**
 * Resume Sync Hook - Manages resume file synchronization with app state
 * Extracted from SearchingScreen.jsx for better maintainability
 */
import { useState, useEffect } from 'react';

const useResumeSync = (appState) => {
  const [resumeFile, setResumeFile] = useState({
    name: appState.resume || 'Default Resume.pdf',
    file: null,
    isDefault: appState.resume === 'Default Resume.pdf'
  });

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

  return {
    resumeFile,
    setResumeFile
  };
};

export default useResumeSync;
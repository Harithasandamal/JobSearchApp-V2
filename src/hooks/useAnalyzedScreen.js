import { useState, useEffect } from 'react';

const useAnalyzedScreen = ({ appState, navigateTo }) => {
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

  const handleBack = () => {
    navigateTo('scored');
  };

  const handleExit = () => {
    window.close();
  };

  return {
    resumeFile,
    handleBack,
    handleExit
  };
};

export default useAnalyzedScreen; 
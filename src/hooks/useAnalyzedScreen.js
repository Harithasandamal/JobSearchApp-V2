import { useState, useEffect } from 'react';

const useAnalyzedScreen = ({ appState, navigateTo }) => {
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
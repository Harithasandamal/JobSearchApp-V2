import React from 'react';
import ProgressChecklist from './common/ProgressChecklist';
import ResumeUpload from './ResumeUpload';
import SearchParametersForm from './welcome/SearchParametersForm';
import SearchButton from './welcome/SearchButton';
import InstructionsPanel from './welcome/InstructionsPanel';
import useTheme from '../hooks/useTheme';
import useSystemStatus from '../hooks/useSystemStatus';
import useWelcomeForm from '../hooks/useWelcomeForm';
import useSearchHandler from '../hooks/useSearchHandler';

const WelcomeScreen = ({ appState, updateAppState, navigateTo, searchLocked, scoringLocked, setThemeLocked }) => {
  const themeHook = useTheme();
  const { systemReady, welcomeChecklist } = useSystemStatus();
  
  // Manage resumeFile state in the main component
  const [resumeFile, setResumeFile] = React.useState({
    name: appState.resume || 'Shamalka Resume v2.pdf',
    file: null,
    isDefault: appState.resume === 'Shamalka Resume v2.pdf' || appState.resume === 'Default Resume.pdf' || !appState.resume
  });

  const { localState, handleInputChange, isFormValid } = useWelcomeForm({ 
    appState, 
    resumeFile,
    systemReady 
  });
  const { isSearching, handleSearchJobs } = useSearchHandler({ 
    updateAppState, 
    navigateTo, 
    setThemeLocked 
  });

  // Keep resumeFile in sync with appState.resume
  React.useEffect(() => {
    if (appState.resume && appState.resume !== resumeFile.name) {
      if (appState.resume === 'Default Resume.pdf' || appState.resume === 'Shamalka Resume v2.pdf') {
        setResumeFile({ name: 'Shamalka Resume v2.pdf', file: null, isDefault: true });
      } else {
        setResumeFile({ name: appState.resume, file: null, isDefault: false });
      }
    }
  }, [appState.resume, resumeFile.name]);

  // Synchronize theme state on component mount to ensure consistency
  React.useEffect(() => {
    const rootElement = document.documentElement;
    const domHasDarkClass = rootElement.classList.contains('dark-theme');
    const reactTheme = themeHook.theme;
    
    // If DOM and React state don't match, sync them
    if (domHasDarkClass && reactTheme === 'light') {
      console.log('🔄 Syncing: DOM is dark but React thinks light - updating React to dark');
      themeHook.setTheme('dark');
    } else if (!domHasDarkClass && reactTheme === 'dark') {
      console.log('🔄 Syncing: DOM is light but React thinks dark - updating React to light');
      themeHook.setTheme('light');
    }
  }, [themeHook]);

  const handleSearch = () => {
    handleSearchJobs(localState);
  };

  return (
    <div className="screen-container">
      <div className="left-panel">
        {/* Resume Section */}
        <div className="form-group">
          <ResumeUpload
            resumeFile={resumeFile}
            setResumeFile={setResumeFile}
            scoringLocked={scoringLocked}
            updateAppState={updateAppState}
          />
        </div>

        {/* Search Parameters */}
        <SearchParametersForm
          localState={localState}
          handleInputChange={handleInputChange}
          searchLocked={searchLocked}
        />

        {/* Action Buttons */}
        <SearchButton
          isFormValid={isFormValid}
          searchLocked={searchLocked}
          isSearching={isSearching}
          handleSearchJobs={handleSearch}
        />

        <div className="nav-buttons">
          <button className="btn btn-danger" onClick={() => window.close()}>
            Exit
          </button>
        </div>
      </div>

      <div className="right-panel">
        <div className="screen-header">
          Welcome: Automated Job Search Application
        </div>
        <ProgressChecklist items={welcomeChecklist} />
        <InstructionsPanel />
      </div>
    </div>
  );
};

export default WelcomeScreen; 
import React from 'react';
import ResumeLabel from './common/ResumeLabel';
import SearchParametersDisplay from './searched/SearchParametersDisplay';
import AnalysisColumns from './analyzed/AnalysisColumns';
import AnalyzedStatusDisplay from './analyzed/AnalyzedStatusDisplay';
import AnalyzedActionButtons from './analyzed/AnalyzedActionButtons';
import useAnalyzedScreen from '../hooks/useAnalyzedScreen';
import useTheme from '../hooks/useTheme';

const AnalyzedScreen = ({ appState, updateAppState, navigateTo }) => {
  const { theme } = useTheme();
  const { resumeFile, handleBack, handleExit } = useAnalyzedScreen({ 
    appState, 
    navigateTo 
  });
  
  const analysisData = appState.analysisData;

  return (
    <>
      <div className="left-panel">
        {/* Resume Section */}
        <div className="form-group">
          <ResumeLabel resumeFile={resumeFile} />
        </div>

        {/* Search Parameters Display */}
        <SearchParametersDisplay appState={appState} />

        {/* Status Display */}
        <AnalyzedStatusDisplay appState={appState} />

        {/* Action Buttons */}
        <AnalyzedActionButtons
          analysisData={analysisData}
          handleBack={handleBack}
          handleExit={handleExit}
        />
      </div>

      <div className="right-panel">
        <div className="screen-header">
          {theme === 'light' ? 
            'Analyzed: Test Job' : 
            `Analyzed: ${analysisData?.jobTitle || 'Job'} at ${analysisData?.company || 'Company'}`
          }
        </div>
        
        <AnalysisColumns analysisData={analysisData} />
      </div>
    </>
  );
};

export default AnalyzedScreen; 
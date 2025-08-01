import React from 'react';
import ResumeUpload from './ResumeUpload';
import SearchParametersDisplay from './searched/SearchParametersDisplay';
import JobsTable from './searched/JobsTable';
import JobStatusIndicator from './searched/JobStatusIndicator';
import SearchActionButtons from './searched/SearchActionButtons';
import useSearchedScreen from '../hooks/useSearchedScreen';
import useTheme from '../hooks/useTheme';
import { formatLocation, formatDistance, formatPostedAgo, formatKeyword } from '../utils/formatters';

const SearchedScreen = ({ appState, updateAppState, navigateTo, scoringLocked }) => {
  const { theme } = useTheme();
  const {
    selectedJobs,
    resumeFile,
    setResumeFile,
    jobsFound,
    handleJobSelection,
    handleScoreJobs,
    handleBack,
    handleExit
  } = useSearchedScreen({ appState, updateAppState, navigateTo });

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

        {/* Search Parameters Display */}
        <SearchParametersDisplay appState={appState} />

        {/* Job Status and Action Buttons */}
        <JobStatusIndicator jobCount={jobsFound.length} />
        
        <SearchActionButtons
          selectedJobsCount={selectedJobs.length}
          handleScoreJobs={handleScoreJobs}
          handleBack={handleBack}
          handleExit={handleExit}
        />
      </div>

      <div className="right-panel">
        <div className="screen-header">
          {theme === 'light' ? 
            'Searched: Test Jobs' : 
            `Searched: ${formatKeyword(appState.keyword)} Jobs in ${formatDistance(appState.distance)} from ${formatLocation(appState.location)}, Posted within last ${formatPostedAgo(appState.postedAgo)}`
          }
        </div>
        
        <div className="table-container">
          <JobsTable
            jobsFound={jobsFound}
            selectedJobs={selectedJobs}
            handleJobSelection={handleJobSelection}
          />
        </div>
      </div>
    </div>
  );
};

export default SearchedScreen; 
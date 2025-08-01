import React from 'react';
import useWorkflowLogger from '../../hooks/useWorkflowLogger';
import useTheme from '../../hooks/useTheme';

const SearchButton = ({ 
  isFormValid, 
  searchLocked, 
  isSearching, 
  handleSearchJobs 
}) => {
  const workflowLogger = useWorkflowLogger();
  const { theme } = useTheme();
  
  const isLightModeTest = theme === 'light';

  const handleClick = () => {
    const action = isLightModeTest ? 'Test Sample Jobs' : 'Search Jobs';
    workflowLogger.logButtonClick(action, `User initiated ${isLightModeTest ? 'test mode' : 'real search'}`);
    handleSearchJobs();
  };

  const getButtonText = () => {
    if (isSearching) {
      return isLightModeTest ? 'Loading Sample Jobs...' : 'Starting Search...';
    }
    return isLightModeTest ? 'Test Sample Jobs' : 'Search Jobs';
  };

  return (
    <button
      className={`btn ${isLightModeTest ? 'btn-info' : 'btn-success'}`}
      disabled={!isFormValid() || searchLocked || isSearching}
      onClick={handleClick}
      title={isLightModeTest ? 'Load 3 sample jobs for testing' : 'Search real jobs from SEEK'}
    >
      {getButtonText()}
    </button>
  );
};

export default SearchButton; 
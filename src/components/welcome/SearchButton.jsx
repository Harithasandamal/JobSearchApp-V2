import React from 'react';
import useWorkflowLogger from '../../hooks/useWorkflowLogger';

const SearchButton = ({ 
  isFormValid, 
  searchLocked, 
  isSearching, 
  handleSearchJobs 
}) => {
  const workflowLogger = useWorkflowLogger();

  const handleClick = () => {
    workflowLogger.logButtonClick('Search Jobs', 'User initiated job search');
    handleSearchJobs();
  };

  return (
    <button 
      className="btn btn-success"
      disabled={!isFormValid() || searchLocked || isSearching}
      onClick={handleClick}
    >
      {isSearching ? 'Starting Search...' : 'Search Jobs'}
    </button>
  );
};

export default SearchButton; 
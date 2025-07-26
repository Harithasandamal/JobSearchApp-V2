import React from 'react';

const SearchButton = ({ 
  isFormValid, 
  searchLocked, 
  isSearching, 
  handleSearchJobs 
}) => {
  return (
    <button 
      className="btn btn-success"
      disabled={!isFormValid() || searchLocked || isSearching}
      onClick={handleSearchJobs}
    >
      {isSearching ? 'Starting Search...' : 'Search Jobs'}
    </button>
  );
};

export default SearchButton; 
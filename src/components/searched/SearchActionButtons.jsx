import React from 'react';

const SearchActionButtons = ({ 
  selectedJobsCount, 
  handleScoreJobs, 
  handleBack, 
  handleExit 
}) => {
  return (
    <>
      {/* Score Jobs Button */}
      <button 
        className="btn btn-primary"
        disabled={selectedJobsCount === 0}
        onClick={handleScoreJobs}
      >
        Score Jobs
      </button>

      {/* Navigation Buttons */}
      <div className="nav-buttons">
        <button className="btn" onClick={handleBack}>
          Back
        </button>
        <button className="btn btn-primary" onClick={handleScoreJobs}>
          Next
        </button>
        <button className="btn btn-danger" onClick={handleExit}>
          Exit
        </button>
      </div>
    </>
  );
};

export default SearchActionButtons; 
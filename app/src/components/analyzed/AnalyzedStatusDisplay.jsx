import React from 'react';

const AnalyzedStatusDisplay = ({ appState }) => {
  return (
    <>
      <div className="stage-label">
        {appState.jobsFound.length} Jobs Found.
      </div>

      <div className="stage-label">
        {appState.scoredJobs.length} Jobs Scored
      </div>

      <div className="stage-label">
        Job Analyzed
      </div>
    </>
  );
};

export default AnalyzedStatusDisplay; 
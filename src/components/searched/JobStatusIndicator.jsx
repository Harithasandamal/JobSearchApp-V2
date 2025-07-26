import React from 'react';

const JobStatusIndicator = ({ jobCount }) => {
  return (
    <div className="stage-label">
      {jobCount} Jobs Found
    </div>
  );
};

export default JobStatusIndicator; 
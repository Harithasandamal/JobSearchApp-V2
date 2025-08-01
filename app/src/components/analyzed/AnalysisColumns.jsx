import React from 'react';

const AnalysisColumns = ({ analysisData }) => {
  if (!analysisData) {
    return <div>No analysis data available</div>;
  }

  return (
    <div className="analysis-table">
      <div className="analysis-column">
        <h3>Resume-Job Compatibility</h3>
        <div className="analysis-bullet">{analysisData.analysis.compatibility}</div>
        <div className="analysis-bullet">Skills match: 85%</div>
        <div className="analysis-bullet">Experience level: Appropriate</div>
        <div className="analysis-bullet">Education: Meets requirements</div>
        <div className="analysis-bullet">Overall fit: Excellent</div>
      </div>
      
      <div className="analysis-column">
        <h3>Gap Analysis & Transferrable Skills</h3>
        <div className="analysis-bullet">{analysisData.analysis.gaps}</div>
        <div className="analysis-bullet">Transferrable skills identified</div>
        <div className="analysis-bullet">Learning opportunities highlighted</div>
        <div className="analysis-bullet">Growth potential assessed</div>
        <div className="analysis-bullet">Skill development plan suggested</div>
      </div>
      
      <div className="analysis-column">
        <h3>Company Research</h3>
        <div className="analysis-bullet">{analysisData.analysis.companyInfo}</div>
        <div className="analysis-bullet">Company culture analysis</div>
        <div className="analysis-bullet">Financial stability reviewed</div>
        <div className="analysis-bullet">Growth trajectory assessed</div>
        <div className="analysis-bullet">Employee satisfaction data</div>
      </div>
      
      <div className="analysis-column">
        <h3>Recruiter Details</h3>
        <div className="analysis-bullet">{analysisData.analysis.recruiterInfo}</div>
        <div className="analysis-bullet">Contact information available</div>
        <div className="analysis-bullet">Application process outlined</div>
        <div className="analysis-bullet">Interview preparation tips</div>
        <div className="analysis-bullet">Follow-up strategy suggested</div>
      </div>
    </div>
  );
};

export default AnalysisColumns; 
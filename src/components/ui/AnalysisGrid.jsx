import React, { memo } from 'react';

const AnalysisGrid = ({ selectedJob }) => {
  if (!selectedJob) {
    return (
      <div style={{ flex: 1, textAlign: 'center', padding: '20px', color: '#666' }}>
        Select a job to view analysis
      </div>
    );
  }

  // New: Use the prioritized requirements and matched/missing fields
  const mandatory = selectedJob.mandatory || [];
  const preferred = selectedJob.preferred || [];
  const responsibilities = selectedJob.responsibilities || [];
  const mandatoryMatches = selectedJob.mandatoryMatches || [];
  const preferredMatches = selectedJob.preferredMatches || [];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ 
        marginBottom: '15px', 
        color: 'var(--text-primary)',
        fontSize: '18px',
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '10px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '5px',
        border: '1px solid var(--border-color)',
        flexShrink: 0
      }}>
        {selectedJob.title}, {selectedJob.location}, {selectedJob.company}
      </h3>
      <div className="analysis-grid" style={{
        flex: 1,
        minHeight: 0,
        marginBottom: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px'
      }}>
        {/* Left: Job Requirements */}
        <div className="analysis-column">
          <h4 style={{ 
            color: 'var(--accent-color)', 
            marginBottom: '15px', 
            fontSize: '16px',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '8px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            minHeight: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            Requirements (Mandatory + Preferred)
          </h4>
          <div style={{ flex: 1, overflow: 'auto', paddingRight: '5px' }}>
            {/* Mandatory Requirements */}
            {mandatory.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>Mandatory:</div>
                {mandatory.map((item, idx) => (
                  <div key={idx} className="analysis-bullet" style={{
                    marginBottom: '8px',
                    paddingLeft: '15px',
                    position: 'relative',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ marginRight: 6 }}>
                      {mandatoryMatches[idx] === true ? '✅' : '❌'}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            )}
            {/* Preferred Requirements */}
            {preferred.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>Preferred:</div>
                {preferred.map((item, idx) => (
                  <div key={idx} className="analysis-bullet" style={{
                    marginBottom: '8px',
                    paddingLeft: '15px',
                    position: 'relative',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ marginRight: 6 }}>
                      {preferredMatches[idx] === true ? '✅' : '❌'}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            )}
            {mandatory.length === 0 && preferred.length === 0 && (
              <div className="analysis-bullet" style={{ 
                marginBottom: '12px',
                paddingLeft: '15px',
                position: 'relative',
                fontSize: '14px',
                lineHeight: '1.4',
                color: 'var(--text-secondary)',
                fontStyle: 'italic'
              }}>
                No requirements found
              </div>
            )}
          </div>
        </div>
        {/* Right: Job Responsibilities */}
        <div className="analysis-column">
          <h4 style={{ 
            color: 'var(--accent-color)', 
            marginBottom: '15px', 
            fontSize: '16px',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '8px',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '4px',
            border: '1px solid var(--border-color)',
            minHeight: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            Job Responsibilities
          </h4>
          <div style={{ flex: 1, overflow: 'auto', paddingRight: '5px' }}>
            {responsibilities.length > 0 ? (
              responsibilities.map((item, index) => (
                <div key={index} className="analysis-bullet" style={{ 
                  marginBottom: '12px',
                  paddingLeft: '15px',
                  position: 'relative',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}>
                  {item}
                </div>
              ))
            ) : (
              <div className="analysis-bullet" style={{ 
                marginBottom: '12px',
                paddingLeft: '15px',
                position: 'relative',
                fontSize: '14px',
                lineHeight: '1.4',
                color: 'var(--text-secondary)',
                fontStyle: 'italic'
              }}>
                No responsibilities found
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Overall compatibility score at bottom */}
      {(selectedJob.compatibilityScore || selectedJob.score) && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: 'var(--success-color)',
          color: 'white',
          borderRadius: '8px',
          textAlign: 'center',
          border: '2px solid var(--success-color)',
          fontWeight: 'bold',
          fontSize: '16px',
          flexShrink: 0,
          marginTop: 'auto'
        }}>
          Overall Compatibility Score: {selectedJob.compatibilityScore || selectedJob.score}%
        </div>
      )}
    </div>
  );
};

export default memo(AnalysisGrid); 
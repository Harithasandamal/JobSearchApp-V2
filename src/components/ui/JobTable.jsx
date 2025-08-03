import React, { memo } from 'react';

const JobTable = ({ 
  jobs, 
  selectedJobId, 
  onJobSelection, 
  onJobClick 
}) => {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="table-container" style={{ height: '300px', marginBottom: '0', flexShrink: 0, width: '100%' }}>
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
          No jobs available
        </div>
      </div>
    );
  }

  // Helper function to truncate text with ellipsis
  const truncateText = (text, maxLength = 50) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="table-container" style={{ height: '300px', marginBottom: '0', flexShrink: 0, width: '100%' }}>
      <table className="table" style={{ width: '100%', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style={{ width: '50px' }}>Select</th>
            <th>Job Title</th>
            <th>Location</th>
            <th>Company</th>
            <th>Posted Ago</th>
            <th>Compatibility Score</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, index) => (
            <tr 
              key={`job-${job.id}-${index}`} 
              style={{ 
                backgroundColor: selectedJobId === job.id ? '#2563eb' : 'transparent',
                color: selectedJobId === job.id ? '#ffffff' : 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onClick={() => onJobSelection(job.id)}
              onMouseEnter={(e) => {
                if (selectedJobId !== job.id) {
                  e.target.parentElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedJobId !== job.id) {
                  e.target.parentElement.style.backgroundColor = 'transparent';
                }
              }}
            >
              <td style={{ textAlign: 'center' }}>
                <input
                  type="radio"
                  className="radio"
                  name="selectedJob"
                  checked={selectedJobId === job.id}
                  onChange={() => onJobSelection(job.id)}
                />
              </td>
              <td>
                <span 
                  className="job-link" 
                  style={{ 
                    cursor: 'pointer', 
                    color: selectedJobId === job.id ? '#ffffff' : 'var(--accent-color)', 
                    textDecoration: selectedJobId === job.id ? 'underline' : 'underline',
                    display: 'inline-block',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'middle',
                    fontWeight: selectedJobId === job.id ? 'bold' : 'normal'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onJobClick(job.url);
                  }}
                  title={job.title || 'Click to view job on SEEK'}
                >
                  {truncateText(job.title, 50)}
                </span>
              </td>
              <td style={{
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }} title={job.location}>
                {truncateText(job.location, 20)}
              </td>
              <td style={{
                maxWidth: '150px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }} title={job.company}>
                {truncateText(job.company, 25)}
              </td>
              <td>
                {job.postedAgo === 'Featured' ? (
                  <span style={{
                    backgroundColor: '#ffc107',
                    color: '#000',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    Featured
                  </span>
                ) : (
                  job.postedAgo || 'N/A'
                )}
              </td>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                <span style={{
                  backgroundColor: job.compatibilityScore >= 80 ? '#28a745' : 
                                  job.compatibilityScore >= 60 ? '#ffc107' : '#dc3545',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {job.compatibilityScore || job.score || 0}
                </span>
              </td>
            </tr>
          ))}
          {/* Add empty rows to always show 5 total rows */}
          {Array.from({ length: Math.max(0, 5 - jobs.length) }, (_, index) => (
            <tr key={`empty-${index}`} style={{ height: '40px' }}>
              <td style={{ border: 'none' }}></td>
              <td style={{ border: 'none' }}></td>
              <td style={{ border: 'none' }}></td>
              <td style={{ border: 'none' }}></td>
              <td style={{ border: 'none' }}></td>
              <td style={{ border: 'none' }}></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default memo(JobTable); 
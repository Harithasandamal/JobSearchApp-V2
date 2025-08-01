import React, { memo } from 'react';

const JobTable = ({ 
  jobs, 
  selectedJobId, 
  onJobSelection, 
  onJobClick 
}) => {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="table-container" style={{ height: '200px', marginBottom: '0', flexShrink: 0, width: '100%' }}>
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
    <div className="table-container" style={{ height: '200px', marginBottom: '0', flexShrink: 0, width: '100%' }}>
      <table className="table" style={{ width: '100%', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th>Job Title</th>
            <th>Location</th>
            <th>Company</th>
            <th>Posted Ago</th>
            <th>Requirements</th>
            <th>Responsibilities</th>
            <th>Score %</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, index) => (
            <tr 
              key={`job-${job.id}-${index}`} 
              style={{ 
                backgroundColor: selectedJobId === job.id ? 'var(--accent-color)' : 'transparent',
                color: selectedJobId === job.id ? 'white' : 'var(--text-primary)'
              }}
            >
              <td>
                <input
                  type="radio"
                  className="radio"
                  name="selectedJob"
                  checked={selectedJobId === job.id}
                  onChange={() => onJobSelection(job.id)}
                />
                <span 
                  className="job-link" 
                  style={{ 
                    cursor: 'pointer', 
                    color: selectedJobId === job.id ? 'white' : 'var(--accent-color)', 
                    textDecoration: 'underline',
                    display: 'inline-block',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'middle'
                  }}
                  onClick={() => onJobClick(job.url)}
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
              <td title={
                [...(job.mandatory || []), ...(job.preferred || [])].join(', ')
              }>
                {(() => {
                  const reqs = [...(job.mandatory || []), ...(job.preferred || [])];
                  return reqs.length > 0 ? truncateText(reqs.slice(0, 10).join(', '), 60) : 'N/A';
                })()}
              </td>
              <td title={(job.responsibilities || []).join(', ')}>
                {job.responsibilities && job.responsibilities.length > 0 ? truncateText(job.responsibilities.slice(0, 10).join(', '), 60) : 'N/A'}
              </td>
              <td>{job.compatibilityScore || job.score || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default memo(JobTable); 
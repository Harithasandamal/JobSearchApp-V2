import React from 'react';

const JobsTable = ({ 
  jobsFound, 
  selectedJobs, 
  handleJobSelection 
}) => {
  // Helper function to truncate text with ellipsis
  const truncateText = (text, maxLength = 50) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!jobsFound || jobsFound.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px', 
        color: '#666',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
        border: '1px solid #dee2e6'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>
          {!jobsFound ? 'Loading jobs...' : 'No jobs found'}
        </div>
        <div style={{ fontSize: '14px' }}>
          {!jobsFound ? 'Please wait while we retrieve the search results.' : 'Try adjusting your search criteria.'}
        </div>
      </div>
    );
  }

  return (
    <table className="table" style={{ width: '100%', tableLayout: 'fixed' }}>
      <thead>
        <tr>
          <th>Job Title</th>
          <th>Company</th>
          <th>Location</th>
          <th>Posted Ago</th>
        </tr>
      </thead>
      <tbody>
        {jobsFound.map((job) => (
          <tr key={job.id}>
            <td>
              <input
                type="checkbox"
                className="checkbox"
                checked={selectedJobs.includes(job.id)}
                onChange={() => handleJobSelection(job.id)}
                disabled={!selectedJobs.includes(job.id) && selectedJobs.length >= 5}
              />
              {job.url ? (
                <a 
                  href={job.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="job-link"
                  style={{
                    display: 'inline-block',
                    maxWidth: '250px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'middle'
                  }}
                  onClick={() => {
                    console.log(`🔗 Clicked job URL: ${job.url}`);
                    console.log(`🔗 Job title: ${job.title}`);
                  }}
                  title={job.title || 'No Title'}
                >
                  {truncateText(job.title, 60)}
                </a>
              ) : (
                <span 
                  className="job-link"
                  style={{
                    display: 'inline-block',
                    maxWidth: '250px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    verticalAlign: 'middle'
                  }}
                  title={job.title || 'No Title'}
                >
                  {truncateText(job.title, 60)}
                </span>
              )}
            </td>
            <td style={{
              maxWidth: '150px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }} title={job.company || 'No Company'}>
              {truncateText(job.company, 25)}
            </td>
            <td style={{
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }} title={job.location || 'No Location'}>
              {truncateText(job.location, 20)}
            </td>
            <td>
              {job.postedAgo && job.postedAgo.includes('Featured') ? (
                <div>
                  <div style={{ fontSize: '12px', marginBottom: '2px' }}>
                    {job.postedAgo.replace(' (Featured)', '')}
                  </div>
                  <span style={{
                    backgroundColor: '#ffc107',
                    color: '#000',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    Featured
                  </span>
                </div>
              ) : job.postedAgo === 'Featured' ? (
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
                job.postedAgo || 'No Date'
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default JobsTable; 
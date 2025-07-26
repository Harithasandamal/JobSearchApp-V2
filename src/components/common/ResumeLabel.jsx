import React from 'react';
import defaultResume from '../../assets/Default Resume.pdf';

const ResumeLabel = ({ resumeFile }) => {
  const handleResumeClick = () => {
    if (resumeFile.isDefault) {
      window.open(defaultResume, '_blank');
    } else if (resumeFile.file) {
      const fileURL = URL.createObjectURL(resumeFile.file);
      window.open(fileURL, '_blank');
      setTimeout(() => URL.revokeObjectURL(fileURL), 1000 * 60);
    } else {
      alert('Resume file not available. Please re-upload.');
    }
  };

  return (
    <div className="resume-display">
      <div className="resume-info">
        <span
          className="resume-link"
          onClick={handleResumeClick}
          title="Click to view resume"
          style={{ cursor: 'pointer' }}
        >
          {resumeFile.name || 'No resume uploaded'}
        </span>
      </div>
    </div>
  );
};

export default ResumeLabel; 
import React, { useRef } from 'react';
import defaultResume from '../assets/Default Resume.pdf';

const ResumeUpload = ({ resumeFile, setResumeFile, scoringLocked, updateAppState }) => {
  const fileInputRef = useRef(null);

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (
        file.type === 'application/pdf' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.docx')
      ) {
        setResumeFile({
          name: file.name,
          file: file,
          isDefault: false
        });
        updateAppState({ resume: file.name });
      } else {
        alert('Please upload a PDF or DOCX file only.');
      }
    }
  };

  const handleRemoveResume = () => {
    setResumeFile({
      name: '',
      file: null,
      isDefault: false
    });
    updateAppState({ resume: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

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
        <button
          className="remove-resume-btn"
          onClick={handleRemoveResume}
          title="Remove resume"
          disabled={scoringLocked}
        >
          ✕
        </button>
      </div>
      <button className="btn btn-primary" onClick={handleUploadClick} disabled={scoringLocked}>
        Upload Resume
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleResumeUpload}
        style={{ display: 'none' }}
        disabled={scoringLocked}
      />
    </div>
  );
};

export default ResumeUpload; 
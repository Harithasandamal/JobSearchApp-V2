import React from 'react';
import PDFGenerator from './PDFGenerator';

const AnalyzedActionButtons = ({ 
  analysisData, 
  handleBack, 
  handleExit 
}) => {
  const handleDownloadPDF = () => {
    PDFGenerator.generateReport(analysisData);
  };

  return (
    <>
      <button 
        className="btn btn-primary"
        onClick={handleDownloadPDF}
        style={{ marginTop: '10px' }}
      >
        📄 Download Report
      </button>

      <div className="nav-buttons">
        <button className="btn" onClick={handleBack}>
          Back
        </button>
        <button className="btn btn-danger" onClick={handleExit}>
          Exit
        </button>
      </div>
    </>
  );
};

export default AnalyzedActionButtons; 
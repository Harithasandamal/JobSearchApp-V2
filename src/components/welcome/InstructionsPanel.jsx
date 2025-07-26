import React from 'react';

const InstructionsPanel = () => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginTop: '30px' }}>
      {/* Instructions Section - 60% of remaining space */}
      <div style={{ 
        flex: '0.6', 
        padding: '20px', 
        backgroundColor: 'var(--bg-secondary)', 
        borderRadius: '8px', 
        border: '1px solid var(--border-color)' 
      }}>
        <div className="welcome-instructions" style={{ color: 'var(--text-secondary)' }}>
          <div className="analysis-bullet">
            Upload your resume and configure search parameters (location, keywords, filters).
          </div>
          <div className="analysis-bullet">
            Initiate automated job search on SEEK.
          </div>
          <div className="analysis-bullet">
            Review and select relevant job opportunities from the search results.
          </div>
          <div className="analysis-bullet">
            Generate compatibility scores between your resume and selected positions.
          </div>
          <div className="analysis-bullet">
            Receive comprehensive analysis including gap assessment and application recommendations.
          </div>
        </div>
      </div>
      
      {/* Motivational Quote Section - 40% of remaining space */}
      <div style={{ 
        flex: '0.4', 
        padding: '20px', 
        backgroundColor: 'var(--accent-color)', 
        borderRadius: '8px', 
        border: '1px solid var(--accent-color)', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        textAlign: 'center' 
      }}>
        <div style={{ 
          fontSize: '40px', 
          fontStyle: 'italic', 
          color: 'white', 
          marginBottom: '8px', 
          fontWeight: 'bold' 
        }}>
          "Opportunities don't happen. You create them."
        </div>
        <div style={{ 
          fontSize: '18px', 
          color: 'white', 
          fontWeight: '500' 
        }}>
          — Chris Grosser
        </div>
      </div>
    </div>
  );
};

export default InstructionsPanel; 
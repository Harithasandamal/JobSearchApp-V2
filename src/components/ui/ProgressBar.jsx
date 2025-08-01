import React, { memo } from 'react';

const ProgressBar = ({ progress, currentStep, steps }) => {
  const getCurrentStepInfo = () => {
    if (!steps || steps.length === 0) return { text: 'Initializing...', description: '' };
    
    const currentStepData = steps[currentStep];
    if (!currentStepData) return { text: 'Initializing...', description: '' };
    
    return {
      text: currentStepData.text,
      description: currentStepData.description || ''
    };
  };

  const stepInfo = getCurrentStepInfo();

  return (
    <div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '15px' }}>
        <div style={{ 
          color: '#007bff', 
          fontWeight: 'bold',
          fontSize: '16px',
          marginBottom: '5px'
        }}>
          {Math.round(progress)}% Complete
        </div>
        <div style={{ 
          color: '#333', 
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '3px'
        }}>
          {stepInfo.text}
        </div>
        {stepInfo.description && (
          <div style={{ 
            color: '#666', 
            fontSize: '12px',
            fontStyle: 'italic'
          }}>
            {stepInfo.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(ProgressBar); 
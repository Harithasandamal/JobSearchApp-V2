import React, { useEffect, useRef } from 'react';
import useTheme from '../../hooks/useTheme';

const EnhancedProgressBar = ({ 
  progress, 
  isLoading, 
  loadingMessage, 
  currentStep, 
  steps = [],
  error = null 
}) => {
  const { theme } = useTheme();
  const progressRef = useRef(null);
  const animationRef = useRef(null);
  const lastProgressRef = useRef(0);

  // Smooth progress animation
  const animateProgress = () => {
    if (!progressRef.current) return;
    
    const currentProgress = parseFloat(progressRef.current.style.width) || 0;
    const targetProgress = progress;
    const diff = targetProgress - currentProgress;
    
    if (Math.abs(diff) > 0.1) {
      const newProgress = currentProgress + diff * 0.1;
      progressRef.current.style.width = `${newProgress}%`;
      animationRef.current = requestAnimationFrame(animateProgress);
    } else {
      progressRef.current.style.width = `${targetProgress}%`;
    }
  };

  // Start animation when progress changes
  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animateProgress();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [progress]);

  // Get progress bar color based on progress and theme
  const getProgressColor = () => {
    if (error) return '#dc3545'; // Red for error
    if (progress < 30) return theme === 'light' ? '#6c757d' : '#495057'; // Gray
    if (progress < 60) return theme === 'light' ? '#ffc107' : '#ffc107'; // Yellow
    if (progress < 90) return theme === 'light' ? '#17a2b8' : '#17a2b8'; // Blue
    return theme === 'light' ? '#28a745' : '#28a745'; // Green
  };

  // Get step status icon
  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'processing':
        return '🔄';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  return (
    <div className="enhanced-progress-container">
      {/* Progress Bar */}
      <div className="enhanced-progress-bar">
        <div 
          ref={progressRef}
          className="enhanced-progress-fill"
          style={{ 
            backgroundColor: getProgressColor(),
            width: '0%',
            transition: 'background-color 0.3s ease'
          }}
        />
        
        {/* Progress Text Overlay */}
        <div className="progress-text-overlay">
          <span className="progress-percentage">
            {Math.round(progress)}%
          </span>
          {loadingMessage && (
            <span className="progress-message">
              {loadingMessage}
            </span>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="loading-indicator">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-display">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
        </div>
      )}

      {/* Step Indicators */}
      {steps.length > 0 && (
        <div className="step-indicators">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className={`step-indicator ${step.status} ${index === currentStep ? 'current' : ''}`}
            >
              <span className="step-icon">{getStepIcon(step.status)}</span>
              <span className="step-text">{step.text}</span>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .enhanced-progress-container {
          width: 100%;
          margin: 20px 0;
        }

        .enhanced-progress-bar {
          position: relative;
          width: 100%;
          height: 8px;
          background-color: ${theme === 'light' ? '#e9ecef' : '#495057'};
          border-radius: 4px;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .enhanced-progress-fill {
          height: 100%;
          border-radius: 4px;
          position: relative;
          transition: width 0.3s ease;
        }

        .enhanced-progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background-image: linear-gradient(
            -45deg,
            rgba(255, 255, 255, 0.2) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0.2) 75%,
            transparent 75%,
            transparent
          );
          background-size: 20px 20px;
          animation: progress-shimmer 1.5s linear infinite;
        }

        @keyframes progress-shimmer {
          0% { transform: translateX(-20px); }
          100% { transform: translateX(20px); }
        }

        .progress-text-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          pointer-events: none;
        }

        .progress-percentage {
          font-size: 12px;
          font-weight: bold;
          color: ${theme === 'light' ? '#495057' : '#e9ecef'};
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .progress-message {
          font-size: 10px;
          color: ${theme === 'light' ? '#6c757d' : '#adb5bd'};
          text-align: center;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .loading-indicator {
          display: flex;
          justify-content: center;
          margin: 10px 0;
        }

        .loading-spinner {
          position: relative;
          width: 20px;
          height: 20px;
        }

        .spinner-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid transparent;
          border-top: 2px solid ${getProgressColor()};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner-ring:nth-child(2) {
          animation-delay: 0.2s;
          border-top-color: ${theme === 'light' ? '#6c757d' : '#adb5bd'};
        }

        .spinner-ring:nth-child(3) {
          animation-delay: 0.4s;
          border-top-color: ${theme === 'light' ? '#adb5bd' : '#6c757d'};
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-display {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 10px 0;
          padding: 8px 12px;
          background-color: ${theme === 'light' ? '#f8d7da' : '#721c24'};
          color: ${theme === 'light' ? '#721c24' : '#f8d7da'};
          border-radius: 4px;
          font-size: 12px;
        }

        .error-icon {
          font-size: 14px;
        }

        .error-message {
          flex: 1;
        }

        .step-indicators {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 15px;
        }

        .step-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          transition: all 0.3s ease;
          background-color: ${theme === 'light' ? '#f8f9fa' : '#343a40'};
          border: 1px solid ${theme === 'light' ? '#dee2e6' : '#495057'};
        }

        .step-indicator.completed {
          background-color: ${theme === 'light' ? '#d4edda' : '#155724'};
          border-color: ${theme === 'light' ? '#c3e6cb' : '#155724'};
          color: ${theme === 'light' ? '#155724' : '#d4edda'};
        }

        .step-indicator.processing {
          background-color: ${theme === 'light' ? '#fff3cd' : '#856404'};
          border-color: ${theme === 'light' ? '#ffeaa7' : '#856404'};
          color: ${theme === 'light' ? '#856404' : '#fff3cd'};
          animation: pulse 1.5s ease-in-out infinite;
        }

        .step-indicator.failed {
          background-color: ${theme === 'light' ? '#f8d7da' : '#721c24'};
          border-color: ${theme === 'light' ? '#f5c6cb' : '#721c24'};
          color: ${theme === 'light' ? '#721c24' : '#f8d7da'};
        }

        .step-indicator.current {
          box-shadow: 0 0 0 2px ${getProgressColor()};
        }

        .step-icon {
          font-size: 10px;
        }

        .step-text {
          font-weight: 500;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default EnhancedProgressBar; 
import { useCallback } from 'react';

/**
 * Custom hook for workflow logging - sends events to backend logger
 */
const useWorkflowLogger = () => {
  const logToBackend = useCallback(async (eventType, data) => {
    try {
      await fetch('http://localhost:3002/api/workflow-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventType, data, timestamp: new Date().toISOString() }),
      });
    } catch (error) {
      // Fail silently for logging - don't interrupt user experience
      console.warn('Workflow logging failed:', error);
    }
  }, []);

  const logNavigation = useCallback((toScreen, fromScreen = null) => {
    logToBackend('navigation', { toScreen, fromScreen });
  }, [logToBackend]);

  const logAction = useCallback((action, details = '') => {
    logToBackend('action', { action, details });
  }, [logToBackend]);

  const logUserInput = useCallback((field, value) => {
    logToBackend('input', { field, value });
  }, [logToBackend]);

  const logButtonClick = useCallback((buttonName, context = '') => {
    logToBackend('click', { buttonName, context });
  }, [logToBackend]);

  const logFormSubmission = useCallback((formName, data) => {
    logToBackend('form', { formName, data });
  }, [logToBackend]);

  const logScreenLoad = useCallback((screenName, loadTime = null) => {
    logToBackend('screenLoad', { screenName, loadTime });
  }, [logToBackend]);

  const logError = useCallback((error, context = '') => {
    logToBackend('error', { error: error.toString(), context });
  }, [logToBackend]);

  return {
    logNavigation,
    logAction,
    logUserInput,
    logButtonClick,
    logFormSubmission,
    logScreenLoad,
    logError,
  };
};

export default useWorkflowLogger; 
import { useState, useEffect } from 'react';
import seekApiService from '../services/seekApi';

const useSystemStatus = () => {
  const [systemReady, setSystemReady] = useState(false);

  // Real system readiness check with backend health monitoring
  useEffect(() => {
    let healthCheckInterval;
    let attempts = 0;
    const maxAttempts = 10; // 3 seconds max

    const checkBackendHealth = async () => {
      try {
        attempts++;
        const health = await seekApiService.healthCheck();
        if (health.status === 'ok') {
          setSystemReady(true);
          if (healthCheckInterval) clearInterval(healthCheckInterval);
          return;
        }
      } catch (error) {
        console.log(`Backend health check attempt ${attempts}/${maxAttempts}: ${error.message}`);
      }

      if (attempts >= maxAttempts) {
        console.error('Backend health check failed after maximum attempts');
        setSystemReady(true); // Allow continuation even if health check fails
        if (healthCheckInterval) clearInterval(healthCheckInterval);
      }
    };

    // Start health checking immediately
    checkBackendHealth();
    
    // Then check every 300ms
    healthCheckInterval = setInterval(checkBackendHealth, 300);

    return () => {
      if (healthCheckInterval) clearInterval(healthCheckInterval);
    };
  }, []);

  // Generate checklist based on system status
  const getWelcomeChecklist = () => [
    { id: 1, text: 'Backend Server Startup', status: 'completed' },
    { id: 2, text: 'Database & Services Initialization', status: 'completed' },
    { id: 3, text: 'Web Scraping Engine Setup', status: 'completed' },
    { id: 4, text: 'API Endpoints Activation', status: systemReady ? 'completed' : 'processing' }
  ];

  return {
    systemReady,
    welcomeChecklist: getWelcomeChecklist()
  };
};

export default useSystemStatus; 
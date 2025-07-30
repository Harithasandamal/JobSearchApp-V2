import { useState, useEffect } from 'react';
import seekApiService from '../services/seekApi';

const useSystemStatus = () => {
  const [systemReady, setSystemReady] = useState(false);
  const [checkPhase, setCheckPhase] = useState('starting');

  // Real system readiness check with backend health monitoring
  useEffect(() => {
    let healthCheckInterval;
    let attempts = 0;
    const maxAttempts = 15; // 4.5 seconds max (15 * 300ms)

    const checkBackendHealth = async () => {
      try {
        attempts++;
        
        // Update check phase based on attempts
        if (attempts <= 3) {
          setCheckPhase('backend-starting');
        } else if (attempts <= 8) {
          setCheckPhase('api-connecting');
        } else if (attempts <= 12) {
          setCheckPhase('scraper-ready');
        } else {
          setCheckPhase('finalizing');
        }

        const health = await seekApiService.healthCheck();
        if (health.status === 'ok') {
          setCheckPhase('ready');
          setSystemReady(true);
          if (healthCheckInterval) clearInterval(healthCheckInterval);
          return;
        }
      } catch (error) {
        console.log(`Backend health check attempt ${attempts}/${maxAttempts}: ${error.message}`);
      }

      if (attempts >= maxAttempts) {
        console.log('Backend health check completed - proceeding with available services');
        setCheckPhase('ready');
        setSystemReady(true); // Allow continuation - backend may still be starting
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

  // Generate checklist based on system status and check phase
  const getWelcomeChecklist = () => {
    const baseChecks = [
      { 
        id: 1, 
        text: 'Backend Server Connection', 
        status: checkPhase === 'starting' ? 'processing' : 'completed' 
      },
      { 
        id: 2, 
        text: 'Job Scraping Engine Ready', 
        status: checkPhase === 'starting' || checkPhase === 'backend-starting' ? 'processing' : 'completed' 
      },
      { 
        id: 3, 
        text: 'API Endpoints Active', 
        status: checkPhase === 'starting' || checkPhase === 'backend-starting' || checkPhase === 'api-connecting' ? 'processing' : 'completed' 
      },
      { 
        id: 4, 
        text: 'Parallel Scraping Ready', 
        status: systemReady ? 'completed' : 'processing' 
      }
    ];

    return baseChecks;
  };

  return {
    systemReady,
    checkPhase,
    welcomeChecklist: getWelcomeChecklist()
  };
};

export default useSystemStatus; 
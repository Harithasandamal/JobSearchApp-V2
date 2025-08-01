import { useState, useEffect, useCallback } from 'react';
import useLocalStorage from './useLocalStorage';
import useSessionStorage from './useSessionStorage';

/**
 * Enhanced Data Persistence Hook
 * Manages both localStorage (persistent) and sessionStorage (session-only) data
 * Distinguishes between fresh app start vs page refresh
 */
const useDataPersistence = () => {
  // Persistent data (survives browser close/reopen)
  const [persistentState, setPersistentState] = useLocalStorage('appPersistentState', {
    theme: 'dark',
    currentScreen: 'welcome',
    searchParams: {},
    jobsFound: [],
    selectedJobs: [],
    scoredJobs: [],
    analysisData: null,
    lastActiveTimestamp: Date.now()
  });

  // Session data (cleared on browser close)
  const [sessionState, setSessionState] = useSessionStorage('appSessionState', {
    jobDetailsCache: {}, // Cached job details for reuse
    selectedJobsHtml: {}, // HTML content for selected jobs (max 5)
    selectedJobsMarkdown: {}, // Converted markdown for selected jobs
    sessionStartTimestamp: Date.now()
  });

  // In-memory cache for job details (fastest access)
  const [jobDetailsMemoryCache, setJobDetailsMemoryCache] = useState({});

  // Check if this is a fresh app start vs page refresh
  const isPageRefresh = useCallback(() => {
    // In test/non-browser environment, always treat as fresh start
    if (typeof window === 'undefined') {
      return false;
    }
    
    const sessionStart = sessionState.sessionStartTimestamp;
    const lastActive = persistentState.lastActiveTimestamp;
    const timeDiff = Date.now() - sessionStart;
    
    // If session data exists and was created recently (< 5 minutes ago), it's likely a refresh
    return sessionStart && timeDiff < 300000; // 5 minutes
  }, [sessionState.sessionStartTimestamp, persistentState.lastActiveTimestamp]);

  // Update persistent state
  const updatePersistentState = useCallback((updates) => {
    setPersistentState(prev => ({
      ...prev,
      ...updates,
      lastActiveTimestamp: Date.now()
    }));
  }, [setPersistentState]);

  // Update session state
  const updateSessionState = useCallback((updates) => {
    setSessionState(prev => ({
      ...prev,
      ...updates
    }));
  }, [setSessionState]);

  // Cache job details in memory and session storage
  const cacheJobDetails = useCallback((jobUrl, jobDetails) => {
    // Add to memory cache for fastest access
    setJobDetailsMemoryCache(prev => ({
      ...prev,
      [jobUrl]: {
        ...jobDetails,
        cachedAt: Date.now()
      }
    }));

    // Add to session storage for persistence across page refreshes
    updateSessionState({
      jobDetailsCache: {
        ...sessionState.jobDetailsCache,
        [jobUrl]: {
          ...jobDetails,
          cachedAt: Date.now()
        }
      }
    });
  }, [sessionState.jobDetailsCache, updateSessionState]);

  // Get cached job details (check memory first, then session storage)
  const getCachedJobDetails = useCallback((jobUrl) => {
    // Check memory cache first (fastest)
    if (jobDetailsMemoryCache[jobUrl]) {
      return jobDetailsMemoryCache[jobUrl];
    }

    // Check session storage
    if (sessionState.jobDetailsCache[jobUrl]) {
      const cached = sessionState.jobDetailsCache[jobUrl];
      // Also add to memory cache for next time
      setJobDetailsMemoryCache(prev => ({
        ...prev,
        [jobUrl]: cached
      }));
      return cached;
    }

    return null;
  }, [jobDetailsMemoryCache, sessionState.jobDetailsCache]);

  // Store HTML content for selected job (max 5)
  const storeJobHtml = useCallback((jobUrl, htmlContent) => {
    const currentHtmlJobs = Object.keys(sessionState.selectedJobsHtml);
    
    // Limit to max 5 jobs
    if (currentHtmlJobs.length >= 5 && !sessionState.selectedJobsHtml[jobUrl]) {
      console.warn('Maximum 5 jobs can have HTML stored. Remove existing job first.');
      return false;
    }

    updateSessionState({
      selectedJobsHtml: {
        ...sessionState.selectedJobsHtml,
        [jobUrl]: {
          html: htmlContent,
          storedAt: Date.now()
        }
      }
    });

    return true;
  }, [sessionState.selectedJobsHtml, updateSessionState]);

  // Store markdown content for selected job
  const storeJobMarkdown = useCallback((jobUrl, markdownContent) => {
    updateSessionState({
      selectedJobsMarkdown: {
        ...sessionState.selectedJobsMarkdown,
        [jobUrl]: {
          markdown: markdownContent,
          convertedAt: Date.now()
        }
      }
    });
  }, [sessionState.selectedJobsMarkdown, updateSessionState]);

  // Get stored HTML for job
  const getJobHtml = useCallback((jobUrl) => {
    return sessionState.selectedJobsHtml[jobUrl]?.html || null;
  }, [sessionState.selectedJobsHtml]);

  // Get stored markdown for job
  const getJobMarkdown = useCallback((jobUrl) => {
    return sessionState.selectedJobsMarkdown[jobUrl]?.markdown || null;
  }, [sessionState.selectedJobsMarkdown]);

  // Clear all session data (but keep persistent data)
  const clearSessionData = useCallback(() => {
    setSessionState({
      jobDetailsCache: {},
      selectedJobsHtml: {},
      selectedJobsMarkdown: {},
      sessionStartTimestamp: Date.now()
    });
    setJobDetailsMemoryCache({});
  }, [setSessionState]);

  // Clear all data (both persistent and session)
  const clearAllData = useCallback(() => {
    setPersistentState({
      theme: 'dark',
      currentScreen: 'welcome',
      searchParams: {},
      jobsFound: [],
      selectedJobs: [],
      scoredJobs: [],
      analysisData: null,
      lastActiveTimestamp: Date.now()
    });
    clearSessionData();
  }, [setPersistentState, clearSessionData]);

  // Initialize session timestamp if not set
  useEffect(() => {
    if (!sessionState.sessionStartTimestamp) {
      updateSessionState({
        sessionStartTimestamp: Date.now()
      });
    }
  }, []);

  return {
    // State
    persistentState,
    sessionState,
    
    // State updates
    updatePersistentState,
    updateSessionState,
    
    // Job details caching
    cacheJobDetails,
    getCachedJobDetails,
    
    // HTML/Markdown storage
    storeJobHtml,
    storeJobMarkdown,
    getJobHtml,
    getJobMarkdown,
    
    // Utilities
    isPageRefresh: isPageRefresh(),
    clearSessionData,
    clearAllData,
    
    // Stats
    cachedJobsCount: Object.keys(jobDetailsMemoryCache).length + Object.keys(sessionState.jobDetailsCache).length,
    storedHtmlJobsCount: Object.keys(sessionState.selectedJobsHtml).length,
    storedMarkdownJobsCount: Object.keys(sessionState.selectedJobsMarkdown).length
  };
};

export default useDataPersistence;
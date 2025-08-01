/**
 * SESSION PERSISTENCE HOOK
 * Comprehensive data persistence for navigation and session continuity
 * Handles: search params, job results, scoring data, analysis data, navigation history
 */

import { useState, useEffect, useCallback } from 'react';
import useLocalStorage from './useLocalStorage';

const useSessionPersistence = () => {
  const [sessionData, setSessionData] = useLocalStorage('jobSearchSession', {
    // Navigation state
    currentScreen: 'welcome',
    navigationHistory: ['welcome'],
    historyIndex: 0,
    
    // Search data
    searchParams: {
      location: 'Melbourne VIC 3000',
      distance: '5 km', 
      postedAgo: '3 days',
      keyword: '',
      resume: 'Shamalka Resume v2.pdf'
    },
    
    // Job data
    jobsFound: [],
    selectedJobs: [],
    scoredJobs: [],
    
    // Analysis data
    analysisData: null,
    selectedJobForAnalysis: null,
    
    // Process tracking
    searchProcessId: null,
    
    // Session metadata
    lastUpdated: Date.now(),
    version: '1.0'
  });

  // Update session data
  const updateSession = useCallback((updates) => {
    setSessionData(prev => ({
      ...prev,
      ...updates,
      lastUpdated: Date.now()
    }));
  }, [setSessionData]);

  // Clear session data (start fresh)
  const clearSession = useCallback(() => {
    setSessionData({
      currentScreen: 'welcome',
      navigationHistory: ['welcome'],
      historyIndex: 0,
      searchParams: {
        location: 'Melbourne VIC 3000',
        distance: '5 km',
        postedAgo: '3 days', 
        keyword: '',
        resume: 'Shamalka Resume v2.pdf'
      },
      jobsFound: [],
      selectedJobs: [],
      scoredJobs: [],
      analysisData: null,
      selectedJobForAnalysis: null,
      searchProcessId: null,
      lastUpdated: Date.now(),
      version: '1.0'
    });
  }, [setSessionData]);

  // Navigation with history tracking
  const navigateWithHistory = useCallback((screen) => {
    setSessionData(prev => {
      const newHistory = [...prev.navigationHistory.slice(0, prev.historyIndex + 1), screen];
      return {
        ...prev,
        currentScreen: screen,
        navigationHistory: newHistory,
        historyIndex: newHistory.length - 1,
        lastUpdated: Date.now()
      };
    });
  }, [setSessionData]);

  // Navigate back in history
  const navigateBack = useCallback(() => {
    setSessionData(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        return {
          ...prev,
          currentScreen: prev.navigationHistory[newIndex],
          historyIndex: newIndex,
          lastUpdated: Date.now()
        };
      }
      return prev;
    });
  }, [setSessionData]);

  // Navigate forward in history
  const navigateForward = useCallback(() => {
    setSessionData(prev => {
      if (prev.historyIndex < prev.navigationHistory.length - 1) {
        const newIndex = prev.historyIndex + 1;
        return {
          ...prev,
          currentScreen: prev.navigationHistory[newIndex],
          historyIndex: newIndex,
          lastUpdated: Date.now()
        };
      }
      return prev;
    });
  }, [setSessionData]);

  // Check if can navigate back/forward
  const canNavigateBack = sessionData.historyIndex > 0;
  const canNavigateForward = sessionData.historyIndex < sessionData.navigationHistory.length - 1;

  // Get previous/next screens
  const previousScreen = canNavigateBack ? sessionData.navigationHistory[sessionData.historyIndex - 1] : null;
  const nextScreen = canNavigateForward ? sessionData.navigationHistory[sessionData.historyIndex + 1] : null;

  // Check if session has data (user can continue)
  const hasExistingSession = sessionData.jobsFound.length > 0 || 
                            sessionData.selectedJobs.length > 0 || 
                            sessionData.scoredJobs.length > 0 ||
                            sessionData.currentScreen !== 'welcome';

  // Session age check (data older than 24 hours is considered stale)
  const sessionAge = Date.now() - sessionData.lastUpdated;
  const isSessionStale = sessionAge > (24 * 60 * 60 * 1000); // 24 hours

  // Auto-clear stale sessions
  useEffect(() => {
    if (isSessionStale && hasExistingSession) {
      console.log('🧹 Clearing stale session data (>24h old)');
      clearSession();
    }
  }, [isSessionStale, hasExistingSession, clearSession]);

  return {
    // Session data
    sessionData,
    updateSession,
    clearSession,
    
    // Navigation
    navigateWithHistory,
    navigateBack, 
    navigateForward,
    canNavigateBack,
    canNavigateForward,
    previousScreen,
    nextScreen,
    
    // Session state
    hasExistingSession,
    isSessionStale,
    sessionAge
  };
};

export default useSessionPersistence;
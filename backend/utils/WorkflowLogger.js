/**
 * Unified Workflow Logger - Tracks user navigation and workflow processes
 * Based on user preference for tracking end-to-end processes with navigation indentation
 */

class WorkflowLogger {
  constructor() {
    this.indentLevel = 0;
    this.currentScreen = 'welcome';
    this.sessionStartTime = new Date();
    this.processStack = [];
    
    this.log('🚀 JOB SEARCH APP SESSION STARTED', 'system');
    this.log(`📅 Session started at: ${this.sessionStartTime.toLocaleString()}`, 'system');
    this.log('📋 Workflow Logger initialized - tracking user navigation and processes', 'system');
    this.log('', 'system'); // Empty line for readability
  }
  
  /**
   * Core logging method with indentation
   */
  log(message, type = 'info', skipIndent = false) {
    const timestamp = new Date().toLocaleTimeString();
    const indent = skipIndent ? '' : '  '.repeat(this.indentLevel);
    const icon = this.getIcon(type);
    
    console.log(`[${timestamp}] ${indent}${icon} ${message}`);
  }
  
  /**
   * Get appropriate icon for log type
   */
  getIcon(type) {
    const icons = {
      system: '⚙️',
      navigation: '🧭',
      action: '👆',
      process: '⚡',
      scraping: '🕷️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
  }
  
  /**
   * Track screen navigation with user-friendly messages
   */
  navigateToScreen(screenName, fromScreen = null) {
    const from = fromScreen || this.currentScreen;
    
    // Determine if we're going deeper or backing out
    const screenDepth = this.getScreenDepth(screenName);
    const currentDepth = this.getScreenDepth(this.currentScreen);
    
    // Get user-friendly screen names
    const friendlyNames = {
      welcome: 'Welcome',
      searching: 'Job Search in Progress', 
      searched: 'Search Results',
      scoring: 'AI Scoring in Progress',
      scored: 'Scored Results',
      analyzing: 'Job Analysis in Progress',
      analyzed: 'Analysis Complete'
    };
    
    const friendlyName = friendlyNames[screenName] || screenName;
    
    if (screenDepth > currentDepth) {
      // Going deeper - increase indent
      this.indentLevel++;
      this.log(`▶️ ${friendlyName}`, 'navigation');
    } else if (screenDepth < currentDepth) {
      // Going back - decrease indent first
      this.indentLevel = Math.max(0, this.indentLevel - 1);
      this.log(`◀️ Back to ${friendlyName}`, 'navigation');
    } else {
      // Same level
      this.log(`🔄 ${friendlyName}`, 'navigation');
    }
    
    this.currentScreen = screenName;
  }
  
  /**
   * Get screen depth for indentation logic
   */
  getScreenDepth(screenName) {
    const depths = {
      welcome: 0,
      searching: 1,
      searched: 1,
      scoring: 2,
      scored: 2,
      analyzing: 3,
      analyzed: 3
    };
    return depths[screenName] || 0;
  }
  
  /**
   * Track user actions (clicks, form submissions, etc.)
   */
  logAction(action, details = '') {
    const detailsText = details ? ` - ${details}` : '';
    this.log(`${action}${detailsText}`, 'action');
  }
  
  /**
   * Start a new process (with increased indentation)
   */
  startProcess(processName, details = '') {
    this.indentLevel++;
    this.processStack.push(processName);
    const detailsText = details ? ` (${details})` : '';
    this.log(`Starting: ${processName}${detailsText}`, 'process');
  }
  
  /**
   * End a process (with decreased indentation)
   */
  endProcess(processName, status = 'completed', details = '') {
    const detailsText = details ? ` - ${details}` : '';
    const statusIcon = status === 'completed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
    
    this.log(`${statusIcon} Completed: ${processName}${detailsText}`, 'process');
    
    // Remove from stack and decrease indent
    this.processStack.pop();
    this.indentLevel = Math.max(0, this.indentLevel - 1);
  }
  
  /**
   * Log scraping activity
   */
  logScraping(message, type = 'info') {
    this.log(message, 'scraping');
  }
  
  /**
   * Log process progress
   */
  logProgress(processName, progress, totalSteps, currentStep = '') {
    const percentage = Math.round((progress / totalSteps) * 100);
    const stepText = currentStep ? ` - ${currentStep}` : '';
    this.log(`Progress: ${processName} [${percentage}%]${stepText}`, 'process');
  }
  
  /**
   * Log API calls
   */
  logApiCall(method, endpoint, status = '') {
    const statusText = status ? ` (${status})` : '';
    this.log(`API: ${method} ${endpoint}${statusText}`, 'process');
  }
  
  /**
   * Log errors with context
   */
  logError(error, context = '') {
    const contextText = context ? ` in ${context}` : '';
    this.log(`Error${contextText}: ${error}`, 'error');
  }
  
  /**
   * Enhanced navigation method for frontend use
   */
  logNavigation(toScreen, fromScreen = null) {
    this.navigateToScreen(toScreen, fromScreen);
  }
  
  /**
   * Enhanced screen load logging
   */
  logScreenLoad(screenName) {
    // Only log initial app load, not every screen change
    if (screenName === 'app') {
      this.log('🎯 Application loaded and ready', 'system');
    }
  }
  
  /**
   * Log session summary
   */
  logSessionSummary() {
    const duration = Math.round((new Date() - this.sessionStartTime) / 1000);
    this.log('', 'system'); // Empty line
    this.log('📊 SESSION SUMMARY', 'system');
    this.log(`⏱️ Session duration: ${duration} seconds`, 'system');
    this.log(`📍 Final screen: ${this.currentScreen.toUpperCase()}`, 'system');
    this.log('🏁 Session ended', 'system');
  }
}

// Create singleton instance
const workflowLogger = new WorkflowLogger();

module.exports = workflowLogger; 
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
    this.recentMessages = new Set(); // Track recent messages to prevent duplicates
    this.messageExpiryTime = 1000; // 1 second expiry for duplicate detection
    
    this.log('🚀 JOB SEARCH APP SESSION STARTED', 'system');
    this.log(`📅 Session started at: ${this.sessionStartTime.toLocaleString()}`, 'system');
    this.log('📋 Workflow Logger initialized - tracking user navigation and processes', 'system');
    this.log('', 'system'); // Empty line for readability
  }
  
  /**
   * Core logging method with indentation and duplicate prevention
   */
  log(message, type = 'info', skipIndent = false) {
    // Prevent duplicate messages within 1 second
    const messageKey = `${type}:${message}`;
    const now = Date.now();
    
    if (this.recentMessages.has(messageKey)) {
      return; // Skip duplicate message
    }
    
    // Add to recent messages with expiry
    this.recentMessages.add(messageKey);
    setTimeout(() => {
      this.recentMessages.delete(messageKey);
    }, this.messageExpiryTime);
    
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
    
    // Get user-friendly screen names according to unified levels 1-3
    const friendlyNames = {
      welcome: '📱 Welcome Screen',           // Level 1: theme toggle, input parameters, built URL
      searching: '🔍 Searching Screen',       // Level 1: search result page loading, URL collection, navigation, scraping
      searched: '📋 Search Results Screen',   // Level 2: X jobs found, selection for scoring  
      scoring: '🎯 Scoring Screen',           // Level 2: N jobs selected for scoring, scoring steps
      scored: '📊 Scored Results Screen',     // Level 3: Y jobs scored, job selection
      analyzing: '🔬 Analyzing Screen',       // Level 3: analyzing steps for selected job
      analyzed: '✅ Analysis Complete Screen' // Level 3: final results
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
   * Main workflow phases: welcome(0) -> searched(1) -> scored(2) -> analyzed(3)
   * Processing screens have +1 depth from their result screens
   */
  getScreenDepth(screenName) {
    // Level 0: System/Server actions (shown anywhere)
    // Level 1: Welcome Screen & Searching Screen  
    // Level 2: Searched Screen & Scoring Screen
    // Level 3: Scored Screen & Analyzing Screen
    const depths = {
      welcome: 1,          // Level 1: Welcome Screen - theme toggle, input parameters, built URL
      searching: 1,        // Level 1: Searching Screen - search result page loading, URL collection, navigation, scraping
      searched: 2,         // Level 2: Searched Screen - X jobs found, selection for scoring  
      scoring: 2,          // Level 2: Scoring Screen - N jobs selected for scoring, scoring steps
      scored: 3,           // Level 3: Scored Screen - Y jobs scored, job selection
      analyzing: 3,        // Level 3: Analyzing Screen - analyzing steps for selected job
      analyzed: 3          // Level 3: Analysis Complete Screen - final results
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
    // Clean, user-friendly process messages
    const detailsText = details ? ` - ${details}` : '';
    this.log(`${processName}${detailsText}`, 'process');
  }
  
  /**
   * End a process (with decreased indentation)
   */
  endProcess(processName, status = 'completed', details = '') {
    const detailsText = details ? ` - ${details}` : '';
    const statusIcon = status === 'completed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
    
    // Clean completion message
    this.log(`${statusIcon} ${processName}${detailsText}`, 'process');
    
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
  
  /**
   * Add a system-level log (Level 0) that can appear anywhere
   */
  systemLog(message, type = 'info') {
    const originalIndent = this.indentLevel;
    this.indentLevel = 0;
    this.log(`⚙️ System: ${message}`, type, true);
    this.indentLevel = originalIndent;
  }
  
  /**
   * Add server-level log (Level 0) for server/environment actions
   */
  serverLog(message, type = 'info') {
    const originalIndent = this.indentLevel;
    this.indentLevel = 0;
    this.log(`🖥️ Server: ${message}`, type, true);
    this.indentLevel = originalIndent;
  }
}

// Create singleton instance
const workflowLogger = new WorkflowLogger();

module.exports = workflowLogger; 
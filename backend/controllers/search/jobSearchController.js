const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const JobUtils = require('../../utils/jobUtils');
const { validateJobUrl } = require('../../utils/urlUtils');
const { readFromFile } = require('../../utils/dataUtils');
const { activeProcesses, activeJobDetails } = require('./sharedData');
const { handleUnifiedSearch } = require('./unifiedScrapingController');

const workflowLogger = require('../../utils/WorkflowLogger');

/**
 * Start a new job search process using unified scraping engine
 */
const startJobSearch = async (req, res) => {
  try {
    const { keyword = 'developer', location = 'Melbourne', distance = 50, postedAgo = '7' } = req.body;
    const { testMode = false } = req.body;
    
    // Determine mode based on testMode parameter
    const mode = testMode ? 'light' : 'dark';
    
    workflowLogger.log(`Unified search request: ${mode.toUpperCase()} MODE`, 'system');
    workflowLogger.log(`Parameters: ${keyword || 'all jobs'} in ${location} (${distance}km, ${postedAgo} days)`, 'system');
    
    // Format parameters for unified controller
    const searchParams = {
      keyword: keyword || '',
      location,
      distance: `${distance} km`,
      postedAgo: `${postedAgo} days`
    };
    
    // Use unified search engine
    const result = await handleUnifiedSearch(searchParams, mode);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Unified search failed:', error);
    workflowLogger.logError(error.message, 'Unified Search');
    return res.status(500).json({ message: 'Failed to start unified search process', error: error.message });
  }
};

module.exports = {
  startJobSearch
}; 
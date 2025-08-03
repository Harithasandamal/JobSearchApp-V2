/**
 * Optimized Scraping Controller
 * Focuses on speed and reliability while maintaining current functionality
 * Separate handling for light and dark modes to ensure reliability
 */

const { activeProcesses } = require('./sharedData');
const { scrapeAllJobsUnified } = require('./jobScrapingUtils');
const { scrapeJobUrlsFromSearchResults } = require('./searchResultsScraper');
const { SAMPLE_URLS, loadSampleUrls, getLightModeConfig } = require('../../constants/sampleUrls');

const UrlBuilder = require('../../scrapers/UrlBuilder');
const workflowLogger = require('../../utils/WorkflowLogger');

/**
 * Optimized search handler with enhanced speed and reliability
 * @param {Object} searchParams - Search parameters (keyword, location, distance, postedAgo)
 * @param {String} mode - 'light' for test mode, 'dark' for real mode
 * @returns {Object} - Process result with ID and status
 */
const handleOptimizedSearch = async (searchParams, mode = 'dark') => {
  const { keyword, location, distance, postedAgo } = searchParams;
  
  // Generate unique process ID based on mode
  const processId = `${mode}-optimized-search-${Date.now()}`;
  
  workflowLogger.startProcess(`${mode.toUpperCase()} MODE Optimized Search`, 'Using enhanced scraping engine');
  
  console.log(`🚀 OPTIMIZED SEARCH - Mode: ${mode.toUpperCase()}`);
  console.log(`📝 Parameters: ${keyword || 'all jobs'} in ${location} (${distance}, ${postedAgo})`);

  // Store process reference
  activeProcesses.set(processId, {
    status: 'running',
    progress: 10,
    jobs: [],
    searchParams: { keyword, location, distance, postedAgo, mode }
  });

  // Start async optimized search
  setTimeout(async () => {
    try {
      workflowLogger.logProgress(`${mode.toUpperCase()} MODE Search`, 30, 100, 'Collecting job URLs');
      
      const processInfo = activeProcesses.get(processId);
      if (processInfo) processInfo.progress = 30;
      
      let jobUrls = [];
      let searchUrl = null;
      
      // OPTIMIZED APPROACH: Different strategies based on mode
      if (mode === 'light') {
        // Light mode: Use config-based sample URLs with enhanced reliability
        console.log(`🌞 LIGHT MODE - Using optimized sample URL collection`);
        
        // Reload URLs from config to ensure freshness
        loadSampleUrls();
        const lightModeConfig = getLightModeConfig();
        
        // Get all available URLs (no limit in light mode)
        jobUrls = [...SAMPLE_URLS]; // Create copy to avoid modification
        
        if (jobUrls.length === 0) {
          throw new Error('No test URLs available in config');
        }
        
        // Apply light mode configuration
        if (lightModeConfig.enableUnlimitedJobs) {
          console.log(`🌞 LIGHT MODE - Unlimited jobs enabled, using all ${jobUrls.length} available URLs`);
        } else {
          const maxJobs = Math.min(lightModeConfig.maxJobs, jobUrls.length);
          jobUrls = jobUrls.slice(0, maxJobs);
          console.log(`🌞 LIGHT MODE - Limited to ${maxJobs} jobs from ${SAMPLE_URLS.length} available URLs`);
        }
        
        workflowLogger.log(`🧪 Light mode: Using ${jobUrls.length} optimized sample URLs (unlimited: ${lightModeConfig.enableUnlimitedJobs})`, 'process');
        
      } else {
        // Dark mode: Enhanced search URL building with fallback strategies
        console.log(`🌙 DARK MODE - Building optimized search URL with enhanced collection`);
        searchUrl = UrlBuilder.buildSeekUrl(keyword, location, distance, postedAgo);
        console.log(`🔗 Search URL: ${searchUrl}`);
        
        workflowLogger.log(`🎯 Dark mode: "${keyword || 'all jobs'}" in "${location}" (${distance}, ${postedAgo})`, 'process');
        workflowLogger.startProcess('Enhanced URL Collection', 'Extracting job URLs with optimized strategy');
        
        try {
          // Enhanced job URL collection with multiple strategies
          jobUrls = await collectJobUrlsOptimized(searchUrl, keyword, location);
          
          if (jobUrls.length === 0) {
            console.log('❌ DARK MODE - No job URLs found from search results');
            workflowLogger.endProcess('Enhanced URL Collection', 'failed', 'No job URLs found');
            workflowLogger.endProcess(`${mode.toUpperCase()} MODE Optimized Search`, 'failed', 'No jobs found');
            
            if (processInfo) {
              processInfo.status = 'failed';
              processInfo.progress = 100;
              processInfo.jobs = [];
            }
            return;
          }
          
          console.log(`✅ DARK MODE - Found ${jobUrls.length} job URLs from search results`);
          workflowLogger.endProcess('Enhanced URL Collection', 'completed', `${jobUrls.length} job URLs found`);
          
        } catch (error) {
          console.error('❌ DARK MODE - Failed to get job URLs:', error.message);
          workflowLogger.endProcess('Enhanced URL Collection', 'failed', error.message);
          workflowLogger.endProcess(`${mode.toUpperCase()} MODE Optimized Search`, 'failed', error.message);
          
          if (processInfo) {
            processInfo.status = 'failed';
            processInfo.progress = 100;
            processInfo.jobs = [];
          }
          return;
        }
      }
      
      // Enhanced job scraping with optimized parameters
      workflowLogger.logProgress(`${mode.toUpperCase()} MODE Search`, 50, 100, 'Scraping job details');
      
      if (processInfo) processInfo.progress = 50;
      
      console.log(`🚀 ENHANCED UNIFIED SCRAPING - Processing ${jobUrls.length} job URLs with optimized engine`);
      workflowLogger.log(`🚀 Enhanced Unified Scraping - ${jobUrls.length} URLs - optimized data only`, 'process');
      
      try {
        // Use optimized scraping with enhanced parameters
        const jobs = await scrapeAllJobsOptimized(jobUrls);
        
        if (jobs && jobs.length > 0) {
          // Enhanced sorting and processing
          const sortedJobs = sortJobsByPostedTime(jobs);
          
          console.log(`✅ ENHANCED UNIFIED SCRAPING - Completed in optimized time (${jobs.length}/${jobUrls.length} jobs)`);
          workflowLogger.log(`✅ ENHANCED UNIFIED SCRAPING - Successfully processed ${jobs.length}/${jobUrls.length} jobs (OPTIMIZED DATA)`, 'process');
          
          workflowLogger.logProgress(`${mode.toUpperCase()} MODE Search`, 100, 100, 'Search completed');
          
          if (processInfo) {
            processInfo.status = 'completed';
            processInfo.progress = 100;
            processInfo.jobs = sortedJobs;
          }
          
          workflowLogger.endProcess(`${mode.toUpperCase()} MODE Optimized Search`, 'completed', `${jobs.length} jobs found`);
          
        } else {
          console.log('❌ ENHANCED UNIFIED SCRAPING - No jobs scraped successfully');
          workflowLogger.log(`❌ ENHANCED UNIFIED SCRAPING - Failed to scrape any jobs`, 'process');
          
          if (processInfo) {
            processInfo.status = 'failed';
            processInfo.progress = 100;
            processInfo.jobs = [];
          }
          
          workflowLogger.endProcess(`${mode.toUpperCase()} MODE Optimized Search`, 'failed', 'No jobs scraped');
        }
        
      } catch (error) {
        console.error('❌ ENHANCED UNIFIED SCRAPING - Error:', error.message);
        workflowLogger.log(`❌ ENHANCED UNIFIED SCRAPING - Error: ${error.message}`, 'process');
        
        if (processInfo) {
          processInfo.status = 'failed';
          processInfo.progress = 100;
          processInfo.jobs = [];
        }
        
        workflowLogger.endProcess(`${mode.toUpperCase()} MODE Optimized Search`, 'failed', error.message);
      }
      
    } catch (error) {
      console.error('❌ OPTIMIZED SEARCH - Fatal error:', error.message);
      workflowLogger.log(`❌ OPTIMIZED SEARCH - Fatal error: ${error.message}`, 'process');
      
      const processInfo = activeProcesses.get(processId);
      if (processInfo) {
        processInfo.status = 'failed';
        processInfo.progress = 100;
        processInfo.jobs = [];
      }
      
      workflowLogger.endProcess(`${mode.toUpperCase()} MODE Optimized Search`, 'failed', error.message);
    }
  }, 100);

  return { processId, status: 'running' };
};

/**
 * Enhanced job URL collection with multiple strategies
 */
const collectJobUrlsOptimized = async (searchUrl, keyword, location) => {
  // Strategy 1: Try search results scraping with optimized timeout
  try {
    console.log('🔍 Strategy 1: Search results scraping with optimized timeout');
    const urls = await Promise.race([
      scrapeJobUrlsFromSearchResults(searchUrl, 20), // Reduced timeout for speed
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search results timeout after 20s')), 20000)
      )
    ]);
    
    if (urls && urls.length > 0) {
      console.log(`✅ Strategy 1 successful: ${urls.length} URLs found`);
      return urls;
    }
  } catch (error) {
    console.log(`⚠️ Strategy 1 failed: ${error.message}`);
  }
  
  // Strategy 2: Try with longer timeout as fallback
  try {
    console.log('🔍 Strategy 2: Extended timeout fallback');
    const urls = await scrapeJobUrlsFromSearchResults(searchUrl, 30);
    
    if (urls && urls.length > 0) {
      console.log(`✅ Strategy 2 successful: ${urls.length} URLs found`);
      return urls;
    }
  } catch (error) {
    console.log(`⚠️ Strategy 2 failed: ${error.message}`);
  }
  
  throw new Error('All URL collection strategies failed');
};

/**
 * Optimized job scraping with enhanced parameters
 */
const scrapeAllJobsOptimized = async (urls) => {
  const OptimizedSeekScraper = require('../../utils/OptimizedSeekScraper');
  const scraper = new OptimizedSeekScraper();
  
  // Optimized parameters for speed and reliability
  scraper.maxBrowsers = 3; // Reduced for better stability
  scraper.timeout = 15000; // 15 second timeout per job
  scraper.retryAttempts = 2; // Reduced retries for speed
  
  console.log(`🚀 OPTIMIZED PARALLEL SCRAPING: ${urls.length} jobs (enhanced parameters)`);
  
  // Single optimized run with enhanced error handling
  const result = await scraper.scrapeAllJobsParallel(urls, 1);
  
  if (result && result.jobs && result.jobs.length > 0) {
    console.log(`✅ Optimized scraping complete: ${result.jobs.length}/${urls.length} jobs scraped successfully`);
    return result.jobs;
  } else {
    console.log(`❌ Optimized scraping failed - no jobs scraped`);
    return [];
  }
};

/**
 * Enhanced job sorting with better time parsing
 */
const sortJobsByPostedTime = (jobs) => {
  return jobs.sort((a, b) => {
    const timeA = parsePostedTime(a.postedAgo);
    const timeB = parsePostedTime(b.postedAgo);
    return timeA - timeB; // Oldest first
  });
};

/**
 * Enhanced time parsing for better sorting
 */
const parsePostedTime = (timeStr) => {
  if (!timeStr) return 0;
  
  const lowerTime = timeStr.toLowerCase();
  
  if (lowerTime.includes('hour') || lowerTime.includes('hr')) {
    const hours = parseInt(timeStr.match(/\d+/)?.[0] || '0');
    return hours * 60 * 60 * 1000; // Convert to milliseconds
  }
  
  if (lowerTime.includes('day')) {
    const days = parseInt(timeStr.match(/\d+/)?.[0] || '0');
    return days * 24 * 60 * 60 * 1000;
  }
  
  if (lowerTime.includes('week')) {
    const weeks = parseInt(timeStr.match(/\d+/)?.[0] || '0');
    return weeks * 7 * 24 * 60 * 60 * 1000;
  }
  
  if (lowerTime.includes('month')) {
    const months = parseInt(timeStr.match(/\d+/)?.[0] || '0');
    return months * 30 * 24 * 60 * 60 * 1000;
  }
  
  return 0; // Default to oldest
};

module.exports = {
  handleOptimizedSearch
}; 
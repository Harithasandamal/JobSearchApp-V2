/**
 * Unified Scraping Controller
 * Single function handles both light and dark modes with mode parameter
 * Implements Option C approach from requirements
 */

const { activeProcesses } = require('./sharedData');
const { scrapeAllJobsUnified } = require('./jobScrapingUtils');
const { scrapeJobUrlsFromSearchResults } = require('./searchResultsScraper');
const { SAMPLE_URLS } = require('../../constants/sampleUrls');

const UrlBuilder = require('../../scrapers/UrlBuilder');
const workflowLogger = require('../../utils/WorkflowLogger');

/**
 * Unified search handler - handles both light and dark modes
 * @param {Object} searchParams - Search parameters (keyword, location, distance, postedAgo)
 * @param {String} mode - 'light' for test mode, 'dark' for real mode
 * @returns {Object} - Process result with ID and status
 */
const handleUnifiedSearch = async (searchParams, mode = 'dark') => {
  const { keyword, location, distance, postedAgo } = searchParams;
  
  // Generate unique process ID based on mode
  const processId = `${mode}-search-${Date.now()}`;
  
  workflowLogger.startProcess(`${mode.toUpperCase()} MODE Unified Search`, 'Using unified scraping engine');
  
  console.log(`🎯 UNIFIED SEARCH - Mode: ${mode.toUpperCase()}`);
  console.log(`📝 Parameters: ${keyword || 'all jobs'} in ${location} (${distance}, ${postedAgo})`);

  // Store process reference
  activeProcesses.set(processId, {
    status: 'running',
    progress: 10,
    jobs: [],
    searchParams: { keyword, location, distance, postedAgo, mode }
  });

  // Start async unified search
  setTimeout(async () => {
    try {
      workflowLogger.logProgress(`${mode.toUpperCase()} MODE Search`, 30, 100, 'Collecting job URLs');
      
      const processInfo = activeProcesses.get(processId);
      if (processInfo) processInfo.progress = 30;
      
      let jobUrls = [];
      let searchUrl = null;
      
      // UNIFIED APPROACH: Different URL sources based on mode
      if (mode === 'light') {
        // Light mode: Use centralized sample URLs
        console.log(`🌞 LIGHT MODE - Using ${SAMPLE_URLS.length} centralized sample URLs`);
        jobUrls = [...SAMPLE_URLS]; // Create copy to avoid modification
        workflowLogger.log(`🧪 Light mode: Using ${SAMPLE_URLS.length} sample URLs`, 'process');
      } else {
        // Dark mode: Build dynamic search URL and scrape job URLs
        console.log(`🌙 DARK MODE - Building dynamic search URL and collecting job URLs`);
        searchUrl = UrlBuilder.buildSeekUrl(keyword, location, distance, postedAgo);
        console.log(`🔗 Search URL: ${searchUrl}`);
        
        workflowLogger.log(`🎯 Dark mode: "${keyword || 'all jobs'}" in "${location}" (${distance}, ${postedAgo})`, 'process');
        workflowLogger.startProcess('Dynamic URL Collection', 'Extracting job URLs from search results');
        
        try {
          // Get job URLs from search results with enhanced error handling
          jobUrls = await Promise.race([
            scrapeJobUrlsFromSearchResults(searchUrl, 30),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Search results timeout after 30s')), 30000)
            )
          ]);
          
          if (jobUrls.length === 0) {
            console.log('❌ DARK MODE - No job URLs found from search results');
            workflowLogger.endProcess('Dynamic URL Collection', 'failed', 'No job URLs found');
            workflowLogger.endProcess(`${mode.toUpperCase()} MODE Unified Search`, 'failed', 'No jobs found');
            
            if (processInfo) {
              processInfo.status = 'failed';
              processInfo.progress = 100;
              processInfo.jobs = [];
            }
            return;
          }
          
          console.log(`✅ DARK MODE - Found ${jobUrls.length} job URLs from search results`);
          workflowLogger.endProcess('Dynamic URL Collection', 'completed', `${jobUrls.length} job URLs found`);
          
        } catch (error) {
          console.error('❌ DARK MODE - Failed to get job URLs:', error.message);
          workflowLogger.endProcess('Dynamic URL Collection', 'failed', error.message);
          workflowLogger.endProcess(`${mode.toUpperCase()} MODE Unified Search`, 'failed', error.message);
          
          if (processInfo) {
            processInfo.status = 'failed';
            processInfo.progress = 100;
            processInfo.jobs = [];
          }
          return;
        }
      }
      
      // Update progress
      if (processInfo) processInfo.progress = 50;
      workflowLogger.logProgress(`${mode.toUpperCase()} MODE Search`, 50, 100, 'Scraping job details');
      
      console.log(`🚀 UNIFIED SCRAPING - Processing ${jobUrls.length} job URLs with unified engine`);
      
      // UNIFIED SCRAPING ENGINE - Same method for both modes with reliability enhancements
      let jobs = [];
      try {
        const startTime = Date.now();
        
        workflowLogger.startProcess('Enhanced Unified Scraping', `${jobUrls.length} URLs - accurate data only`);
        
        // Enhanced parallel scraping with speed + accuracy focus (NO FALLBACKS)
        const validJobs = await scrapeAllJobsUnifiedEnhanced(jobUrls);
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);
        
        console.log(`⚡ ENHANCED UNIFIED SCRAPING - Completed in ${duration} seconds (ACCURATE DATA ONLY)`);
        
        // Format jobs consistently for both modes
        const formattedJobs = validJobs.map((job, index) => ({
          id: `${mode}-job-${index + 1}`,
          title: job.title,
          company: job.company || 'Company not specified',
          location: job.location || 'Location not specified',
          postedAgo: job.postedAgo || 'Time not specified',
          url: job.url
        }));
        
        jobs.push(...formattedJobs);
        
        console.log(`✅ ENHANCED UNIFIED SCRAPING - Successfully processed ${formattedJobs.length}/${jobUrls.length} jobs (ACCURATE DATA)`);
        workflowLogger.endProcess('Enhanced Unified Scraping', 'completed', `${formattedJobs.length} accurate jobs scraped`);
        
      } catch (error) {
        console.error(`❌ ENHANCED UNIFIED SCRAPING - Failed: ${error.message} (ACCURATE DATA ONLY - NO FALLBACKS)`);
        workflowLogger.endProcess('Enhanced Unified Scraping', 'failed', `${error.message} - accurate data only`);
      }
      
      // Sort jobs by posted time (unified for both modes)
      if (jobs.length > 0) {
        console.log('🔄 UNIFIED SORTING - Sorting all jobs by posted time...');
        
        jobs.sort((a, b) => {
          const parseTime = (timeStr) => {
            if (!timeStr || timeStr === 'Unknown' || timeStr === 'Time not specified') return Infinity;
            
            const match = timeStr.match(/(\d+)\s*([dhm])/);
            if (match) {
              const num = parseInt(match[1]);
              const unit = match[2];
              
              switch (unit) {
                case 'm': return num;
                case 'h': return num * 60;
                case 'd': return num * 60 * 24;
                default: return Infinity;
              }
            }
            
            if (timeStr.toLowerCase().includes('today')) return 0;
            if (timeStr.toLowerCase().includes('yesterday')) return 60 * 24;
            
            return Infinity;
          };
          
          const aTime = parseTime(a.postedAgo);
          const bTime = parseTime(b.postedAgo);
          
          return aTime - bTime;
        });
      }
      
      // Update process with final results
      if (processInfo) {
        if (jobs.length === 0) {
          processInfo.status = 'failed';
          processInfo.progress = 100;
          processInfo.jobs = [];
          console.log(`❌ ${mode.toUpperCase()} MODE - No jobs scraped successfully`);
          workflowLogger.endProcess(`${mode.toUpperCase()} MODE Unified Search`, 'failed', 'No jobs scraped');
        } else {
          processInfo.status = 'completed';
          processInfo.progress = 100;
          processInfo.jobs = jobs;
          console.log(`✅ ${mode.toUpperCase()} MODE - Completed with ${jobs.length} jobs`);
          workflowLogger.endProcess(`${mode.toUpperCase()} MODE Unified Search`, 'completed', `${jobs.length} jobs found`);
          workflowLogger.logProgress(`${mode.toUpperCase()} MODE Search`, 100, 100, 'Search completed');
        }
      }
      
    } catch (error) {
      console.error(`❌ ${mode.toUpperCase()} MODE - Critical error:`, error);
      const processInfo = activeProcesses.get(processId);
      if (processInfo) {
        processInfo.status = 'failed';
        processInfo.progress = 100;
        processInfo.jobs = [];
      }
      workflowLogger.logError(error.message, `${mode.toUpperCase()} MODE`);
      workflowLogger.endProcess(`${mode.toUpperCase()} MODE Unified Search`, 'failed', error.message);
    }
  }, 1000);

  return {
    processId: processId,
    message: `${mode.toUpperCase()} mode search started with unified engine`,
    status: 'running',
    searchUrl: mode === 'dark' ? UrlBuilder.buildSeekUrl(keyword, location, distance, postedAgo) : null
  };
};

/**
 * Use proven working scraping method (NO FALLBACKS)
 * Returns accurate data only - fails cleanly if scraping unsuccessful
 */
async function scrapeAllJobsUnifiedEnhanced(urls) {
  console.log(`🚀 Unified scraping: Processing ${urls.length} URLs with proven method`);
  
  try {
    // Use the proven working scrapeAllJobsUnified method directly
    const { scrapeAllJobsUnified } = require('./jobScrapingUtils');
    const jobs = await scrapeAllJobsUnified(urls);
    
    if (jobs && jobs.length > 0) {
      console.log(`✅ Unified scraping successful: ${jobs.length}/${urls.length} jobs (ACCURATE DATA)`);
      return jobs;
    } else {
      console.log(`❌ Unified scraping returned no jobs - failing cleanly (NO FALLBACKS)`);
      throw new Error('No jobs scraped successfully - accurate data only');
    }
    
  } catch (error) {
    console.log(`❌ Unified scraping failed: ${error.message} (NO FALLBACKS - ACCURATE DATA ONLY)`);
    throw error; // Fail cleanly without compromising on accuracy
  }
}

module.exports = {
  handleUnifiedSearch
};
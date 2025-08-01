/**
 * Dark Mode Controller
 * Handles real search mode with dynamic URL building and job scraping
 * Split from jobSearchController.js to maintain <300 line limit
 */

const { activeProcesses } = require('./sharedData');
const { scrapeAllJobsUnified } = require('./jobScrapingUtils');

const UrlBuilder = require('../../scrapers/UrlBuilder');
const workflowLogger = require('../../utils/WorkflowLogger');

/**
 * Handle dark mode (real search) with dynamic URL building and scraping
 */
const handleDarkModeSearch = async (searchParams) => {
  const { keyword, location, distance, postedAgo } = searchParams;
  
  // REAL SEARCH MODE - Use working scraping logic (NO FALLBACK DATA)
  workflowLogger.startProcess('REAL SEARCH Job Search', 'Using working scraper logic');
  console.log('🌙 REAL SEARCH MODE - Using working scraper logic (NO FALLBACK DATA)');

  // Generate unique process ID
  const processId = 'real-search-' + Date.now();

  console.log(`🚀 Starting real search process with ID: ${processId}`);
  console.log(`🔍 Search parameters:`, { keyword, location, distance, postedAgo });

  // Build search URL once - before async processing starts
  console.log(`🏗️ Pre-building SEEK search URL: ${keyword || 'all jobs'} in ${location} (${distance}, ${postedAgo})`);
  const searchUrl = UrlBuilder.buildSeekUrl(keyword, location, distance, postedAgo);

  // Store process reference with initial state
  activeProcesses.set(processId, {
    status: 'running',
    progress: 10,
    jobs: [],
    searchParams: { keyword, location, distance, postedAgo }
  });

  // Start async real search using working scraper logic
  setTimeout(async () => {
    try {
      console.log('🔍 REAL SEARCH - Starting scraping process...');
      
      // Update progress
      const processInfo = activeProcesses.get(processId);
      if (processInfo) processInfo.progress = 30;
      
      // ✅ REAL DYNAMIC SEARCH - Use pre-built search URL
      console.log(`🎯 REAL SEARCH - Performing dynamic search for: "${keyword}" in "${location}"`);
      workflowLogger.log(`🎯 Real search: "${keyword}" in "${location}" (${distance}, ${postedAgo})`, 'system');
      
      // Use the search URL we built earlier (no rebuilding!)
      console.log(`🔗 Using pre-built search URL: ${searchUrl}`);
      
      // Get job URLs from search results using our pre-built URL
      console.log('🔍 Scraping job URLs from search results...');
      workflowLogger.startProcess('Search Results Scraping', 'Extracting job URLs from search page');
      
      const { scrapeJobUrlsFromSearchResults } = require('./searchResultsScraper');
      const jobUrls = await scrapeJobUrlsFromSearchResults(searchUrl, 30);
      
      if (jobUrls.length === 0) {
        console.log('❌ REAL SEARCH - No job URLs found from search results');
        workflowLogger.endProcess('Search Results Scraping', 'failed', 'No job URLs found');
        workflowLogger.endProcess('REAL SEARCH Job Search', 'failed', 'No jobs found for search criteria');
        
        if (processInfo) {
          processInfo.status = 'failed';
          processInfo.progress = 100;
          processInfo.jobs = [];
        }
        return;
      }
      
      console.log(`✅ REAL SEARCH - Found ${jobUrls.length} job URLs from search results`);
      workflowLogger.endProcess('Search Results Scraping', 'completed', `${jobUrls.length} job URLs found`);
      
      const sampleUrls = jobUrls;
      const jobs = [];
      
      // Update progress
      if (processInfo) processInfo.progress = 50;
      
      // ✅ UNIFIED SCRAPING - Same method as test mode for consistency
      try {
        const startTime = Date.now();
        
        workflowLogger.startProcess('Unified Real Job Scraping', `${sampleUrls.length} URLs`);
        
        // Use unified fast parallel scraper - same as test mode
        const validJobs = await scrapeAllJobsUnified(sampleUrls);
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);
        
        // Format jobs for UI consistency (same as test mode)
        const formattedJobs = validJobs.map((job, index) => ({
          id: `real-job-${index + 1}`,
          title: job.title,
          company: job.company || 'Company not specified',
          location: job.location || 'Location not specified',
          postedAgo: job.postedAgo || 'Time not specified',
          url: job.url
        }));
        
        // ✅ NO CROSS VALIDATION - Use all scraped jobs directly
        console.log(`📝 REAL SEARCH - Using all scraped jobs without cross validation (${formattedJobs.length} jobs)`);
        
        workflowLogger.endProcess('Unified Real Job Scraping', 'completed', `${formattedJobs.length} jobs scraped successfully`);
        jobs.push(...formattedJobs);
        
      } catch (error) {
        console.error('❌ REAL SEARCH - Unified scraping failed:', error);
        workflowLogger.endProcess('Unified Real Job Scraping', 'failed', error.message);
      }
      
      // Sort jobs by posted time (most recent first) - works for both regular and featured jobs
      if (jobs.length > 0) {
        console.log('🔄 REAL SEARCH - Sorting all jobs by posted time (featured jobs included)...');
        
        // Count featured jobs for logging
        const featuredCount = jobs.filter(job => job.isFeatured).length;
        if (featuredCount > 0) {
          console.log(`🌟 Found ${featuredCount} featured jobs - will be sorted with regular jobs`);
        }
        
        jobs.sort((a, b) => {
          const parseTime = (timeStr) => {
            if (!timeStr || timeStr === 'Unknown' || timeStr === 'Time not specified') return Infinity;
            
            // Extract number and unit from strings like "3d ago", "1d ago", "4d ago"
            const match = timeStr.match(/(\d+)\s*([dhm])/);
            if (match) {
              const num = parseInt(match[1]);
              const unit = match[2];
              
              // Convert to minutes for comparison
              switch (unit) {
                case 'm': return num; // minutes
                case 'h': return num * 60; // hours to minutes
                case 'd': return num * 60 * 24; // days to minutes
                default: return Infinity;
              }
            }
            
            // Handle "today", "yesterday" etc
            if (timeStr.toLowerCase().includes('today')) return 0;
            if (timeStr.toLowerCase().includes('yesterday')) return 60 * 24;
            
            return Infinity; // Unknown format, put at end
          };
          
          const aTime = parseTime(a.postedAgo);
          const bTime = parseTime(b.postedAgo);
          
          return aTime - bTime; // Ascending order (most recent = smallest number)
        });
      }
      
      // Update process with completed jobs
      if (processInfo) {
        if (jobs.length === 0) {
          processInfo.status = 'failed';
          processInfo.progress = 100;
          processInfo.jobs = [];
          console.log(`❌ REAL SEARCH - No jobs scraped successfully despite finding ${jobUrls.length} URLs`);
          workflowLogger.endProcess('REAL SEARCH Job Search', 'failed', 'No jobs scraped successfully');
        } else {
          processInfo.status = 'completed';
          processInfo.progress = 100;
          processInfo.jobs = jobs;
          console.log(`✅ REAL SEARCH - Completed with ${jobs.length} scraped job details`);
          // Removed detailed job list logging for cleaner output
          workflowLogger.endProcess('REAL SEARCH Job Search', 'completed', `${jobs.length} jobs found`);
          workflowLogger.logProgress('REAL SEARCH Search', 100, 100, 'Search completed');
        }
      }
      
    } catch (error) {
      console.error('❌ REAL SEARCH - Critical error:', error);
      const processInfo = activeProcesses.get(processId);
      if (processInfo) {
        processInfo.status = 'failed';
        processInfo.progress = 100;
        processInfo.jobs = []; // NO FALLBACK DATA - empty array
      }
      workflowLogger.logError(error.message, 'REAL SEARCH');
      workflowLogger.endProcess('REAL SEARCH Job Search', 'failed', error.message);
    }
  }, 1000);

  return {
    processId: processId,
    message: 'Real search started with working scraper (NO DEMO DATA)',
    status: 'running',
    searchUrl: searchUrl  // Include the search URL for frontend comparison
  };
};

module.exports = {
  handleDarkModeSearch
};
/**
 * Light Mode Controller 
 * Handles test mode search using 3 hardcoded sample URLs
 * Split from jobSearchController.js to maintain <300 line limit
 */

const { activeProcesses } = require('./sharedData');
const { scrapeAllJobsUnified } = require('./jobScrapingUtils');
const workflowLogger = require('../../utils/WorkflowLogger');

/**
 * Handle light mode (test mode) search using predefined sample URLs
 */
const handleLightModeSearch = async (searchParams) => {
  const { keyword, location, distance, postedAgo } = searchParams;
  
  workflowLogger.startProcess('TEST MODE Job Search', 'Using working scraper logic');
  
  // TEST MODE - Use unified scraping with dynamic URL collection
  console.log('🧪 TEST MODE - Using unified scraping with dynamic URL collection');
  const processId = 'test-search-' + Date.now();
  
  activeProcesses.set(processId, {
    status: 'running',
    progress: 10,
    jobs: [],
    searchParams: { keyword, location, distance, postedAgo }
  });

  // Start async test search using unified scraper logic
  setTimeout(async () => {
    try {
      workflowLogger.logProgress('TEST MODE Search', 30, 100, 'Collecting job URLs');
      
      // Update progress
      const processInfo = activeProcesses.get(processId);
      if (processInfo) processInfo.progress = 30;
      
      // ✅ SAMPLE JOBS - Use 3 predefined working URLs for consistent testing
      console.log(`🧪 TEST MODE - Using 3 predefined sample job URLs for testing`);
      workflowLogger.log(`🧪 Test mode: Using sample URLs instead of real search`, 'system');
      
      // Use reliable working sample URLs
      const jobUrls = [
        'https://www.seek.com.au/job/85981995?ref=search-standalone&type=standard&origin=jobTitle#sol=014f12b9189e0a6d2c275dd68ab2722888ade58a',
        'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=014f12b9189e0a6d2c275dd68ab2722888ade58b',
        'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=014f12b9189e0a6d2c275dd68ab2722888ade58c'
      ];
      
      console.log(`✅ TEST MODE - Using ${jobUrls.length} sample job URLs`);
      workflowLogger.startProcess('Sample Job Scraping', `${jobUrls.length} predefined URLs`);
      
      const jobs = [];
      
      // Update progress
      if (processInfo) processInfo.progress = 50;
      workflowLogger.logProgress('TEST MODE Search', 50, 100, 'Scraping sample jobs');
      
      console.log('🧪 TEST MODE - Scraping sample jobs with unified parallel method...');
      
      // ✅ UNIFIED PARALLEL SCRAPING - Same method as real search
      try {
        const startTime = Date.now();
        
        const validJobs = await scrapeAllJobsUnified(jobUrls);
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);
        
        console.log(`⚡ TEST MODE - Unified parallel scraping completed in ${duration} seconds!`);
        
        // Format jobs for UI consistency (same as real mode)
        const formattedJobs = validJobs.map((job, index) => ({
          id: `test-job-${index + 1}`,
          title: job.title,
          company: job.company || 'Company not specified',
          location: job.location || 'Location not specified',
          postedAgo: job.postedAgo || 'Time not specified',
          url: job.url
        }));
        
        // ✅ TEST MODE - No validation/filtering for fixed sample jobs
        console.log(`📝 TEST MODE - Using all sample jobs as-is (no filtering for fixed samples)`);
        
        jobs.push(...formattedJobs);
        
        console.log(`🚀 TEST MODE - Sample job scraping completed! ${validJobs.length}/${jobUrls.length} jobs scraped, all ${formattedJobs.length} sample jobs returned`);
        workflowLogger.endProcess('Sample Job Scraping', 'completed', `All ${formattedJobs.length} sample jobs returned (no filtering applied)`);
      } catch (error) {
        console.error('❌ TEST MODE - Sample job scraping failed:', error);
        workflowLogger.endProcess('Sample Job Scraping', 'failed', error.message);
      }
      
      // Update process with completed jobs
      if (processInfo) {
        processInfo.status = 'completed';
        processInfo.progress = 100;
        processInfo.jobs = jobs;
        console.log(`✅ TEST MODE - Completed with ${jobs.length} fixed sample job details (no filtering applied)`);
        workflowLogger.endProcess('TEST MODE Job Search', 'completed', `${jobs.length} jobs found`);
        workflowLogger.logProgress('TEST MODE Search', 100, 100, 'Search completed');
      }
      
    } catch (error) {
      console.error('❌ TEST MODE - Search failed:', error);
      workflowLogger.logError(error.message, 'TEST MODE Search');
      workflowLogger.endProcess('TEST MODE Job Search', 'failed', error.message);
      
      const processInfo = activeProcesses.get(processId);
      if (processInfo) {
        processInfo.status = 'failed';
        processInfo.progress = 100;
        processInfo.jobs = []; // NO FALLBACK DATA - empty array
      }
    }
  }, 2000);

  return {
    processId: processId,
    message: 'Test search started with working scraper (NO DEMO DATA)',
    status: 'running',
    searchUrl: null  // Test mode uses predefined URLs, no search URL
  };
};

module.exports = {
  handleLightModeSearch
};
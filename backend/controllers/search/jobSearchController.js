const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const JobUtils = require('../../utils/jobUtils');
const { validateJobUrl } = require('../../utils/urlUtils');
const { readFromFile } = require('../../utils/dataUtils');
const { activeProcesses, activeJobDetails } = require('./sharedData');
const { scrapeJobDetails } = require('./jobScrapingUtils');
const { getJobUrlsForSearch, scrapeBasicJobInfoFromSearchResults } = require('./searchResultsScraper');
const { batchScrapeJobs } = require('./optimizedJobScrapingUtils');
const UrlBuilder = require('../../scrapers/UrlBuilder');
const workflowLogger = require('../../utils/WorkflowLogger');

/**
 * Start a new job search process
 */
const startJobSearch = async (req, res) => {
  try {
    const { keyword = 'developer', location = 'Melbourne', distance = 50, postedAgo = '7' } = req.body;
    const { testMode = false } = req.body;
    
    workflowLogger.log(`Search request received: ${testMode ? 'TEST MODE' : 'REAL SEARCH'}`, 'system');
    workflowLogger.log(`Parameters: ${keyword} in ${location} (${distance}km, ${postedAgo} days)`, 'system');

  if (testMode) {
      workflowLogger.startProcess('TEST MODE Job Search', 'Using working scraper logic');
    
      // TEST MODE - Use working scraper logic (NO DEMO DATA)
      console.log('🧪 TEST MODE - Using working scraper logic (NO DEMO DATA)');
      const processId = 'test-search-' + Date.now();
    activeProcesses.set(processId, {
      status: 'running',
        progress: 10,
      jobs: [],
        searchParams: { keyword, location, distance, postedAgo }
    });

      // Start async test search using working scraper logic
    setTimeout(async () => {
      try {
          workflowLogger.logProgress('TEST MODE Search', 30, 100, 'Initializing scraper');
          
          // Update progress
          const processInfo = activeProcesses.get(processId);
          if (processInfo) processInfo.progress = 30;
          
          // Use the same URLs that work in test mode - Updated with verified working links
          const sampleUrls = [
            'https://www.seek.com.au/job/85981995?ref=recom-homepage&pos=4&sp=3&origin=jobTitle#sol=941dd2919d55ebc790f6017d3e00d197d7ce28a0',
            'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=f5c442d9c765b69183c0a9f36e76c3773779cff4',
            'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=ac705abd43f8e7aa11c57e26bdd7ef8de3e67313'
          ];
          
          const jobs = [];
          
          // Update progress
          if (processInfo) processInfo.progress = 50;
          workflowLogger.logProgress('TEST MODE Search', 50, 100, 'Starting parallel scraping');
          
          console.log('🧪 TEST MODE - Using unified parallel scraping...');
          workflowLogger.startProcess('Unified Parallel Job Scraping', `${sampleUrls.length} URLs`);
          
                  // ✅ UNIFIED PARALLEL SCRAPING - Same as real search, no delays, true parallel
        try {
          const startTime = Date.now();
          
          // Pass search criteria for featured job validation (use test parameters)
          const searchCriteria = { keyword, location, distance, postedAgo };
          const validJobs = await batchScrapeJobs(sampleUrls, searchCriteria);
          
          const endTime = Date.now();
          const duration = ((endTime - startTime) / 1000).toFixed(1);
          
          console.log(`⚡ TEST MODE - Unified parallel scraping completed in ${duration} seconds!`);
          jobs.push(...validJobs);
          
          console.log(`🚀 TEST MODE - Unified scraping completed! ${validJobs.length}/${sampleUrls.length} jobs successfully scraped`);
          workflowLogger.endProcess('Unified Parallel Job Scraping', 'completed', `${validJobs.length}/${sampleUrls.length} jobs scraped in ${duration}s`);
        } catch (error) {
          console.error('❌ TEST MODE - Unified parallel scraping failed:', error);
          workflowLogger.endProcess('Unified Parallel Job Scraping', 'failed', error.message);
        }
        
        // Update process with completed jobs
        if (processInfo) {
          processInfo.status = 'completed';
          processInfo.progress = 100;
            processInfo.jobs = jobs;
            console.log(`✅ TEST MODE - Completed with ${jobs.length} real job details (NO DEMO DATA)`);
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

    return res.json({ 
      processId: processId, 
        message: 'Test search started with working scraper (NO DEMO DATA)',
      status: 'running' 
    });
  }

    // REAL SEARCH MODE - Use working scraping logic (NO FALLBACK DATA)
    workflowLogger.startProcess('REAL SEARCH Job Search', 'Using working scraper logic');
    console.log('🌙 REAL SEARCH MODE - Using working scraper logic (NO FALLBACK DATA)');

  // Generate unique process ID
    const processId = 'real-search-' + Date.now();
  
  console.log(`🚀 Starting real search process with ID: ${processId}`);
  console.log(`🔍 Search parameters:`, { keyword, location, distance, postedAgo });
  
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
        
        // ✅ REAL DYNAMIC SEARCH - Build search URL and scrape job listings from search results
        console.log(`🎯 REAL SEARCH - Performing dynamic search for: "${keyword}" in "${location}"`);
        workflowLogger.log(`🎯 Real search: "${keyword}" in "${location}" (${distance}, ${postedAgo})`, 'system');
        
        // Build the search URL using user parameters
        const searchUrl = UrlBuilder.buildSeekUrl(keyword, location, distance, postedAgo);
        console.log(`🌐 Built search URL: ${searchUrl}`);
        
        // Get job URLs from search results (limit to 15 for initial implementation)
        console.log('🔍 REAL SEARCH - Getting job URLs from search results...');
        workflowLogger.startProcess('Search Results Scraping', 'Extracting job URLs from search page');
        
        const jobUrls = await getJobUrlsForSearch(keyword, location, distance, postedAgo, 15);
        
        if (jobUrls.length === 0) {
          console.log('❌ REAL SEARCH - No job URLs found from search results');
          workflowLogger.endProcess('Search Results Scraping', 'failed', 'No job URLs found');
          
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
        
        console.log('🚀 REAL SEARCH - Using unified parallel scraping...');
        workflowLogger.startProcess('Unified Parallel Job Scraping', `${sampleUrls.length} URLs`);
        
        // ✅ UNIFIED PARALLEL SCRAPING - Same as light mode, no delays, true parallel
        try {
          const startTime = Date.now();
          
          // Pass search criteria for featured job validation
          const searchCriteria = { keyword, location, distance, postedAgo };
          const validJobs = await batchScrapeJobs(sampleUrls, searchCriteria);
          
          const endTime = Date.now();
          const duration = ((endTime - startTime) / 1000).toFixed(1);
          
          console.log(`⚡ REAL SEARCH - Unified parallel scraping completed in ${duration} seconds!`);
          jobs.push(...validJobs);
          
          console.log(`🚀 REAL SEARCH - Unified scraping completed! ${validJobs.length}/${sampleUrls.length} jobs successfully scraped`);
          workflowLogger.endProcess('Unified Parallel Job Scraping', 'completed', `${validJobs.length}/${sampleUrls.length} jobs scraped in ${duration}s`);
        } catch (error) {
          console.error('❌ REAL SEARCH - Unified parallel scraping failed:', error);
          workflowLogger.endProcess('Unified Parallel Job Scraping', 'failed', error.message);
        }
        
        // Sort jobs by posted time (most recent first) - works for both regular and featured jobs
        if (jobs.length > 0) {
          console.log('🔄 REAL SEARCH - Sorting all jobs by posted time (featured jobs included)...');
          
          // Count featured jobs for logging
          const featuredCount = jobs.filter(job => job.isFeatured).length;
          if (featuredCount > 0) {
            console.log(`🌟 Found ${featuredCount} featured jobs that passed validation - will be sorted with regular jobs`);
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
          processInfo.status = 'completed';
          processInfo.progress = 100;
          processInfo.jobs = jobs;
          console.log(`✅ REAL SEARCH - Completed with ${jobs.length} real job details (NO FALLBACK DATA)`);
          if (jobs.length > 0) {
            console.log('📋 REAL SEARCH - Sorted job list:', jobs.map(j => ({ id: j.id, title: j.title, postedAgo: j.postedAgo })));
          } else {
            console.log('📋 REAL SEARCH - No jobs successfully scraped');
          }
          workflowLogger.endProcess('REAL SEARCH Job Search', 'completed', `${jobs.length} jobs found`);
          workflowLogger.logProgress('REAL SEARCH Search', 100, 100, 'Search completed');
        }
        
      } catch (error) {
        console.error('❌ REAL SEARCH - Critical error:', error);
        const processInfo = activeProcesses.get(processId);
        if (processInfo) {
          processInfo.status = 'failed';
          processInfo.progress = 100;
          processInfo.jobs = []; // NO FALLBACK DATA - empty array
        }
        workflowLogger.logError(error.message, 'REAL SEARCH Search');
        workflowLogger.endProcess('REAL SEARCH Job Search', 'failed', error.message);
      }
    }, 2000); // Start after 2 seconds

    return res.json({ 
    processId: processId,
      message: 'Real search started with working scraper (NO FALLBACK DATA)', 
    status: 'running'
  });
  } catch (error) {
    console.error('❌ Overall search failed:', error);
    workflowLogger.logError(error.message, 'Overall Search');
    return res.status(500).json({ message: 'Failed to start search process', error: error.message });
  }
};

module.exports = {
  startJobSearch
}; 
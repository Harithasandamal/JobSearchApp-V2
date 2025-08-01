const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const JobUtils = require('../../utils/jobUtils');
const { validateJobUrl } = require('../../utils/urlUtils');
const { readFromFile } = require('../../utils/dataUtils');
const { activeProcesses, activeJobDetails } = require('./sharedData');
const { scrapeAllJobsOptimized, scrapeAllJobsUnified } = require('./jobScrapingUtils');
const { getJobUrlsForSearch } = require('./searchResultsScraper');

const UrlBuilder = require('../../scrapers/UrlBuilder');
const workflowLogger = require('../../utils/WorkflowLogger');

/**
 * Validate job against search criteria to filter out SEEK's suggestions
 * Focus on keyword and posted time only (location/distance handled by SEEK)
 * @param {Object} job - Job object with title, company, location, etc.
 * @param {Object} searchCriteria - Original search criteria
 * @returns {Object} - {isValid: boolean, reasons: string[]} 
 */
const validateJobAgainstCriteria = (job, searchCriteria) => {
  const { keyword, postedAgo } = searchCriteria;
  const reasons = [];
  let isValid = true;
  
  // 1. KEYWORD VALIDATION (if provided)
  if (keyword && keyword.trim() !== '') {
    const keywordLower = keyword.toLowerCase().trim();
    const titleLower = (job.title || '').toLowerCase();
    
    if (!titleLower.includes(keywordLower)) {
      isValid = false;
      reasons.push(`Title doesn't contain "${keyword}"`);
    }
  }
  
  // 2. POSTED TIME VALIDATION
  if (postedAgo && job.postedAgo) {
    const maxDays = getMaxDaysFromPostedAgo(postedAgo);
    const jobDays = parseJobPostedAgeToDays(job.postedAgo);
    
    if (jobDays > maxDays) {
      isValid = false;
      reasons.push(`Posted ${job.postedAgo} exceeds ${postedAgo} limit`);
    }
  }
  
  return { isValid, reasons };
};

/**
 * Convert posted ago search criteria to max days
 */
const getMaxDaysFromPostedAgo = (postedAgo) => {
  const postedAgoLower = (postedAgo || '').toLowerCase();
  if (postedAgoLower.includes('1 day')) return 1;
  if (postedAgoLower.includes('3 days')) return 3;
  if (postedAgoLower.includes('7 days')) return 7;
  if (postedAgoLower.includes('14 days')) return 14;
  if (postedAgoLower.includes('30 days')) return 30;
  return 30; // Default to 30 days
};

/**
 * Parse job posted ago to days for comparison
 */
const parseJobPostedAgeToDays = (postedAgo) => {
  if (!postedAgo) return 0;
  
  const lower = postedAgo.toLowerCase();
  
  // Handle days
  const dayMatch = lower.match(/(\d+)\s*days?/);
  if (dayMatch) return parseInt(dayMatch[1]);
  
  // Handle hours (convert to fraction of day)
  const hourMatch = lower.match(/(\d+)\s*hours?/);
  if (hourMatch) return Math.ceil(parseInt(hourMatch[1]) / 24);
  
  // Handle minutes (count as same day)
  const minuteMatch = lower.match(/(\d+)\s*minutes?/);
  if (minuteMatch) return 0;
  
  return 0; // Default to current day
};

/**
 * Display validation table showing all jobs with tick/cross status
 * @param {Array} validationResults - Array of {job, validation} objects
 * @param {Object} searchCriteria - Original search criteria
 */
const displayValidationTable = (validationResults, searchCriteria) => {
  const { keyword, location, distance, postedAgo } = searchCriteria;
  
  console.log('\n📊 VALIDATION RESULTS TABLE');
  console.log('=' .repeat(120));
  console.log(`🔍 Search Criteria: ${keyword || 'Any'} in ${location} (${distance}, ${postedAgo})`);
  
  if (keyword) {
    console.log(`✅ Validating: Keyword Match + Posted Time | 🔄 Trusting SEEK: Location + Distance`);
  } else {
    console.log(`✅ Validating: Posted Time Only (keyword skipped for test mode) | 🔄 Trusting SEEK: Location + Distance`);
  }
  console.log('-' .repeat(120));
  console.log('Status | Job Title                                    | Company              | Location           | Posted   | Validation Issues');
  console.log('-' .repeat(120));
  
  validationResults.forEach((result, index) => {
    const { job, validation } = result;
    const status = validation.isValid ? '  ✅  ' : '  ❌  ';
    const title = (job.title || '').substring(0, 40).padEnd(40);
    const company = (job.company || '').substring(0, 18).padEnd(18);
    const location = (job.location || '').substring(0, 16).padEnd(16);
    const posted = (job.postedAgo || '').substring(0, 8).padEnd(8);
    const issues = validation.isValid ? 
      (keyword ? 'Keyword + Time ✅' : 'Time ✅ (keyword skipped)') : 
      validation.reasons.join('; ');
    
    console.log(`${status} | ${title} | ${company} | ${location} | ${posted} | ${issues}`);
  });
  
  console.log('-' .repeat(120));
  const validCount = validationResults.filter(r => r.validation.isValid).length;
  const totalCount = validationResults.length;
  if (keyword) {
    console.log(`📈 Summary: ${validCount}/${totalCount} jobs match keyword + time criteria (${totalCount - validCount} filtered out)`);
  } else {
    console.log(`📈 Summary: ${validCount}/${totalCount} jobs match time criteria (${totalCount - validCount} filtered out, keyword validation skipped)`);
  }
  console.log(`📍 Note: Location/Distance validation handled by SEEK's search engine`);
  console.log('=' .repeat(120) + '\n');
};

/**
 * Filter jobs based on keyword and posted time criteria to remove SEEK suggestions
 * @param {Array} jobs - Array of job objects
 * @param {Object} searchCriteria - Original search criteria
 * @returns {Array} - Filtered array of jobs that match keyword and time criteria
 */
const filterJobsByCriteria = (jobs, searchCriteria) => {
  // Validate each job and collect results for table display
  const validationResults = jobs.map(job => ({
    job,
    validation: validateJobAgainstCriteria(job, searchCriteria)
  }));
  
  // Display comprehensive validation table
  displayValidationTable(validationResults, searchCriteria);
  
  // Return only valid jobs
  const filteredJobs = validationResults
    .filter(result => result.validation.isValid)
    .map(result => result.job);
  
  return filteredJobs;
};

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
            'https://www.seek.com.au/job/85981995?ref=recom-homepage&pos=4&sp=3&origin=jobTitle#sol=941dd2919d55ebc790f6017d3e00d197d7ce28a0',
            'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=f5c442d9c765b69183c0a9f36e76c3773779cff4',
            'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=ac705abd43f8e7aa11c57e26bdd7ef8de3e67313'
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

    return res.json({ 
      processId: processId, 
        message: 'Test search started with working scraper (NO DEMO DATA)',
      status: 'running',
      searchUrl: null  // Test mode uses predefined URLs, no search URL
    });
  }

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
          
          // ✅ CROSS VALIDATION - Filter jobs by keyword and posted time  
          const searchCriteria = { keyword, location, distance, postedAgo };
          const validatedJobs = filterJobsByCriteria(formattedJobs, searchCriteria);
          
          workflowLogger.endProcess('Unified Real Job Scraping', 'completed', `${validatedJobs.length}/${sampleUrls.length} jobs match keyword+time criteria`);
          jobs.push(...validatedJobs);
          
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
          if (jobs.length === 0) {
            processInfo.status = 'failed';
            processInfo.progress = 100;
            processInfo.jobs = [];
            console.log(`❌ REAL SEARCH - No jobs match keyword+time criteria despite finding ${jobUrls.length} URLs`);
            workflowLogger.endProcess('REAL SEARCH Job Search', 'failed', 'No jobs match keyword+time criteria');
          } else {
            processInfo.status = 'completed';
            processInfo.progress = 100;
            processInfo.jobs = jobs;
                    console.log(`✅ REAL SEARCH - Completed with ${jobs.length} validated job details (keyword+time validated)`);
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
        workflowLogger.logError(error.message, 'REAL SEARCH Search');
        workflowLogger.endProcess('REAL SEARCH Job Search', 'failed', error.message);
      }
    }, 2000); // Start after 2 seconds

    return res.json({ 
    processId: processId,
      message: 'Real search started with working scraper (NO FALLBACK DATA)', 
    status: 'running',
      searchUrl: searchUrl  // Include the search URL for frontend comparison
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
const puppeteer = require('puppeteer');
const JobUtils = require('../../utils/jobUtils');

/**
 * UNIFIED FAST PARALLEL SCRAPER - Single-pass parallel scraping for maximum speed
 * @param {Array} urls - Array of job URLs to scrape
 * @returns {Array} Array of job details
 */
const scrapeAllJobsUnified = async (urls) => {
  const OptimizedSeekScraper = require('../../utils/OptimizedSeekScraper');
  const scraper = new OptimizedSeekScraper();
  // Use 5 browser instances for optimal speed as requested
  scraper.maxBrowsers = 5;
  console.log(`🚀 UNIFIED PARALLEL SCRAPING: ${urls.length} jobs (single-pass for speed)`);
  
  // Single fast parallel run with enhanced retry logic
  let result = await scraper.scrapeAllJobsParallel(urls, 1);
  let jobs = result.jobs;
  
  // Enhanced retry logic for failed jobs with exponential backoff
  if (jobs.length < urls.length) {
    const missingUrls = urls.filter(url => !jobs.find(j => j.url === url));
    console.log(`🔁 Retrying ${missingUrls.length} failed jobs with enhanced strategy...`);
    
    // Retry with different browser configuration
    scraper.maxBrowsers = Math.min(3, missingUrls.length); // Use fewer browsers for retry
    const retryResult = await scraper.scrapeAllJobsParallel(missingUrls, 2);
    
    // Add successful retry jobs
    jobs = jobs.concat(retryResult.jobs);
    
    // Final retry for any still missing jobs with single browser
    const stillMissing = urls.filter(url => !jobs.find(j => j.url === url));
    if (stillMissing.length > 0) {
      console.log(`🔁 Final retry for ${stillMissing.length} stubborn jobs...`);
      scraper.maxBrowsers = 1; // Single browser for final attempt
      const finalRetryResult = await scraper.scrapeAllJobsParallel(stillMissing, 3);
      jobs = jobs.concat(finalRetryResult.jobs);
    }
    
    console.log(`✅ After enhanced retry: ${jobs.length}/${urls.length} jobs scraped successfully`);
  }
  
  if (jobs && jobs.length) {
    console.log(`✅ Unified scraping complete: ${jobs.length}/${urls.length} jobs scraped successfully`);
    return jobs.map(job => JobUtils.processJob(job));
  } else {
    console.log(`❌ Unified scraping failed - no jobs scraped`);
    return [];
  }
};

/**
 * LEGACY OPTIMIZED SCRAPER - Kept for backward compatibility (slow 10-iteration loop)
 * @param {Array} urls - Array of job URLs to scrape
 * @returns {Array} Array of job details
 */
const scrapeAllJobsOptimized = async (urls) => {
  const OptimizedSeekScraper = require('../../utils/OptimizedSeekScraper');
  const scraper = new OptimizedSeekScraper();
  
  console.log(`🚀 OPTIMIZED PARALLEL SCRAPING: ${urls.length} jobs`);
  
  // Run optimization loop for best performance
  const result = await scraper.optimizeScraping(urls);
  
  if (result && result.jobs) {
    console.log(`✅ Optimization complete: ${result.jobs.length} jobs scraped successfully`);
    return result.jobs.map(job => JobUtils.processJob(job));
  } else {
    throw new Error('Optimization failed to produce any results');
  }
};

/**
 * Legacy single job scraper - used for compatibility
 */
const scrapeJobDetails = async (url) => {
  const OptimizedSeekScraper = require('../../utils/OptimizedSeekScraper');
  const scraper = new OptimizedSeekScraper();
  
  const result = await scraper.scrapeAllJobsParallel([url], 1);
  
  if (result && result.jobs.length > 0) {
    return JobUtils.processJob(result.jobs[0]);
  } else {
    throw new Error(`Failed to scrape job from ${url}`);
  }
};

/**
 * Fast batch scraping for test mode - uses unified parallel method
 * @param {Array} urls - Array of job URLs to scrape
 * @param {Object} searchCriteria - Search criteria for validation
 * @returns {Array} Array of job details
 */
const batchScrapeJobs = async (urls, searchCriteria) => {
  console.log(`🚀 BATCH SCRAPING: ${urls.length} jobs (using unified method)`);
  
  // Use the unified scraping method - same as real mode
  return await scrapeAllJobsUnified(urls);
};

module.exports = {
  scrapeJobDetails,
  scrapeAllJobsOptimized,
  scrapeAllJobsUnified,
  batchScrapeJobs
}; 
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
  // Limit concurrency to 3 browser instances
  scraper.maxBrowsers = 3;
  console.log(`🚀 UNIFIED PARALLEL SCRAPING: ${urls.length} jobs (single-pass for speed)`);
  
  // Single fast parallel run - no slow optimization loops
  let result = await scraper.scrapeAllJobsParallel(urls, 1);
  let jobs = result.jobs;
  // Retry any missing jobs once
  if (jobs.length < urls.length) {
    const missingUrls = urls.filter(url => !jobs.find(j => j.url === url));
    console.log(`🔁 Retrying ${missingUrls.length} missing jobs...`);
    const retryResult = await scraper.scrapeAllJobsParallel(missingUrls, 2);
    jobs = jobs.concat(retryResult.jobs);
    console.log(`✅ After retry: ${jobs.length}/${urls.length} jobs scraped successfully`);
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
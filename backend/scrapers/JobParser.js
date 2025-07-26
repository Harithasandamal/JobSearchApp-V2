const UrlBuilder = require('./UrlBuilder');
const { scrapeJobDetails } = require('../controllers/search/jobScrapingUtils');
const JobUtils = require('../utils/jobUtils');
const JobExtractor = require('./jobExtraction');
const JobFilter = require('./jobFiltering');

class JobParser {
  /**
   * Extract job data from SEEK page
   * @param {Object} page - Puppeteer page object
   * @param {Object} config - Search configuration
   * @returns {Array} - Array of extracted job objects
   */
  static async extractJobData(page, config) {
    try {
      // Extract jobs using the dedicated extraction module
      let jobs = await JobExtractor.extractJobData(page, config);
      
      console.log(`📋 Jobs extracted from search results:`, jobs.map(j => `${j.title} @ ${j.company} (${j.location}) - ${j.postedAgo}`));
      
      // SIMPLIFIED: Use unified job processing instead of complex multi-layer logic
      console.log(`🔄 Processing ${jobs.length} jobs with unified JobUtils...`);
      jobs = JobUtils.processJobs(jobs);
      
      console.log(`✅ Processed jobs:`, jobs.map(j => `${j.title} @ ${j.company} (${j.location}) - ${j.postedAgo}`));
      
      // Apply search filters using the dedicated filtering module
      const filteredJobs = await JobFilter.filterJobs(jobs, config);
      
      console.log(`✅ Found ${jobs.length} jobs, ${filteredJobs.length} match criteria`);
      return filteredJobs;
    } catch (error) {
      console.error('❌ Error extracting job data:', error);
      return [];
    }
  }
}

module.exports = JobParser; 
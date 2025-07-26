/**
 * Job Filtering Module
 * Handles filtering jobs based on search criteria
 */

const UrlBuilder = require('./UrlBuilder');

class JobFilter {
  /**
   * Check if job location matches search criteria
   * @param {string} jobLoc - Job location
   * @param {string} searchLoc - Search location
   * @returns {boolean} - Whether locations match
   */
  static fuzzyLocationMatch(jobLoc, searchLoc) {
    if (!jobLoc || !searchLoc) return true;
    
    // Since SEEK already filters by distance, be very lenient with location matching
    // SEEK's distance filter is more accurate than our text matching
    const jobLower = jobLoc.toLowerCase();
    const searchLower = searchLoc.toLowerCase();
    
    // If job location contains the search location, it's a match
    if (jobLower.includes(searchLower)) return true;
    
    // Extract key location parts for matching
    const jobParts = jobLower.split(/[,\s]+/);
    const searchParts = searchLower.split(/[,\s]+/);
    
    // If any significant part matches, it's a match
    for (const searchPart of searchParts) {
      if (searchPart.length > 2) { // Ignore very short parts
        for (const jobPart of jobParts) {
          if (jobPart.includes(searchPart) || searchPart.includes(jobPart)) {
            return true;
          }
        }
      }
    }
    
    // If both contain the same state (VIC, NSW, QLD, etc.), it's a match
    const states = ['vic', 'nsw', 'qld', 'wa', 'sa', 'nt', 'act', 'tas'];
    for (const state of states) {
      if (jobLower.includes(state) && searchLower.includes(state)) {
        return true;
      }
    }
    
    // Be very lenient - if SEEK returned it, it's probably relevant
    return true;
  }

  /**
   * Strict keyword matching - only exact keyword presence in title
   * @param {string} title - Job title
   * @param {string} keyword - Search keyword
   * @returns {boolean} - Whether keyword matches
   */
  static keywordMatch(title, keyword) {
    if (!keyword || !keyword.trim()) return true;
    if (!title) return false;
    
    const titleLower = title.toLowerCase();
    const keywordLower = keyword.toLowerCase().trim();
    
    // STRICT MATCH: Only include jobs if the exact keyword appears in the title
    return titleLower.includes(keywordLower);
  }

  /**
   * Filter jobs based on search criteria
   * @param {Array} jobs - Array of job objects
   * @param {Object} config - Search configuration
   * @returns {Array} - Filtered job objects
   */
  static async filterJobs(jobs, config) {
    const searchLoc = config.location;
    const searchKeyword = config.keyword;
    const searchDays = parseInt(UrlBuilder.convertPostedAgoToSeekFormat(config.postedAgo), 10);
    
    console.log(`🔍 Filtering ${jobs.length} jobs with criteria:`);
    console.log(`  - Location: ${searchLoc}`);
    console.log(`  - Keyword: ${searchKeyword}`);
    console.log(`  - Max days: ${searchDays}`);
    
    const filteredJobs = [];
    
    for (const job of jobs) {
      // Location filter - more lenient since SEEK already handles location filtering
      const locationMatch = this.fuzzyLocationMatch(job.location, searchLoc);
      console.log(`  📍 Location: "${job.location}" vs "${searchLoc}" = ${locationMatch}`);
      if (!locationMatch) continue;
      
      // Keyword filter - more lenient
      const keywordMatch = this.keywordMatch(job.title, searchKeyword);
      console.log(`  🔍 Keyword: "${job.title}" contains "${searchKeyword}" = ${keywordMatch}`);
      if (!keywordMatch) continue;
      
      // Date filter - handle featured jobs properly
      const daysAgo = UrlBuilder.parsePostedAgoToDays(job.postedAgo);
      console.log(`  📅 Date: "${job.postedAgo}" parsed as ${daysAgo} days vs max ${searchDays} days`);
      
      if (daysAgo === -1) {
        // Featured job - include it if it meets location and keyword criteria
        console.log(`  ✅ Featured job meets location and keyword criteria - including`);
        filteredJobs.push(job);
      } else if (daysAgo !== Infinity && daysAgo <= searchDays) {
        console.log(`  ✅ Job passed all filters`);
        filteredJobs.push(job);
      } else {
        console.log(`  ❌ Job excluded: daysAgo=${daysAgo}, maxDays=${searchDays}`);
      }
    }
    
    return filteredJobs;
  }
}

module.exports = JobFilter; 
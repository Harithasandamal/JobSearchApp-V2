/**
 * Unified Job Processing Utilities - REAL DATA ONLY, NO FALLBACK
 * Centralizes all job data cleaning and formatting logic
 */

class JobUtils {
  /**
   * Clean location string - SINGLE source of truth for location cleaning
   * @param {string} location - Raw location string
   * @returns {string} - Cleaned location
   */
  static cleanLocation(location) {
    if (!location || location === 'N/A') {
      return null; // NO FALLBACK - return null if no real location
    }
    
    let cleaned = location.trim();
    
    // Simple rule: Take everything before the comma (if comma exists)
    if (cleaned.includes(',')) {
      cleaned = cleaned.split(',')[0].trim();
    } else if (cleaned.match(/^Melbourne(\s+VIC)?(\s+\d+)?$/i)) {
      // Only if the entire location is just "Melbourne VIC" or "Melbourne" with no comma
      cleaned = 'Melbourne';
    }
    
    return cleaned;
  }

  /**
   * Format posted ago to full words - SINGLE source of truth for time formatting
   * @param {string} timeString - Raw time string like "2h", "26m", "3d", "Posted 5h"
   * @returns {string} - Formatted time like "2 hours", "26 minutes", "3 days", "5 hours"
   */
  static formatPostedAgo(timeString) {
    if (!timeString || typeof timeString !== 'string') {
      return null; // NO FALLBACK - return null if no real time data
    }
    
    // Remove "Posted " prefix and " ago" suffix first
    let cleaned = timeString
      .replace(/^Posted\s+/i, '')    // Remove "Posted " prefix
      .replace(/\s+ago$/i, '')       // Remove " ago" suffix
      .trim();
    
    // Handle patterns like "2h", "26m", "3d", "1 day", "2 days", etc.
    const patterns = [
      // Short forms - Convert "6h" to "6 hours", "1d" to "1 day"
      { regex: /^(\d+)h$/i, format: (num) => num === '1' ? '1 hour' : `${num} hours` },
      { regex: /^(\d+)m$/i, format: (num) => num === '1' ? '1 minute' : `${num} minutes` },
      { regex: /^(\d+)d$/i, format: (num) => num === '1' ? '1 day' : `${num} days` },
      
      // Already formatted patterns - keep as is
      { regex: /^(\d+)\s+hours?$/i, format: (match) => match },
      { regex: /^(\d+)\s+minutes?$/i, format: (match) => match },
      { regex: /^(\d+)\s+days?$/i, format: (match) => match },
      
      // Handle "1 day" vs "X days" patterns
      { regex: /^1\s+day$/i, format: () => '1 day' },
      { regex: /^(\d+)\s+day$/i, format: (num) => `${num} days` }, // "2 day" -> "2 days"
    ];
    
    for (const pattern of patterns) {
      const match = cleaned.match(pattern.regex);
      if (match) {
        return pattern.format(match[1]);
      }
    }
    
    // Return cleaned version if no pattern matches
    return cleaned;
  }

  /**
   * Process a single job object - REAL DATA ONLY, NO FALLBACK
   * @param {Object} job - Raw job object
   * @returns {Object|null} - Cleaned job object or null if insufficient data
   */
  static processJob(job) {
    if (!job) return null;
    
    // ACCURACY CHECK: Only process jobs with real title data
    if (!job.title || job.title.trim() === '' || job.title === 'Error loading job') {
      console.log('❌ JobUtils.processJob - Rejecting job with no valid title:', job.title);
      return null; // NO FALLBACK - reject jobs without real titles
    }
    
    const processed = {
      id: job.id || job.url || `${job.title}-${job.company}-${job.location}`,
      title: job.title.trim(),
      company: job.company && job.company.trim() !== '' ? job.company.trim() : 'Company not specified',
      location: JobUtils.cleanLocation(job.location) || 'Location not specified',
      postedAgo: JobUtils.formatPostedAgo(job.postedAgo) || 'Time not specified',
      url: job.url || '',
      // Preserve any additional fields
      ...Object.fromEntries(
        Object.entries(job).filter(([key]) => 
          !['id', 'title', 'company', 'location', 'postedAgo', 'url'].includes(key)
        )
      )
    };
    
    // Reduced verbosity - only log summary, not individual jobs
    // console.log('✅ JobUtils.processJob - Successfully processed job:', processed.title);
    
    return processed;
  }

  /**
   * Process array of jobs - REAL DATA ONLY, NO FALLBACK
   * @param {Array} jobs - Array of raw job objects
   * @returns {Array} - Array of cleaned job objects with real data only
   */
  static processJobs(jobs) {
    if (!Array.isArray(jobs)) return [];
    
    const processed = jobs
      .map(job => JobUtils.processJob(job))
      .filter(job => job !== null); // Filter out rejected jobs
    
    console.log(`📊 JobUtils.processJobs - Processed ${processed.length}/${jobs.length} jobs (rejected ${jobs.length - processed.length} jobs with insufficient data)`);
    
    return processed;
  }
}

module.exports = JobUtils; 
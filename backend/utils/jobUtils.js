/**
 * Unified Job Processing Utilities
 * Centralizes all job data cleaning and formatting logic
 */

class JobUtils {
  /**
   * Clean location string - SINGLE source of truth for location cleaning
   * @param {string} location - Raw location string
   * @returns {string} - Cleaned location
   */
  static cleanLocation(location) {
    if (!location || location === 'N/A' || location === 'Unknown Location') {
      return 'Melbourne';
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
   * @param {string} timeString - Raw time string like "2h", "26m", "3d"
   * @returns {string} - Formatted time like "2 hours", "26 minutes", "3 days"
   */
  static formatPostedAgo(timeString) {
    if (!timeString || typeof timeString !== 'string') {
      return timeString;
    }
    
    // Remove " ago" suffix first
    let cleaned = timeString.replace(/\s+ago$/i, '').trim();
    
    // Handle patterns like "2h", "26m", "3d", "1 day", "2 days", etc.
    const patterns = [
      // Short forms - FIXED: Convert "6h" to "6 hours", "1d" to "1 day"
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
    
    // Return original if no pattern matches
    return cleaned;
  }

  /**
   * Process a single job object - SINGLE source of truth for job processing
   * @param {Object} job - Raw job object
   * @returns {Object} - Cleaned job object
   */
  static processJob(job) {
    if (!job) return null;
    
    return {
      id: job.id || job.url || `${job.title}-${job.company}-${job.location}`,
      title: job.title || 'Unknown Title',
      company: job.company || 'Unknown Company',
      location: JobUtils.cleanLocation(job.location),
      postedAgo: JobUtils.formatPostedAgo(job.postedAgo),
      url: job.url || '',
      // Preserve any additional fields
      ...Object.fromEntries(
        Object.entries(job).filter(([key]) => 
          !['id', 'title', 'company', 'location', 'postedAgo', 'url'].includes(key)
        )
      )
    };
  }

  /**
   * Process array of jobs - SINGLE source of truth for job array processing
   * @param {Array} jobs - Array of raw job objects
   * @returns {Array} - Array of cleaned job objects
   */
  static processJobs(jobs) {
    if (!Array.isArray(jobs)) return [];
    
    return jobs
      .map(job => JobUtils.processJob(job))
      .filter(job => job !== null);
  }
}

module.exports = JobUtils; 
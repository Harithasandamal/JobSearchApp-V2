/**
 * Featured Job Validator - Validates featured jobs against search criteria
 * Featured jobs need to be checked to ensure they match the user's search parameters
 */

const UrlBuilder = require('../scrapers/UrlBuilder');

/**
 * Validate a featured job against search criteria
 * @param {Object} job - Job object with title, company, location, postedAgo, url
 * @param {Object} searchCriteria - Search criteria object
 * @param {string} searchCriteria.keyword - Job keyword/title (optional)
 * @param {string} searchCriteria.location - Location to search in
 * @param {string} searchCriteria.distance - Search distance (e.g., "5 km")
 * @param {string} searchCriteria.postedAgo - How long ago jobs were posted (e.g., "3 days")
 * @returns {Object} Validation result with isValid boolean and reasons
 */
const validateFeaturedJob = (job, searchCriteria) => {
  console.log(`🎯 Validating featured job: "${job.title}" against search criteria`);
  console.log(`📋 Search criteria: keyword="${searchCriteria.keyword || 'none'}", location="${searchCriteria.location}", postedAgo="${searchCriteria.postedAgo}"`);
  
  const validation = {
    isValid: true,
    reasons: [],
    warnings: []
  };

  // 1. Validate Posted Ago - Check if job is within the time range
  const jobDays = UrlBuilder.parsePostedAgoToDays(job.postedAgo);
  const maxDays = getMaxDaysFromPostedAgo(searchCriteria.postedAgo);
  
  console.log(`📅 Job posted: ${job.postedAgo} (${jobDays} days), Max allowed: ${maxDays} days`);
  
  if (jobDays === -1) {
    // Special case for featured jobs that need detail scraping
    validation.warnings.push('Featured job requires detail scraping for accurate date');
    console.log('⚠️ Featured job needs detail scraping for posted date validation');
  } else if (jobDays > maxDays && jobDays !== Infinity) {
    validation.isValid = false;
    validation.reasons.push(`Job posted ${jobDays} days ago, exceeds limit of ${maxDays} days`);
    console.log(`❌ Job too old: ${jobDays} days > ${maxDays} days`);
  } else if (jobDays === Infinity) {
    validation.warnings.push('Could not parse posted date - assuming valid');
    console.log('⚠️ Could not parse posted date, allowing job');
  } else {
    console.log(`✅ Posted date valid: ${jobDays} days <= ${maxDays} days`);
  }

  // 2. Validate Keyword Match - If keyword is specified, check if it matches job title
  if (searchCriteria.keyword && searchCriteria.keyword.trim()) {
    const keyword = searchCriteria.keyword.toLowerCase().trim();
    const jobTitle = job.title.toLowerCase();
    
    console.log(`🔍 Checking keyword match: "${keyword}" in "${jobTitle}"`);
    
    // Check if keyword appears in job title (flexible matching)
    const keywordWords = keyword.split(/\s+/);
    const titleWords = jobTitle.split(/\s+/);
    
    let keywordMatch = false;
    
    // Check if all keyword words appear in title (not necessarily consecutive)
    if (keywordWords.every(kw => titleWords.some(tw => tw.includes(kw) || kw.includes(tw)))) {
      keywordMatch = true;
    } else if (jobTitle.includes(keyword)) {
      keywordMatch = true;
    }
    
    if (!keywordMatch) {
      validation.isValid = false;
      validation.reasons.push(`Job title "${job.title}" does not match keyword "${searchCriteria.keyword}"`);
      console.log(`❌ Keyword mismatch: "${keyword}" not found in "${jobTitle}"`);
    } else {
      console.log(`✅ Keyword match: "${keyword}" found in "${jobTitle}"`);
    }
  } else {
    console.log('✅ No keyword specified, skipping keyword validation');
  }

  // 3. Validate Location - Check if job location is reasonable for the search area
  // Note: This is a basic check since featured jobs might have broader location descriptions
  if (job.location && searchCriteria.location) {
    const jobLocation = job.location.toLowerCase();
    const searchLocation = searchCriteria.location.toLowerCase();
    
    console.log(`📍 Checking location relevance: job="${jobLocation}", search="${searchLocation}"`);
    
    // Basic location validation - allow broader matches for featured jobs
    const locationWords = searchLocation.split(/\s+/);
    const jobLocationWords = jobLocation.split(/\s+/);
    
    // Check for common location terms or state matches
    const hasLocationMatch = locationWords.some(locWord => 
      jobLocationWords.some(jobLocWord => 
        jobLocWord.includes(locWord) || locWord.includes(jobLocWord)
      )
    ) || jobLocation.includes('vic') || jobLocation.includes('melbourne') || 
       jobLocation.includes('australia');
    
    if (!hasLocationMatch) {
      validation.warnings.push(`Featured job location "${job.location}" may not match search area "${searchCriteria.location}"`);
      console.log(`⚠️ Location mismatch warning: "${jobLocation}" vs "${searchLocation}"`);
    } else {
      console.log(`✅ Location match: "${jobLocation}" relevant to "${searchLocation}"`);
    }
  }

  // Log final validation result
  const result = validation.isValid ? 'VALID' : 'INVALID';
  console.log(`🎯 Featured job validation result: ${result}`);
  if (validation.reasons.length > 0) {
    console.log(`❌ Rejection reasons: ${validation.reasons.join(', ')}`);
  }
  if (validation.warnings.length > 0) {
    console.log(`⚠️ Warnings: ${validation.warnings.join(', ')}`);
  }

  return validation;
};

/**
 * Convert postedAgo search parameter to maximum days
 * @param {string} postedAgo - Posted ago parameter (e.g., "3 days", "7 days")
 * @returns {number} Maximum number of days allowed
 */
const getMaxDaysFromPostedAgo = (postedAgo) => {
  if (!postedAgo) return 7; // Default to 7 days
  
  const lower = postedAgo.toLowerCase().trim();
  
  // Extract number from string
  const match = lower.match(/(\d+)/);
  if (match) {
    const days = parseInt(match[1]);
    
    // Handle different units
    if (lower.includes('day')) {
      return days;
    } else if (lower.includes('week')) {
      return days * 7;
    } else if (lower.includes('month')) {
      return days * 30;
    } else {
      // Assume days if no unit specified
      return days;
    }
  }
  
  // Fallback mapping
  switch (lower) {
    case '1 day': return 1;
    case '3 days': return 3;
    case '7 days': return 7;
    case '14 days': return 14;
    case '30 days': return 30;
    default: return 7;
  }
};

/**
 * Filter featured jobs based on search criteria validation
 * @param {Array} jobs - Array of job objects
 * @param {Object} searchCriteria - Search criteria object
 * @returns {Array} Filtered array of valid jobs with validation info
 */
const filterFeaturedJobs = (jobs, searchCriteria) => {
  console.log(`\n🎯 FEATURED JOB VALIDATION - Processing ${jobs.length} jobs`);
  console.log(`📋 Search criteria: ${JSON.stringify(searchCriteria)}`);
  
  const validatedJobs = [];
  let featuredCount = 0;
  let validFeaturedCount = 0;
  
  jobs.forEach((job, index) => {
    // Check if this is a featured job (could be based on URL patterns, special markers, etc.)
    const isFeatured = isFeaturedJob(job);
    
    if (isFeatured) {
      featuredCount++;
      console.log(`\n🌟 Processing featured job ${featuredCount}: "${job.title}"`);
      
      const validation = validateFeaturedJob(job, searchCriteria);
      
      if (validation.isValid) {
        validFeaturedCount++;
        validatedJobs.push({
          ...job,
          isFeatured: true,
          validation: validation
        });
        console.log(`✅ Featured job ${featuredCount} approved for inclusion`);
      } else {
        console.log(`❌ Featured job ${featuredCount} rejected: ${validation.reasons.join(', ')}`);
      }
    } else {
      // Regular job - include as-is (already validated by search)
      validatedJobs.push({
        ...job,
        isFeatured: false
      });
    }
  });
  
  console.log(`\n🎯 FEATURED JOB VALIDATION SUMMARY:`);
  console.log(`   - Total jobs processed: ${jobs.length}`);
  console.log(`   - Featured jobs found: ${featuredCount}`);
  console.log(`   - Valid featured jobs: ${validFeaturedCount}`);
  console.log(`   - Final job count: ${validatedJobs.length}`);
  
  return validatedJobs;
};

/**
 * Determine if a job is featured based on various indicators
 * @param {Object} job - Job object
 * @returns {boolean} True if job appears to be featured
 */
const isFeaturedJob = (job) => {
  // Check URL patterns that indicate featured jobs
  if (job.url && (
    job.url.includes('featured') || 
    job.url.includes('premium') || 
    job.url.includes('sponsored') ||
    job.url.includes('promoted')
  )) {
    return true;
  }
  
  // Check job title or company for featured indicators
  const title = (job.title || '').toLowerCase();
  const company = (job.company || '').toLowerCase();
  
  if (title.includes('featured') || title.includes('sponsored') ||
      company.includes('featured') || company.includes('sponsored')) {
    return true;
  }
  
  // Check posted ago for featured job patterns
  const postedAgo = (job.postedAgo || '').toLowerCase();
  if (postedAgo.includes('featured') || postedAgo.includes('sponsored') || postedAgo.includes('promoted')) {
    return true;
  }
  
  // Additional heuristics could be added here
  return false;
};

module.exports = {
  validateFeaturedJob,
  filterFeaturedJobs,
  isFeaturedJob,
  getMaxDaysFromPostedAgo
};
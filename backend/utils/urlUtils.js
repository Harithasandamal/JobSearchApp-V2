const path = require('path');

/**
 * Build SEEK search URL with parameters
 * @param {Object} params - Search parameters
 * @param {string} params.keyword - Search keyword (optional)
 * @param {string} params.location - Location
 * @param {string} params.distance - Distance
 * @param {string} params.postedAgo - Posted within time
 * @returns {string} - Formatted SEEK URL
 */
const buildSeekSearchUrl = (params) => {
  const { keyword, location, distance, postedAgo } = params;
  
  let url = 'https://www.seek.com.au/jobs?';
  const queryParams = [];
  
  // Add keyword if provided
  if (keyword && keyword.trim()) {
    queryParams.push(`keywords=${encodeURIComponent(keyword.trim())}`);
  }
  
  // Add location
  if (location) {
    queryParams.push(`location=${encodeURIComponent(location)}`);
  }
  
  // Add distance
  if (distance) {
    queryParams.push(`distance=${encodeURIComponent(distance)}`);
  }
  
  // Add posted within
  if (postedAgo) {
    queryParams.push(`postedWithin=${encodeURIComponent(postedAgo)}`);
  }
  
  return url + queryParams.join('&');
};

/**
 * Validate and fix job URL
 * @param {string} url - Job URL to validate
 * @param {string} jobTitle - Job title for fallback
 * @returns {string} - Valid job URL
 */
const validateJobUrl = (url, jobTitle = 'job') => {
  if (!url) {
    // Generate fallback URL
    const searchQuery = encodeURIComponent(jobTitle);
    return `https://www.seek.com.au/jobs?keywords=${searchQuery}`;
  }
  
  // Ensure URL starts with http
  if (!url.startsWith('http')) {
    return `https://www.seek.com.au${url}`;
  }
  
  return url;
};

/**
 * Extract job ID from SEEK URL
 * @param {string} url - SEEK job URL
 * @returns {string|null} - Job ID or null
 */
const extractJobIdFromUrl = (url) => {
  if (!url) return null;
  
  const match = url.match(/\/job\/(\d+)/);
  return match ? match[1] : null;
};

/**
 * Generate unique filename with timestamp
 * @param {string} prefix - File prefix
 * @param {string} extension - File extension
 * @returns {string} - Unique filename
 */
const generateUniqueFilename = (prefix, extension) => {
  const timestamp = Date.now();
  return `${prefix}_${timestamp}.${extension}`;
};

/**
 * Create config file path
 * @param {string} processId - Process ID
 * @returns {string} - Config file path
 */
const getConfigPath = (processId) => {
  return path.join(process.cwd(), `config_${processId}.json`);
};

/**
 * Create results file path
 * @param {string} processId - Process ID
 * @returns {string} - Results file path
 */
const getResultsPath = (processId) => {
  return path.join(process.cwd(), `scoring_results_${processId}.json`);
};

module.exports = {
  buildSeekSearchUrl,
  validateJobUrl,
  extractJobIdFromUrl,
  generateUniqueFilename,
  getConfigPath,
  getResultsPath
}; 
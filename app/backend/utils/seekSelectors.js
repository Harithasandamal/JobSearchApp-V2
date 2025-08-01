/**
 * SEEK Selectors Configuration - Centralized selector strategies
 * Extracted from searchResultsScraper.js for better maintainability
 */

/**
 * Job URL extraction selectors for SEEK search results
 */
const JOB_URL_SELECTORS = [
  // Primary selector - most reliable
  'article[data-automation="normalJob"] h3 a[href*="/job/"]',
  'article[data-automation="standOut"] h3 a[href*="/job/"]',
  
  // Fallback selectors
  'a[data-automation="jobTitle"][href*="/job/"]',
  'h3 a[href*="/job/"]',
  'a[href*="/job/"][data-automation]',
  
  // Additional fallbacks
  '.jobs-box a[href*="/job/"]',
  '[data-cy="search-results"] a[href*="/job/"]',
  'article a[href*="/job/"]'
];

/**
 * Job card container selectors
 */
const JOB_CARD_SELECTORS = [
  'article[data-automation="normalJob"]',
  'article[data-automation="standOut"]', 
  'article[data-automation="premiumJob"]',
  '.jobs-box',
  '[data-cy="job-card"]'
];

/**
 * Anti-bot detection selectors
 */
const BLOCKED_INDICATORS = [
  '.blocked-message',
  '.captcha-container',
  '#challenge-form',
  '[data-cy="blocked"]'
];

module.exports = {
  JOB_URL_SELECTORS,
  JOB_CARD_SELECTORS,
  BLOCKED_INDICATORS
};
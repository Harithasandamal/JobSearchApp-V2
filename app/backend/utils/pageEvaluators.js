/**
 * Page Evaluation Functions - Browser page evaluation logic
 * Extracted from searchResultsScraper.js for better maintainability
 */

/**
 * Extract job URLs from SEEK search results page
 * @param {number} maxJobs - Maximum number of jobs to extract
 * @returns {Array} Array of job URLs
 */
function extractJobUrls(maxJobs) {
  const urls = [];
  const seenJobIds = new Set(); // Track job IDs to prevent duplicates of same job
  
  // Function to extract job ID from SEEK URL
  const extractJobId = (url) => {
    const match = url.match(/\/job\/(\d+)/);
    return match ? match[1] : null;
  };
  
  // Helper function to process URLs
  const processUrl = (href) => {
    if (!href || !href.includes('/job/')) return;
    
    let fullUrl;
    if (href.startsWith('http')) {
      fullUrl = href;
    } else if (href.startsWith('/')) {
      fullUrl = 'https://www.seek.com.au' + href;
    } else {
      return;
    }
    
    // Extract job ID to prevent duplicates
    const jobId = extractJobId(fullUrl);
    if (!jobId || seenJobIds.has(jobId)) {
      return;
    }
    
    seenJobIds.add(jobId);
    
    // Clean up URL - remove extra parameters but keep essential ones
    try {
      const urlObj = new URL(fullUrl);
      // Keep only essential parameters
      const essentialParams = ['ref', 'type'];
      const cleanParams = new URLSearchParams();
      
      essentialParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          cleanParams.append(param, urlObj.searchParams.get(param));
        }
      });
      
      const cleanUrl = `${urlObj.origin}${urlObj.pathname}${cleanParams.toString() ? '?' + cleanParams.toString() : ''}`;
      urls.push(cleanUrl);
    } catch (e) {
      urls.push(fullUrl);
    }
  };

  // Job URL extraction selectors (in order of preference)
  const selectors = [
    'article[data-automation="normalJob"] h3 a[href*="/job/"]',
    'article[data-automation="standOut"] h3 a[href*="/job/"]',
    'a[data-automation="jobTitle"][href*="/job/"]',
    'h3 a[href*="/job/"]',
    'a[href*="/job/"][data-automation]',
    '.jobs-box a[href*="/job/"]',
    '[data-cy="search-results"] a[href*="/job/"]',
    'article a[href*="/job/"]'
  ];

  // Try each selector until we have enough URLs
  for (const selector of selectors) {
    if (urls.length >= maxJobs) break;
    
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (urls.length >= maxJobs) return;
        processUrl(element.href);
      });
    } catch (e) {
      console.log(`Selector failed: ${selector}`);
    }
  }

  console.log(`🔗 Found ${urls.length} unique job URLs`);
  return urls.slice(0, maxJobs);
}

/**
 * Check if page is blocked or has anti-bot measures
 * @returns {Object} Block detection result
 */
function checkForBlocking() {
  const blockIndicators = [
    '.blocked-message',
    '.captcha-container', 
    '#challenge-form',
    '[data-cy="blocked"]'
  ];
  
  for (const indicator of blockIndicators) {
    if (document.querySelector(indicator)) {
      return {
        blocked: true,
        indicator: indicator,
        message: 'Page blocked or requires verification'
      };
    }
  }
  
  // Check for unusual page content
  const bodyText = document.body.innerText.toLowerCase();
  const blockPhrases = [
    'access denied',
    'blocked',
    'verify you are human',
    'captcha',
    'unusual traffic'
  ];
  
  for (const phrase of blockPhrases) {
    if (bodyText.includes(phrase)) {
      return {
        blocked: true,
        indicator: 'text-content',
        message: `Detected blocking phrase: ${phrase}`
      };
    }
  }
  
  return { blocked: false };
}

module.exports = {
  extractJobUrls,
  checkForBlocking
};
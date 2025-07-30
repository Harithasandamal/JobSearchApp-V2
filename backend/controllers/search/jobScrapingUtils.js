const puppeteer = require('puppeteer');
const JobUtils = require('../../utils/jobUtils');

/**
 * Scrape job details from a SEEK job URL - REAL DATA ONLY, NO FALLBACK
 * @param {string} url - The job URL to scrape
 * @returns {Object} Job details containing title, company, location
 */
const scrapeJobDetails = async (url) => {
  console.log(`🔍 Starting to scrape job details from: ${url}`);
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set user agent to avoid blocking
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log(`📡 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const job = await page.evaluate(() => {
      const trySelectors = (selectors, debugName) => {
        for (const selector of selectors) {
          try {
            const el = document.querySelector(selector);
            if (el && el.innerText && el.innerText.trim().length > 0) {
              return el.innerText.trim();
            }
          } catch (e) {
            // Silent fail for performance
          }
        }
        return '';
      };

      // Title selectors - most reliable first
      const titleSelectors = [
        'h1[data-automation="job-detail-title"]',
        'h1.jobtitle',
        'h1[class*="title"]',
        'h1',
        '.job-title',
        '[data-automation="job-detail-title"]'
      ];
      
      // Company selectors
      const companySelectors = [
        '[data-automation="advertiser-name"]',
        '.company-name',
        '.advertiser-name',
        '[class*="company"]',
        '[class*="advertiser"]'
      ];
      
      // Location selectors
      const locationSelectors = [
        '[data-automation="job-detail-location"]',
        '.location',
        '[class*="location"]',
        '.job-location'
      ];
      
      // Posted ago selectors
      const postedAgoSelectors = [
        '[data-automation="job-detail-date"]',
        '.posted-date',
        '.date-posted',
        '[class*="date"]',
        '.job-date'
      ];

      let title = trySelectors(titleSelectors, 'title');
      let company = trySelectors(companySelectors, 'company');
      let location = trySelectors(locationSelectors, 'location');
      let postedAgo = trySelectors(postedAgoSelectors, 'posted date');

      // Enhanced posted date extraction if not found
      if (!postedAgo || postedAgo.trim() === '') {
        const allText = document.body.innerText;
        if (allText) {
          const match = allText.match(/(\d+[dhm])\s*ago/i);
          if (match) {
            postedAgo = match[0];
          }
        }
      }
      return { title, company, location, postedAgo };
    });
    
    // Use unified job processing
    const processedJob = JobUtils.processJob({
      ...job,
      url
    });
    return processedJob;
    
  } catch (error) {
    console.error(`❌ Error processing job details for ${url}:`, error);
    
    // NO FALLBACK DATA - throw error to let caller handle
    throw new Error(`Failed to scrape job from ${url}: ${error.message}`);
    
  } finally {
    await browser.close();
  }
};

module.exports = {
  scrapeJobDetails
}; 
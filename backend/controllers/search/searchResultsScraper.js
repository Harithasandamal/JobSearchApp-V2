/**
 * Search Results Scraper - Scrapes job listings from SEEK search result pages
 * This module handles extracting job URLs from search result pages
 */

const puppeteer = require('puppeteer');
const UrlBuilder = require('../../scrapers/UrlBuilder');

/**
 * Scrape job URLs from a SEEK search results page
 * @param {string} searchUrl - The search results URL to scrape
 * @param {number} maxJobs - Maximum number of job URLs to extract (default: 20)
 * @returns {Array} Array of job URLs
 */
async function scrapeJobUrlsFromSearchResults(searchUrl, maxJobs = 20) {
  console.log(`🔍 Scraping job URLs from search results: ${searchUrl}`);
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set user agent to avoid blocking
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log(`📡 Loading search results page...`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for job listings to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log(`🔗 Extracting job URLs...`);
    
    const jobUrls = await page.evaluate((maxJobs) => {
      const urls = [];
      
      // Try multiple selector strategies for SEEK job links
      const linkSelectors = [
        '[data-automation="jobTitle"] a',           // Standard job title links
        '[data-automation="normalJob"] a[href*="/job/"]',    // Links within normal job cards
        '[data-automation="premiumJob"] a[href*="/job/"]',   // Links within premium job cards
        '[data-automation="featuredJob"] a[href*="/job/"]',  // Links within featured job cards
        'h3 a[href*="/job/"]',                      // Job title links in h3
        'h2 a[href*="/job/"]',                      // Job title links in h2
        'a[href*="/job/"]',                         // Any link containing /job/
        '.job-tile a',                              // Links within job tiles
        'article a[href*="/job/"]'                  // Links within article elements
      ];
      
      let jobLinks = [];
      
      // Try each selector until we find job links
      for (const selector of linkSelectors) {
        jobLinks = document.querySelectorAll(selector);
        if (jobLinks.length > 0) {
          console.log(`Found ${jobLinks.length} job links using selector: ${selector}`);
          break;
        }
      }
      
      // Extract URLs and ensure they're complete
      const baseUrl = 'https://www.seek.com.au';
      
      jobLinks.forEach((link, index) => {
        if (urls.length >= maxJobs) return; // Stop when we have enough URLs
        
        try {
          let href = link.getAttribute('href');
          if (href) {
            // Ensure URL is complete
            if (href.startsWith('/')) {
              href = baseUrl + href;
            } else if (!href.startsWith('http')) {
              href = baseUrl + '/' + href;
            }
            
            // Only add job URLs and avoid duplicates
            if (href.includes('/job/') && !urls.includes(href)) {
              urls.push(href);
            }
          }
        } catch (error) {
          console.log(`Error processing link ${index + 1}:`, error.message);
        }
      });
      
      return urls;
    }, maxJobs);
    
    console.log(`✅ Extracted ${jobUrls.length} job URLs from search results`);
    
    // Filter and validate URLs
    const validJobUrls = jobUrls
      .filter(url => url && url.includes('/job/'))
      .slice(0, maxJobs); // Ensure we don't exceed maxJobs
    
    console.log(`🎯 Returning ${validJobUrls.length} valid job URLs`);
    return validJobUrls;
    
  } catch (error) {
    console.error(`❌ Error scraping search results: ${error.message}`);
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * Get job URLs for search parameters by building search URL and scraping results
 * @param {string} keyword - Job keyword/title (optional)
 * @param {string} location - Location to search in
 * @param {string} distance - Search distance (e.g., "5 km")
 * @param {string} postedAgo - How long ago jobs were posted (e.g., "3 days")
 * @param {number} maxJobs - Maximum number of job URLs to return
 * @returns {Array} Array of job URLs
 */
async function getJobUrlsForSearch(keyword, location, distance, postedAgo, maxJobs = 20) {
  console.log(`\n🏗️ Building search URL for parameters:`);
  console.log(`   - Keyword: "${keyword || 'none'}"`);
  console.log(`   - Location: "${location}"`);
  console.log(`   - Distance: "${distance}"`);
  console.log(`   - Posted Ago: "${postedAgo}"`);
  console.log(`   - Max Jobs: ${maxJobs}`);
  
  try {
    // Build the search URL using UrlBuilder
    const searchUrl = UrlBuilder.buildSeekUrl(keyword, location, distance, postedAgo);
    console.log(`🌐 Built search URL: ${searchUrl}`);
    
    // Scrape job URLs from the search results
    const jobUrls = await scrapeJobUrlsFromSearchResults(searchUrl, maxJobs);
    
    console.log(`🎯 Found ${jobUrls.length} job URLs for the search`);
    return jobUrls;
    
  } catch (error) {
    console.error(`❌ Error getting job URLs for search:`, error.message);
    return [];
  }
}

/**
 * Extract basic job info from search results page (without individual job page scraping)
 * @param {string} searchUrl - The search results URL to scrape
 * @param {number} maxJobs - Maximum number of jobs to extract (default: 20)
 * @returns {Array} Array of job objects with basic info
 */
async function scrapeBasicJobInfoFromSearchResults(searchUrl, maxJobs = 20) {
  console.log(`🔍 Scraping basic job info from search results: ${searchUrl}`);
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set user agent to avoid blocking
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log(`📡 Loading search results page...`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for job listings to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log(`🔍 Extracting job info from search results...`);
    
    const jobs = await page.evaluate((maxJobs) => {
      const jobs = [];
      
      // Try multiple selector strategies for SEEK job listings
      const jobSelectors = [
        '[data-automation="normalJob"]',           // Standard job cards
        '[data-automation="premiumJob"]',          // Premium job cards  
        '[data-automation="featuredJob"]',         // Featured job cards
        'article[data-automation*="job"]',         // Any article with job in data-automation
        '.job-tile',                               // Alternative class name
        'article[class*="job"]'                    // Article with job in class name
      ];
      
      let jobElements = [];
      
      // Try each selector until we find job listings
      for (const selector of jobSelectors) {
        jobElements = document.querySelectorAll(selector);
        if (jobElements.length > 0) {
          console.log(`Found ${jobElements.length} jobs using selector: ${selector}`);
          break;
        }
      }
      
      // Extract data from each job element
      const baseUrl = 'https://www.seek.com.au';
      
      jobElements.forEach((element, index) => {
        if (jobs.length >= maxJobs) return; // Stop when we have enough jobs
        
        try {
          const extractText = (selectors) => {
            for (const selector of selectors) {
              const el = element.querySelector(selector);
              if (el && el.textContent && el.textContent.trim()) {
                return el.textContent.trim();
              }
            }
            return '';
          };
          
          const extractUrl = (selectors) => {
            for (const selector of selectors) {
              const el = element.querySelector(selector);
              if (el && el.getAttribute('href')) {
                let href = el.getAttribute('href');
                if (href.startsWith('/')) {
                  href = baseUrl + href;
                } else if (!href.startsWith('http')) {
                  href = baseUrl + '/' + href;
                }
                return href;
              }
            }
            return '';
          };
          
          // Title selectors
          const titleSelectors = [
            '[data-automation="jobTitle"]',
            'h3 a',
            'h2 a', 
            'h1 a',
            'a[title]',
            '.job-title',
            '[class*="title"] a',
            'a[href*="/job/"]'
          ];
          
          // URL selectors  
          const urlSelectors = [
            '[data-automation="jobTitle"] a',
            'h3 a[href*="/job/"]',
            'h2 a[href*="/job/"]',
            'a[href*="/job/"]'
          ];
          
          // Company selectors
          const companySelectors = [
            '[data-automation="jobCompany"]',
            '[data-automation="advertiser"]', 
            '.company',
            '.advertiser',
            '[class*="company"]',
            '[class*="advertiser"]'
          ];
          
          // Location selectors  
          const locationSelectors = [
            '[data-automation="jobLocation"]',
            '.location',
            '[class*="location"]',
            '.suburb'
          ];
          
          // Posted ago selectors
          const postedAgoSelectors = [
            '[data-automation="jobListingDate"]',
            '.date',
            '.posted',
            '[class*="date"]',
            '[class*="time"]'
          ];
          
          const title = extractText(titleSelectors);
          const url = extractUrl(urlSelectors);
          const company = extractText(companySelectors);
          const location = extractText(locationSelectors);
          const postedAgo = extractText(postedAgoSelectors);
          
          // Only add if we have at least a title and URL
          if (title && url && url.includes('/job/')) {
            jobs.push({
              id: `search-result-${index + 1}`,
              title: title,
              company: company || 'Company not specified',
              location: location || 'Location not specified', 
              postedAgo: postedAgo || 'Time not specified',
              url: url
            });
          }
          
        } catch (error) {
          console.log(`Error extracting job ${index + 1}:`, error.message);
        }
      });
      
      return jobs;
    }, maxJobs);
    
    console.log(`✅ Extracted ${jobs.length} jobs with basic info from search results`);
    return jobs;
    
  } catch (error) {
    console.error(`❌ Error scraping basic job info: ${error.message}`);
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = {
  scrapeJobUrlsFromSearchResults,
  getJobUrlsForSearch,
  scrapeBasicJobInfoFromSearchResults
};
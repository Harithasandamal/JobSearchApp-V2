/**
 * Search Results Scraper - Simplified main scraper
 * Scrapes job listings from SEEK search result pages using modular utilities
 */

const puppeteer = require('puppeteer');
const UrlBuilder = require('../../scrapers/UrlBuilder');
const { extractJobUrls, checkForBlocking } = require('../../utils/pageEvaluators');

/**
 * Scrape job URLs from a SEEK search results page
 * @param {string} searchUrl - The search results URL to scrape
 * @param {number} maxJobs - Maximum number of job URLs to extract (default: 30)
 * @returns {Array} Array of job URLs
 */
async function scrapeJobUrlsFromSearchResults(searchUrl, maxJobs = 30) {
  console.log(`📄 Loading search results page...`);
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set user agent to avoid blocking
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    try {
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      console.log(`✅ Search page loaded successfully`);
    } catch (error) {
      console.error(`❌ Failed to load search page: ${error.message}`);
      throw error;
    }
    
    // Wait for job listings to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // console.log(`🔗 Extracting job URLs...`);
    
    // Check for blocking first
    const blockCheck = await page.evaluate(checkForBlocking);
    if (blockCheck.blocked) {
      console.log(`⚠️ Page appears to be blocked: ${blockCheck.message}`);
      throw new Error(`Page blocked: ${blockCheck.message}`);
    }
    
    // Extract job URLs using modular page evaluator
    const jobUrls = await page.evaluate(extractJobUrls, maxJobs);
    
    // Filter and validate URLs
    const validJobUrls = jobUrls
      .filter(url => url && url.includes('/job/'))
      .slice(0, maxJobs); // Ensure we don't exceed maxJobs
    
    console.log(`✅ Extracted ${validJobUrls.length} job URLs`);
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
async function getJobUrlsForSearch(keyword, location, distance, postedAgo, maxJobs = 30) {
  // Note: This function rebuilds URL - prefer passing pre-built URL to avoid redundancy
  console.log(`🔍 Searching ${keyword || 'all jobs'} in ${location} (max ${maxJobs}) - rebuilding URL`);
  
  try {
    // Build the search URL using UrlBuilder
    const searchUrl = UrlBuilder.buildSeekUrl(keyword, location, distance, postedAgo);
    
    // Scrape job URLs from the search results
    const jobUrls = await scrapeJobUrlsFromSearchResults(searchUrl, maxJobs);
    
    console.log(`🎯 Found ${jobUrls.length} job URLs`);
    return jobUrls;
    
  } catch (error) {
    console.error(`❌ Error getting job URLs for search:`, error.message);
    return [];
  }
}

/**
 * Enhanced function to scrape job info with featured job handling and order preservation
 * @param {string} searchUrl - The search results URL to scrape
 * @param {number} maxJobs - Maximum number of jobs to extract (default: 30)
 * @returns {Array} Array of job objects with basic info and proper order
 */
async function scrapeBasicJobInfoFromSearchResults(searchUrl, maxJobs = 30) {
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
      
      // Collect ALL job elements (both normal and premium/featured)
      jobSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} jobs using selector: ${selector}`);
          jobElements = jobElements.concat(Array.from(elements));
        }
      });
      
      // Remove duplicates based on job ID
      const uniqueJobs = new Map();
      jobElements.forEach(element => {
        const jobId = element.getAttribute('data-job-id');
        if (jobId && !uniqueJobs.has(jobId)) {
          uniqueJobs.set(jobId, element);
        }
      });
      
      jobElements = Array.from(uniqueJobs.values());
      console.log(`Total unique jobs found: ${jobElements.length}`);
      
      // Extract data from each job element
      const baseUrl = 'https://www.seek.com.au';
      const seenJobIds = new Set(); // Track job IDs to prevent duplicates
      
      // Function to extract job ID from SEEK URL
      const extractJobId = (url) => {
        const match = url.match(/\/job\/(\d+)/);
        return match ? match[1] : null;
      };
      
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
          
          // No longer needed - using simple approach based on missing posted time
          
          const title = extractText(titleSelectors);
          const url = extractUrl(urlSelectors);
          const company = extractText(companySelectors);
          const location = extractText(locationSelectors);
          const postedAgo = extractText(postedAgoSelectors);
          
          // Simple approach: detect jobs with no posted time
          const hasNoPostedTime = !postedAgo || postedAgo.trim() === '';
          const needsIndividualVisit = hasNoPostedTime;
          
          // Only add if we have at least a title and URL, and check for job ID duplicates
          if (title && url && url.includes('/job/')) {
            const jobId = extractJobId(url);
            if (jobId && !seenJobIds.has(jobId)) {
              seenJobIds.add(jobId);
                             jobs.push({
                 tempId: `temp-${index + 1}`, // Temporary ID for order preservation
                 id: `search-result-${jobId}`,
                 title: title,
                 company: company || 'Company not specified',
                 location: location || 'Location not specified', 
                 postedAgo: postedAgo || '',
                 url: url,
                 needsIndividualVisit: needsIndividualVisit,
                 originalIndex: index // Preserve original order
               });
               console.log(`Added unique job ${jobId} (${needsIndividualVisit ? 'NO POSTED TIME' : 'REGULAR'}): ${title}`);
            } else if (jobId) {
              console.log(`Skipped duplicate job ${jobId}: ${title}`);
            }
          }
          
        } catch (error) {
          console.log(`Error extracting job ${index + 1}:`, error.message);
        }
      });
      
      return jobs;
    }, maxJobs);
    
    console.log(`✅ Extracted ${jobs.length} jobs with basic info from search results`);
    
         // Process jobs with no posted time that need individual visits
     const jobsWithNoPostedTime = jobs.filter(job => job.needsIndividualVisit);
     const regularJobs = jobs.filter(job => !job.needsIndividualVisit);
     
     if (jobsWithNoPostedTime.length > 0) {
       console.log(`🔍 Processing ${jobsWithNoPostedTime.length} jobs with no posted time...`);
       
       // Process jobs with no posted time in parallel (max 3 concurrent)
       const processedJobsWithPostedTime = await processJobsWithNoPostedTimeParallel(browser, jobsWithNoPostedTime);
       
       // Merge back with regular jobs maintaining original order
       const allJobs = [...jobs];
       processedJobsWithPostedTime.forEach(processedJob => {
         const originalIndex = allJobs.findIndex(job => job.tempId === processedJob.tempId);
         if (originalIndex !== -1) {
           allJobs[originalIndex] = processedJob;
         }
       });
       
       console.log(`✅ Completed processing ${jobsWithNoPostedTime.length} jobs with posted times`);
       return allJobs;
     } else {
       console.log(`✅ No jobs with missing posted times found, returning regular jobs`);
       return jobs;
     }
    
  } catch (error) {
    console.error(`❌ Error scraping basic job info: ${error.message}`);
    return [];
  } finally {
    await browser.close();
  }
}

/**
 * Process jobs with no posted time in parallel to get posted times
 * @param {Browser} browser - Puppeteer browser instance
 * @param {Array} jobsWithNoPostedTime - Array of job objects with no posted time
 * @returns {Array} Processed jobs with posted times
 */
async function processJobsWithNoPostedTimeParallel(browser, jobsWithNoPostedTime) {
  const maxConcurrent = 3; // Limit concurrent requests to avoid overwhelming SEEK
  const processedJobs = [];
  
  // Process in batches to avoid overwhelming the server
  for (let i = 0; i < jobsWithNoPostedTime.length; i += maxConcurrent) {
    const batch = jobsWithNoPostedTime.slice(i, i + maxConcurrent);
    console.log(`📄 Processing batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(jobsWithNoPostedTime.length / maxConcurrent)} (${batch.length} jobs)`);
    
    const batchPromises = batch.map(async (job, batchIndex) => {
      try {
        console.log(`  🔍 Visiting individual page for: ${job.title}`);
        const individualJobData = await visitIndividualJobPage(browser, job.url);
        
        if (individualJobData && individualJobData.postedAgo) {
          job.postedAgo = individualJobData.postedAgo;
          job.needsIndividualVisit = false; // Mark as processed
          console.log(`  ✅ Got posted time: ${job.postedAgo}`);
        } else {
          console.log(`  ⚠️ No posted time found for: ${job.title}`);
        }
        
        return job;
      } catch (error) {
        console.log(`  ❌ Error processing job with no posted time: ${job.title} - ${error.message}`);
        return job; // Return original job if individual visit fails
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    processedJobs.push(...batchResults);
    
    // Add delay between batches to be respectful to SEEK
    if (i + maxConcurrent < jobsWithNoPostedTime.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return processedJobs;
}

/**
 * Visit individual job page to extract posted time
 * @param {Browser} browser - Puppeteer browser instance
 * @param {string} jobUrl - URL of the individual job page
 * @returns {Object} Job data with posted time
 */
async function visitIndividualJobPage(browser, jobUrl) {
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Optimize page loading
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    await page.goto(jobUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    const jobData = await page.evaluate(() => {
      // Comprehensive posted time extraction from individual job page
      const timeSelectors = [
        '[data-automation="jobListingDate"]',
        '[data-testid="posted-time"]',
        '.posted-time',
        '.job-posted-time',
        'time',
        '[class*="date"]',
        '[class*="time"]',
        '[class*="posted"]'
      ];
      
      let postedAgo = '';
      
      // Try selectors first
      for (const selector of timeSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          postedAgo = element.textContent.trim();
          break;
        }
      }
      
      // If no selector found, search in body text with patterns
      if (!postedAgo) {
        const bodyText = document.body.innerText || '';
        const datePatterns = [
          /Posted (\d+[dhm]) ago/i,
          /(\d+[dhm]) ago/i,
          /Posted (\d+) days? ago/i,
          /(\d+) days? ago/i,
          /(\d+) hours? ago/i,
          /(\d+) minutes? ago/i,
          /Posted (\d+\s+(?:minute|hour|day|week|month)s?) ago/i,
          /(\d+\s+(?:minute|hour|day|week|month)s?) ago/i
        ];
        
        for (const pattern of datePatterns) {
          const match = bodyText.match(pattern);
          if (match) {
            postedAgo = match[0];
            break;
          }
        }
      }
      
      // Filter out invalid times (like "ms" values)
      if (postedAgo && postedAgo.includes('ms')) {
        postedAgo = '';
      }
      
      return { postedAgo: postedAgo.trim() };
    });
    
    return jobData;
    
  } catch (error) {
    console.log(`❌ Error visiting individual job page: ${error.message}`);
    return { postedAgo: '' };
  } finally {
    await page.close();
  }
}

module.exports = {
  scrapeJobUrlsFromSearchResults,
  getJobUrlsForSearch,
  scrapeBasicJobInfoFromSearchResults
};
const puppeteer = require('puppeteer');
const JobUtils = require('../../utils/jobUtils');
const { filterFeaturedJobs } = require('../../utils/featuredJobValidator');

// Shared browser instance for better performance
let sharedBrowser = null;

/**
 * Get or create shared browser instance
 */
const getSharedBrowser = async () => {
  if (!sharedBrowser || !sharedBrowser.isConnected()) {
    console.log('🚀 Launching shared browser instance...');
    sharedBrowser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
  }
  return sharedBrowser;
};

/**
 * Close shared browser (call when done with batch)
 */
const closeSharedBrowser = async () => {
  if (sharedBrowser && sharedBrowser.isConnected()) {
    console.log('🔒 Closing shared browser instance...');
    await sharedBrowser.close();
    sharedBrowser = null;
  }
};

/**
 * Optimized job scraping with shared browser and faster waits
 * @param {string} url - The job URL to scrape
 * @returns {Object} Job details containing title, company, location
 */
const scrapeJobDetailsOptimized = async (url) => {
  console.log(`🔍 Optimized scraping from: ${url}`);
  
  const browser = await getSharedBrowser();
  const page = await browser.newPage();
  
  try {
    // Optimize page settings for speed
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Disable images and CSS for faster loading (optional - uncomment if needed)
    // await page.setRequestInterception(true);
    // page.on('request', (req) => {
    //   if(req.resourceType() == 'stylesheet' || req.resourceType() == 'image'){
    //     req.abort();
    //   } else {
    //     req.continue();
    //   }
    // });
    
    console.log(`📡 Fast navigation to: ${url}`);
    // Use domcontentloaded instead of networkidle2 for speed
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 // Reduced from 30 seconds
    });
    
    // Reduced wait time from 3 seconds to 1 second
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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

      // Optimized selectors - most likely first
      const titleSelectors = [
        'h1[data-automation="job-detail-title"]',
        'h1',
        '.job-title'
      ];
      
      const companySelectors = [
        '[data-automation="advertiser-name"]',
        '.company-name',
        '.advertiser-name'
      ];
      
      const locationSelectors = [
        '[data-automation="job-detail-location"]',
        '.location',
        '.job-location'
      ];
      
      const postedAgoSelectors = [
        '[data-automation="job-detail-date"]',
        '.posted-date',
        '.date-posted'
      ];

      let title = trySelectors(titleSelectors, 'title');
      let company = trySelectors(companySelectors, 'company');
      let location = trySelectors(locationSelectors, 'location');
      let postedAgo = trySelectors(postedAgoSelectors, 'posted date');

      // Quick fallback for posted date
      if (!postedAgo) {
        const allText = document.body.innerText;
        const match = allText.match(/(\d+[dhm])\s*ago/i);
        if (match) {
          postedAgo = match[1] + ' ago';
        }
      }
      
      return { title, company, location, postedAgo };
    });
    
    // Use unified job processing
    const processedJob = JobUtils.processJob({
      ...job,
      url
    });
    
    console.log(`✅ Fast scraped:`, processedJob.title);
    return processedJob;
    
  } catch (error) {
    console.error(`❌ Fast scraping failed for ${url}:`, error.message);
    throw new Error(`Failed to scrape job from ${url}: ${error.message}`);
    
  } finally {
    await page.close(); // Close page but keep browser open
  }
};

/**
 * Batch scrape multiple URLs with optimized parallel processing
 * @param {Array} urls - Array of URLs to scrape
 * @param {Object} searchCriteria - Optional search criteria for featured job validation
 * @returns {Array} Array of job details
 */
const batchScrapeJobs = async (urls, searchCriteria = null) => {
  console.log(`🚀 Starting optimized batch scraping of ${urls.length} jobs...`);
  
  try {
    // TRUE PARALLEL - no staggered delays, all start immediately
    const scrapingPromises = urls.map((url, index) => {
      console.log(`🔄 Starting immediate parallel job ${index + 1}/${urls.length}`);
      
      return Promise.race([
        scrapeJobDetailsOptimized(url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Optimized timeout after 15 seconds')), 15000) // Reduced timeout
        )
      ]).then(jobDetails => {
        console.log(`✅ Job ${index + 1} completed successfully`);
        return {
          id: `optimized-job-${index + 1}`,
          title: jobDetails.title,
          company: jobDetails.company || 'Company not specified',
          location: jobDetails.location || 'Location not specified',
          postedAgo: jobDetails.postedAgo || 'Time not specified',
          url: url
        };
      }).catch(error => {
        console.error(`❌ Job ${index + 1} failed: ${error.message}`);
        return null;
      });
    });
    
    console.log('⏳ Waiting for all parallel jobs to complete...');
    const results = await Promise.all(scrapingPromises);
    
    // Close shared browser after batch
    await closeSharedBrowser();
    
    const validJobs = results.filter(job => job !== null);
    console.log(`🏁 Batch complete: ${validJobs.length}/${urls.length} jobs scraped successfully`);
    
    // ✅ FEATURED JOB VALIDATION - Validate featured jobs against search criteria
    let finalJobs = validJobs;
    if (searchCriteria) {
      console.log(`🎯 Applying featured job validation with search criteria`);
      finalJobs = filterFeaturedJobs(validJobs, searchCriteria);
      console.log(`🎯 After featured job validation: ${finalJobs.length}/${validJobs.length} jobs approved`);
    } else {
      console.log(`⚠️ No search criteria provided - skipping featured job validation`);
      // Mark all jobs as regular jobs if no validation
      finalJobs = validJobs.map(job => ({ ...job, isFeatured: false }));
    }
    
    return finalJobs;
    
  } catch (error) {
    console.error('❌ Batch scraping failed:', error);
    await closeSharedBrowser();
    throw error;
  }
};

module.exports = {
  scrapeJobDetailsOptimized,
  batchScrapeJobs,
  closeSharedBrowser
};
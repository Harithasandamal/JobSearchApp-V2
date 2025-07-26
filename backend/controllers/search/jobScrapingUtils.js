const puppeteer = require('puppeteer');
const JobUtils = require('../../utils/jobUtils');

/**
 * Scrape job details from a SEEK job URL
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
        console.log(`🔍 Trying selectors for ${debugName}:`, selectors);
        
        for (const selector of selectors) {
          try {
            const el = document.querySelector(selector);
            if (el && el.innerText && el.innerText.trim().length > 0) {
              const text = el.innerText.trim();
              console.log(`✅ Found ${debugName} with selector "${selector}": "${text}"`);
              return text;
            } else if (el) {
              console.log(`⚠️ Element found but no text for selector "${selector}"`);
            }
          } catch (e) {
            console.log(`❌ Error with selector "${selector}": ${e.message}`);
          }
        }
        
        console.log(`❌ No valid text found for ${debugName}`);
        return '';
      };
      
      // Updated selectors for current SEEK structure
      const title = trySelectors([
        'h1[data-automation="job-detail-title"]',
        'h1.y735df0.yvsb870.y735df0', // Current SEEK title class
        '[data-automation="job-detail-title"]',
        'h1.job-detail-title',
        'h1.yvsb870',
        'h1',
        '.job-title',
        'title'
      ], 'title');
      
      const company = trySelectors([
        '[data-automation="advertiser-name"] a',
        '[data-automation="advertiser-name"]',
        'a[data-automation="advertiser-name"]',
        '.y735df0._1f4bc8y0.y735df0.yvsb870', // Current SEEK company class pattern
        '.yvsb870.y735df0._1f4bc8y0', 
        '.advertiser-name',
        '.job-company',
        '.company-name',
        'span.yvsb870', // Generic class that might contain company
        'div.yvsb870'
      ], 'company');
      
      let location = trySelectors([
        '[data-automation="job-detail-location"]',
        'span[data-automation="job-detail-location"]',
        '.y735df0.yvsb870._1f4bc8y0', // Location class pattern
        '.job-location',
        '.location',
        'span.yvsb870:not(:first-child)', // Try second occurrence of yvsb870
        '.yvsb870'
      ], 'location');

      // Enhanced posted date extraction with comprehensive selectors
      let postedAgo = trySelectors([
        '[data-automation="job-detail-date"]',
        'time[data-automation="job-detail-date"]',
        '[data-automation*="date"]',
        '[data-automation*="posted"]',
        '.date-posted',
        '.job-posted-date',
        '.posted-date',
        '.listing-date',
        'time',
        '[class*="date"]',
        '[class*="posted"]',
        '.y735df0[data-automation="job-detail-date"]',
        // Additional SEEK-specific selectors
        'span.y735df0.yvsb870:contains("ago")',
        'span.y735df0:contains("day")',
        'span.y735df0:contains("hour")',
        'div.y735df0:contains("posted")',
        'div[class*="y735df0"]:contains("ago")',
        // Try finding any element with date-like text
        '*:contains("days ago")',
        '*:contains("day ago")',
        '*:contains("hours ago")',
        '*:contains("hour ago")',
        '*:contains("posted")'
      ], 'postedAgo');
      
      // Enhanced text search if selectors fail
      if (!postedAgo || postedAgo === '') {
        console.log('🔍 Searching for posted date in page text with enhanced patterns...');
        const bodyText = document.body.innerText || '';
        const pageHTML = document.body.innerHTML || '';
        
        // More comprehensive date patterns
        const datePatterns = [
          // Standard patterns
          /posted\s+(\d+\s+(?:day|hour|minute)s?\s+ago)/gi,
          /listed\s+(\d+\s+(?:day|hour|minute)s?\s+ago)/gi,
          /(\d+\s+(?:day|hour|minute)s?\s+ago)/gi,
          /(today|yesterday|just now)/gi,
          
          // SEEK-specific patterns
          /(\d+[dhm]|\d+\s*(?:day|hour|minute)s?)\s*ago/gi,
          /ago[^>]*>([^<]+)</gi,
          /(\d+)\s*(day|hour|minute)s?\s*ago/gi,
          
          // Date formats
          /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,
          /(\d{1,2}-\d{1,2}-\d{2,4})/g,
          /(\d{1,2}\.\d{1,2}\.\d{2,4})/g,
          
          // Time-only patterns for very recent posts
          /(\d+[mh])/g, // Like "5m" or "2h"
          /(just now|moments ago|few seconds ago)/gi
        ];
        
        // First try body text
        for (const pattern of datePatterns) {
          const matches = bodyText.match(pattern);
          if (matches && matches[0]) {
            let dateMatch = matches[0].trim();
            // Clean up the match
            dateMatch = dateMatch.replace(/^(posted|listed)\s+/i, '');
            postedAgo = dateMatch;
            console.log(`✅ Found posted date in body text: "${postedAgo}"`);
            break;
          }
        }
        
        // If still not found, try HTML content for more precise matching
        if (!postedAgo || postedAgo === '') {
          console.log('🔍 Searching in HTML content...');
          for (const pattern of datePatterns) {
            const matches = pageHTML.match(pattern);
            if (matches && matches[0]) {
              let dateMatch = matches[0].trim();
              // Clean up HTML tags and extra text
              dateMatch = dateMatch.replace(/<[^>]+>/g, '').replace(/^(posted|listed)\s+/i, '');
              if (dateMatch && dateMatch.length > 0 && dateMatch.length < 50) {
                postedAgo = dateMatch;
                console.log(`✅ Found posted date in HTML: "${postedAgo}"`);
                break;
              }
            }
          }
        }
        
        // Last resort: look for any span/div elements containing date-like text
        if (!postedAgo || postedAgo === '') {
          console.log('🔍 Searching all elements for date-like content...');
          const allElements = document.querySelectorAll('span, div, time, p');
          for (const el of allElements) {
            const text = el.textContent || '';
            if (text.match(/\d+\s*(day|hour|minute)s?\s*ago/i) || 
                text.match(/(today|yesterday|just now)/i) ||
                text.match(/\d+[dhm]/)) {
              postedAgo = text.trim();
              console.log(`✅ Found posted date in element: "${postedAgo}"`);
              break;
            }
          }
        }
        
        // Enhanced FEATURED JOB extraction - try more aggressive text search
        if (!postedAgo || postedAgo === '') {
          console.log('🌟 FEATURED JOB: Attempting aggressive text extraction...');
          const allText = document.body.innerText || '';
          
          // More comprehensive patterns for featured jobs
          const enhancedPatterns = [
            /(\d+\s*(?:day|days|hour|hours|minute|minutes|d|h|m)\s*ago)/gi,
            /(?:posted|listed|updated)\s*[:\-]?\s*(\d+\s*(?:day|days|hour|hours|d|h|m)\s*ago)/gi,
            /(yesterday|today|just now|moments ago)/gi,
            /(\d+[dhm])/g // Simple patterns like "3d", "2h", "5m"
          ];
          
          for (const pattern of enhancedPatterns) {
            const match = allText.match(pattern);
            if (match && match[0]) {
              let foundDate = match[0].trim().replace(/^(posted|listed|updated)[:\-\s]*/i, '');
              if (foundDate && foundDate.length < 20) { // Reasonable length check
                postedAgo = foundDate;
                console.log(`✅ FEATURED JOB: Aggressive extraction found: "${postedAgo}"`);
                break;
              }
            }
          }
        }
      }
      
      // Debug: Log page title and first few text nodes
      console.log('🔍 Page title:', document.title);
      console.log('🔍 Page URL:', window.location.href);
      
      // Try to find all yvsb870 elements to see what they contain
      const allYvsb870 = document.querySelectorAll('.yvsb870');
      console.log(`🔍 Found ${allYvsb870.length} elements with class 'yvsb870':`);
      allYvsb870.forEach((el, i) => {
        if (i < 10) { // Log first 10 elements
          console.log(`  ${i}: "${el.innerText?.substring(0, 100) || 'No text'}"`);
        }
      });
      
      return { title, company, location, postedAgo };
    });
    
    console.log(`📊 Raw scraped data:`, job);
    
    // Use unified job processing - SIMPLIFIED!
    const processedJob = JobUtils.processJob({
      ...job,
      ...jobDetails,
      url
    });
    
    console.log(`✅ Cleaned job data:`, processedJob);
    return processedJob;
    
  } catch (error) {
    console.error(`❌ Error processing job details for ${url}:`, error);
    
    // Fallback: process the original job data
    return JobUtils.processJob({
      ...job,
      url
    });
  } finally {
    await browser.close();
  }
};

module.exports = {
  scrapeJobDetails
}; 
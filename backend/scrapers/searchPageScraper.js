/**
 * Search Page Scraper
 * Extracts basic job information directly from search results pages
 * Split from searchResultsScraper.js to maintain <300 line limit
 */

const puppeteer = require('puppeteer');

/**
 * Extract basic job info from search results page (without individual job page scraping)
 * @param {string} searchUrl - The search results URL to scrape
 * @param {number} maxJobs - Maximum number of jobs to extract (default: 30)
 * @returns {Array} Array of job objects with basic info
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
    
    try {
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (error) {
      console.error(`❌ Failed to load search page: ${error.message}`);
      throw error;
    }
    
    // Wait for job listings to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const jobs = await page.evaluate((maxJobs) => {
      const jobElements = document.querySelectorAll('[data-automation="normalJob"], [data-automation="premiumJob"], [data-automation="jobTitle"]');
      const extractedJobs = [];
      
      console.log(`Found ${jobElements.length} job elements on page`);
      
      for (let i = 0; i < Math.min(jobElements.length, maxJobs); i++) {
        const jobElement = jobElements[i];
        
        try {
          // Try multiple selectors for job title and URL
          let titleElement = jobElement.querySelector('a[data-automation="jobTitle"]') ||
                           jobElement.querySelector('h3 a') ||
                           jobElement.querySelector('a');
          
          let title = titleElement ? titleElement.textContent.trim() : null;
          let url = titleElement ? titleElement.href : null;
          
          // Try multiple selectors for company
          let companyElement = jobElement.querySelector('[data-automation="jobCompany"]') ||
                             jobElement.querySelector('.y735df0') ||
                             jobElement.querySelector('[data-automation="companyName"]');
          
          let company = companyElement ? companyElement.textContent.trim() : 'Company not specified';
          
          // Try multiple selectors for location
          let locationElement = jobElement.querySelector('[data-automation="jobLocation"]') ||
                              jobElement.querySelector('.y735df0._1iz8dgs4e._17fwsf70 span') ||
                              jobElement.querySelector('[data-automation="jobSubtitle"] span');
          
          let location = locationElement ? locationElement.textContent.trim() : 'Location not specified';
          
          // Try multiple selectors for posted time
          let postedElement = jobElement.querySelector('[data-automation="jobListingDate"]') ||
                            jobElement.querySelector('.y735df0._1pehz5z0._17fwsf70') ||
                            jobElement.querySelector('time');
          
          let postedAgo = postedElement ? postedElement.textContent.trim() : 'Time not specified';
          
          // Try to find salary information
          let salaryElement = jobElement.querySelector('[data-automation="jobSalary"]') ||
                            jobElement.querySelector('.y735df0._1akoxu50');
          
          let salary = salaryElement ? salaryElement.textContent.trim() : 'Not specified';
          
          // Try to find job type
          let typeElement = jobElement.querySelector('[data-automation="jobClassification"]') ||
                          jobElement.querySelector('.y735df0._6ufnpk2u');
          
          let jobType = typeElement ? typeElement.textContent.trim() : 'Not specified';
          
          // Extract job summary/description if available
          let summaryElement = jobElement.querySelector('[data-automation="jobDescription"]') ||
                             jobElement.querySelector('.y735df0._2mc2xkbu') ||
                             jobElement.querySelector('p');
          
          let summary = summaryElement ? summaryElement.textContent.trim() : 'No summary available';
          
          if (title && url) {
            // Clean up the URL - ensure it's a full URL
            if (url.startsWith('/')) {
              url = 'https://www.seek.com.au' + url;
            }
            
            // Remove URL tracking parameters for cleaner URLs
            try {
              const urlObj = new URL(url);
              urlObj.searchParams.delete('tracking');
              urlObj.searchParams.delete('type');
              url = urlObj.toString();
            } catch (e) {
              // Keep original URL if parsing fails
            }
            
            extractedJobs.push({
              title: title,
              company: company,
              location: location,
              postedAgo: postedAgo,
              salary: salary,
              jobType: jobType,
              summary: summary.length > 200 ? summary.substring(0, 200) + '...' : summary,
              url: url,
              source: 'search_page',
              isBasicInfo: true
            });
            
            console.log(`Extracted job ${i + 1}: ${title} at ${company}`);
          } else {
            console.log(`Skipped job ${i + 1}: Missing title or URL`);
          }
          
        } catch (error) {
          console.log(`Error extracting job ${i + 1}: ${error.message}`);
        }
      }
      
      return extractedJobs;
      
    }, maxJobs);
    
    console.log(`✅ Successfully extracted ${jobs.length} jobs with basic info from search page`);
    return jobs;
    
  } catch (error) {
    console.error(`❌ Error scraping basic job info: ${error.message}`);
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = {
  scrapeBasicJobInfoFromSearchResults
};
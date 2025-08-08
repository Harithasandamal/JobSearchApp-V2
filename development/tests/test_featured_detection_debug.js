/**
 * Debug Featured Job Detection
 * Inspects the actual DOM structure to understand why featured job detection is failing
 */

const puppeteer = require('puppeteer');

class FeaturedDetectionDebug {
  constructor() {
    this.results = {
      totalJobs: 0,
      featuredJobsFound: 0,
      domStructure: []
    };
  }

  async debugFeaturedDetection() {
    console.log('🔍 Debugging Featured Job Detection');
    console.log('====================================');
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      // Set user agent to avoid blocking
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Use the same URL structure as the app
      const testUrl = 'https://www.seek.com.au/jobs/in-Dandenong-VIC-3175?daterange=3&distance=5&sortmode=ListedDate';
      console.log(`🔍 Testing URL: ${testUrl}`);
      
      await page.goto(testUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log(`📊 Analyzing DOM structure for featured jobs...`);
      
      const domAnalysis = await page.evaluate(() => {
        const results = {
          totalJobs: 0,
          featuredJobsFound: 0,
          domStructure: [],
          jobElements: []
        };
        
        // Try multiple selector strategies for SEEK job listings
        const jobSelectors = [
          '[data-automation="normalJob"]',
          '[data-automation="premiumJob"]',  
          '[data-automation="featuredJob"]',
          'article[data-automation*="job"]',
          '.job-tile',
          'article[class*="job"]'
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
        
        results.totalJobs = jobElements.length;
        
        // Analyze each job element
        jobElements.forEach((element, index) => {
          if (index >= 10) return; // Only analyze first 10 jobs
          
          const jobAnalysis = {
            index: index + 1,
            title: '',
            postedTime: '',
            isFeatured: false,
            featuredSelectors: [],
            domAttributes: {},
            className: element.className,
            dataAutomation: element.getAttribute('data-automation'),
            innerHTML: element.innerHTML.substring(0, 500) // First 500 chars
          };
          
          // Extract title
          const titleElement = element.querySelector('[data-automation="jobTitle"]') || 
                              element.querySelector('h3 a') || 
                              element.querySelector('h2 a');
          if (titleElement) {
            jobAnalysis.title = titleElement.textContent.trim();
          }
          
          // Extract posted time
          const timeElement = element.querySelector('[data-automation="jobListingDate"]') ||
                             element.querySelector('.date') ||
                             element.querySelector('.posted') ||
                             element.querySelector('[class*="date"]') ||
                             element.querySelector('[class*="time"]');
          if (timeElement) {
            jobAnalysis.postedTime = timeElement.textContent.trim();
          }
          
          // Check for featured indicators - comprehensive list
          const featuredSelectors = [
            '[data-automation="featuredJob"]',
            '[data-automation="premiumJob"]',
            '.featured-job',
            '.featured',
            '[class*="featured"]',
            '[data-automation*="featured"]',
            '.premium',
            '[class*="premium"]',
            '[data-automation*="premium"]',
            '.sponsored',
            '[class*="sponsored"]',
            '[data-automation*="sponsored"]',
            '.highlighted',
            '[class*="highlighted"]',
            '[data-automation*="highlighted"]'
          ];
          
          featuredSelectors.forEach(selector => {
            if (element.querySelector(selector)) {
              jobAnalysis.isFeatured = true;
              jobAnalysis.featuredSelectors.push(selector);
            }
          });
          
          // Check if element itself has featured attributes
          if (element.className.includes('featured') || 
              element.className.includes('premium') ||
              element.className.includes('sponsored') ||
              element.className.includes('highlighted') ||
              element.getAttribute('data-automation')?.includes('featured') ||
              element.getAttribute('data-automation')?.includes('premium') ||
              element.getAttribute('data-automation')?.includes('sponsored') ||
              element.getAttribute('data-automation')?.includes('highlighted')) {
            jobAnalysis.isFeatured = true;
            jobAnalysis.featuredSelectors.push('element-itself');
          }
          
          // Check for visual indicators (badges, labels, etc.)
          const visualIndicators = [
            '.badge',
            '.label',
            '.tag',
            '[class*="badge"]',
            '[class*="label"]',
            '[class*="tag"]',
            '[data-automation*="badge"]',
            '[data-automation*="label"]',
            '[data-automation*="tag"]'
          ];
          
          visualIndicators.forEach(selector => {
            const indicator = element.querySelector(selector);
            if (indicator) {
              const text = indicator.textContent.toLowerCase();
              if (text.includes('featured') || text.includes('premium') || text.includes('sponsored')) {
                jobAnalysis.isFeatured = true;
                jobAnalysis.featuredSelectors.push(`visual-indicator: ${selector} (${text})`);
              }
            }
          });
          
          // Check for no posted time (common indicator of featured jobs)
          if (!jobAnalysis.postedTime || jobAnalysis.postedTime.trim() === '') {
            jobAnalysis.featuredSelectors.push('no-posted-time');
          }
          
          // Get all attributes
          for (let attr of element.attributes) {
            jobAnalysis.domAttributes[attr.name] = attr.value;
          }
          
          if (jobAnalysis.isFeatured) {
            results.featuredJobsFound++;
          }
          
          results.domStructure.push(jobAnalysis);
        });
        
        return results;
      });
      
      this.results = domAnalysis;
      
      console.log(`\n📊 DOM Analysis Results:`);
      console.log(`Total Jobs Found: ${this.results.totalJobs}`);
      console.log(`Featured Jobs Detected: ${this.results.featuredJobsFound}`);
      
      console.log(`\n🔍 Detailed Job Analysis:`);
      this.results.domStructure.forEach(job => {
        const featuredStatus = job.isFeatured ? '[FEATURED]' : '[REGULAR]';
        console.log(`\n${job.index}. ${featuredStatus} ${job.title}`);
        console.log(`   Posted Time: "${job.postedTime}"`);
        console.log(`   Class: ${job.className}`);
        console.log(`   Data-Automation: ${job.dataAutomation}`);
        console.log(`   Featured Selectors Found: ${job.featuredSelectors.join(', ') || 'None'}`);
        console.log(`   All Attributes:`, job.domAttributes);
      });
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Debug failed:', error.message);
      throw error;
    } finally {
      await browser.close();
    }
  }

  async run() {
    try {
      await this.debugFeaturedDetection();
      console.log('\n✅ Featured Job Detection Debug Completed');
    } catch (error) {
      console.error('\n❌ Featured Job Detection Debug Failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the debug if this file is executed directly
if (require.main === module) {
  const debug = new FeaturedDetectionDebug();
  debug.run();
}

module.exports = FeaturedDetectionDebug; 
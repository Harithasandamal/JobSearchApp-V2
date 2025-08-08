/**
 * ENHANCED FAST SEARCH CONTROLLER - Different approaches for light/dark modes
 * Light mode: Instant sample data with smooth loading simulation
 * Dark mode: Direct SEEK scraping with real-time progress updates
 */
const puppeteer = require('puppeteer');
const UrlBuilder = require('../../scrapers/UrlBuilder');
const workflowLogger = require('../../utils/WorkflowLogger');

class EnhancedFastSearchController {
  constructor() {
    this.activeProcesses = new Map();
  }

  /**
   * Start enhanced fast search with different approaches
   */
  async startEnhancedFastSearch(searchParams) {
    const { keyword, location, distance, postedAgo, mode = 'dark' } = searchParams;
    
    // Generate unique process ID
    const processId = `enhanced_fast_search_${Date.now()}`;
    
    // Build search URL for dark mode
    let searchUrl = null;
    if (mode === 'dark') {
      searchUrl = UrlBuilder.buildSeekUrl(keyword, location, distance, postedAgo);
    }
    
    // Initialize process info
    const processInfo = {
      status: 'running',
      progress: 0,
      jobs: [],
      error: null,
      startTime: Date.now(),
      mode,
      searchUrl, // Store search URL in process info
      currentStep: 'Initializing...',
      steps: mode === 'light' ? this.getLightModeSteps() : this.getDarkModeSteps()
    };
    
    this.activeProcesses.set(processId, processInfo);
    
    // Log start
    workflowLogger.log(`🚀 Enhanced fast search started (${mode} mode)`, 'process');
    
    // Start async search
    setTimeout(async () => {
      try {
        await this.executeEnhancedFastSearch(processId, searchParams);
      } catch (error) {
        console.error('❌ Enhanced fast search failed:', error.message);
        const process = this.activeProcesses.get(processId);
        if (process) {
          process.status = 'failed';
          process.error = error.message;
        }
      }
    }, 100);
    
    return { processId, searchUrl };
  }

  /**
   * Get light mode steps for smooth loading simulation
   */
  getLightModeSteps() {
    return [
      { name: 'Initializing search engine', progress: 10 },
      { name: 'Loading sample data', progress: 30 },
      { name: 'Processing job listings', progress: 60 },
      { name: 'Formatting results', progress: 80 },
      { name: 'Completing search', progress: 100 }
    ];
  }

  /**
   * Get dark mode steps for real SEEK scraping
   */
  getDarkModeSteps() {
    return [
      { name: 'Initializing browser', progress: 10 },
      { name: 'Building search URL', progress: 20 },
      { name: 'Loading SEEK page', progress: 40 },
      { name: 'Extracting job listings', progress: 70 },
      { name: 'Processing results', progress: 90 },
      { name: 'Completing search', progress: 100 }
    ];
  }

  /**
   * Execute enhanced fast search with different approaches
   */
  async executeEnhancedFastSearch(processId, searchParams) {
    const { keyword, location, distance, postedAgo, mode } = searchParams;
    const process = this.activeProcesses.get(processId);
    
    if (!process) return;
    
    try {
      if (mode === 'light') {
        await this.executeLightModeSearch(processId, searchParams);
      } else {
        await this.executeDarkModeSearch(processId, searchParams);
      }
    } catch (error) {
      console.error('❌ Enhanced fast search error:', error.message);
      process.status = 'failed';
      process.error = error.message;
      workflowLogger.log(`❌ Enhanced fast search failed: ${error.message}`, 'error');
    }
  }

  /**
   * Execute light mode search with real URL scraping
   */
  async executeLightModeSearch(processId, searchParams) {
    const process = this.activeProcesses.get(processId);
    const steps = process.steps;
    
    // Step 1: Initializing search engine
    await this.updateProgress(processId, steps[0].progress, steps[0].name);
    await this.simulateDelay(300);
    
    // Step 2: Loading sample data
    await this.updateProgress(processId, steps[1].progress, steps[1].name);
    const sampleUrls = await this.getSampleUrls();
    console.log(`🔗 Light mode: Found ${sampleUrls.length} sample URLs`);
    await this.simulateDelay(400);
    
    // Step 3: Processing job listings
    await this.updateProgress(processId, steps[2].progress, steps[2].name);
    const jobs = await this.scrapeSampleUrls(sampleUrls, processId);
    await this.simulateDelay(500);
    
    // Step 4: Formatting results
    await this.updateProgress(processId, steps[3].progress, steps[3].name);
    const formattedJobs = this.formatJobs(jobs, 'light');
    await this.simulateDelay(300);
    
    // Step 5: Completing search
    await this.updateProgress(processId, steps[4].progress, steps[4].name);
    
    process.jobs = formattedJobs;
    process.status = 'completed';
    
    // Add a small delay to ensure status is properly updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    workflowLogger.log(`✅ Light mode search completed: ${formattedJobs.length} jobs found`, 'process');
  }

  /**
   * Execute dark mode search with real SEEK scraping
   */
  async executeDarkModeSearch(processId, searchParams) {
    const process = this.activeProcesses.get(processId);
    const steps = process.steps;
    
    // Step 1: Initializing browser
    await this.updateProgress(processId, steps[0].progress, steps[0].name);
    await this.simulateDelay(300);
    
    // Step 2: Building search URL
    await this.updateProgress(processId, steps[1].progress, steps[1].name);
    const url = UrlBuilder.buildSeekUrl(searchParams.keyword, searchParams.location, searchParams.distance, searchParams.postedAgo);
    console.log(`🔗 Dark mode search: ${url}`);
    
    // Store the URL in process info for frontend access
    process.searchUrl = url;
    
    await this.simulateDelay(200);
    
    // Step 3: Loading SEEK page
    await this.updateProgress(processId, steps[2].progress, steps[2].name);
    const jobs = await this.scrapeSeekPageWithProgress(url, processId);
    await this.simulateDelay(300);
    
    // Step 4: Processing results
    await this.updateProgress(processId, steps[3].progress, steps[3].name);
    const formattedJobs = this.formatJobs(jobs, 'dark');
    await this.simulateDelay(200);
    
    // Step 5: Completing search
    await this.updateProgress(processId, steps[4].progress, steps[4].name);
    await this.simulateDelay(100);
    
    // Step 6: Final completion
    await this.updateProgress(processId, steps[5].progress, steps[5].name);
    
    process.jobs = formattedJobs;
    process.status = 'completed';
    
    // Add a small delay to ensure status is properly updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    workflowLogger.log(`✅ Dark mode search completed: ${formattedJobs.length} jobs found`, 'process');
  }

    /**
   * Scrape SEEK page with proven modern strategy (NO HANGING)
   */
  async scrapeSeekPageWithProgress(url, processId) {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--memory-pressure-off',
        '--disable-features=TranslateUI',
        '--disable-extensions',
        '--disable-plugins',
        '--window-size=1366,768',
        '--disable-logging',
        '--disable-dev-tools',
        '--no-first-run',
        '--ignore-certificate-errors',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    try {
      const page = await browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Optimize page loading - block unnecessary resources
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font' || resourceType === 'media') {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      // Navigate to page with optimized settings
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 10000 
      });
      
      // Wait for content to load (reduced time for speed)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract job listings with PROVEN MODERN STRATEGY (exact same as standalone)
      const jobs = await page.evaluate(() => {
        const results = [];
        
        // PROVEN STRATEGY: Modern SEEK job cards (2024+) - ALL results
        const modernJobCards = document.querySelectorAll('[data-automation="normalJob"], [data-testid="job-card"], [data-automation="job-card"]');
        console.log(`Found ${modernJobCards.length} modern job cards`);
        
        modernJobCards.forEach((card, index) => {
          try {
            const titleElement = card.querySelector('[data-automation="jobTitle"], h3, h2, [data-testid="job-title"]');
            const companyElement = card.querySelector('[data-automation="jobCompany"], [data-automation="advertiser-name"], [data-testid="company-name"]');
            const locationElement = card.querySelector('[data-automation="jobLocation"], [data-automation="job-detail-location"], [data-testid="location"]');
            const postedElement = card.querySelector('[data-automation="jobListingDate"], [data-testid="posted-date"]');
            const urlElement = card.querySelector('a[href*="/job/"]');
            
            if (titleElement && companyElement && locationElement) {
              results.push({
                id: `modern-job-${index + 1}`,
                title: titleElement.textContent.trim(),
                company: companyElement.textContent.trim(),
                location: locationElement.textContent.trim(),
                postedAgo: postedElement ? postedElement.textContent.trim() : '',
                url: urlElement ? urlElement.href : '',
                success: true
              });
            }
          } catch (error) {
            // Skip malformed cards
          }
        });
        
        console.log(`Total results found: ${results.length}`);
        return results; // Return ALL results, no limit
      });
      
      console.log(`📊 Extracted ${jobs.length} jobs from SEEK`);
      return jobs;
      
    } finally {
      await browser.close();
    }
  }



  /**
   * Get sample URLs from config
   */
  async getSampleUrls() {
    const { SAMPLE_URLS } = require('../../constants/sampleUrls');
    return SAMPLE_URLS || [];
  }

  /**
   * Scrape sample URLs for light mode - PARALLEL OPTIMIZED
   */
  async scrapeSampleUrls(urls, processId) {
    console.log(`🚀 Starting parallel scraping of ${urls.length} URLs`);
    
    // Create multiple browser instances for parallel processing
    const maxConcurrentBrowsers = 2; // Reduced for stability
    const browserPromises = [];
    
    // Process URLs in batches for parallel scraping
    for (let i = 0; i < urls.length; i += maxConcurrentBrowsers) {
      const batch = urls.slice(i, i + maxConcurrentBrowsers);
      const batchPromises = batch.map(async (url, batchIndex) => {
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--memory-pressure-off',
            '--disable-features=TranslateUI',
            '--disable-extensions',
            '--disable-plugins',
            '--window-size=1366,768',
            '--disable-logging',
            '--disable-dev-tools',
            '--no-first-run',
            '--ignore-certificate-errors',
            '--disable-blink-features=AutomationControlled'
          ]
        });
        
        try {
          const page = await browser.newPage();
          
          // Set user agent to avoid detection
          await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
          
          // Optimize page loading - block unnecessary resources
          await page.setRequestInterception(true);
          page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font' || resourceType === 'media') {
              req.abort();
            } else {
              req.continue();
            }
          });
          
          console.log(`🔗 Scraping URL ${i + batchIndex + 1}/${urls.length}: ${url}`);
          
          // Navigate to page with optimized settings
          await page.goto(url, { 
            waitUntil: 'domcontentloaded', 
            timeout: 10000 // Reduced timeout for faster processing
          });
          
          // Wait for content to load (reduced time)
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Extract job details from individual job page with IMPROVED posted time extraction
          const jobDetails = await page.evaluate(() => {
            const titleElement = document.querySelector('[data-automation="job-details-heading"], h1, [data-testid="job-title"]');
            const companyElement = document.querySelector('[data-automation="advertiser-name"], [data-testid="company-name"], [data-automation="jobCompany"]');
            const locationElement = document.querySelector('[data-automation="job-detail-location"], [data-testid="location"], [data-automation="jobLocation"]');
            
            // Check if featured job
            const isFeatured = document.querySelector('[data-automation="promoted-job"], [data-testid="promoted-job"], .promoted, .featured') !== null;
            
            // IMPROVED posted time extraction - search ALL elements for time-related text
            let postedAgo = '';
            let postedTimeFound = false;
            
            // Search all elements for time-related text
            const timeKeywords = ['ago', 'posted', 'listed', 'advertised', 'today', 'yesterday', 'date', 'time'];
            const allElements = document.querySelectorAll('*');
            
            for (const element of allElements) {
              const text = element.textContent.toLowerCase();
              if (timeKeywords.some(keyword => text.includes(keyword))) {
                // Look for specific time patterns in this element
                const timePatterns = [
                  /(\d+\s+(?:minute|hour|day|week|month)s?\s+ago)/i,
                  /(just\s+now)/i,
                  /(today)/i,
                  /(yesterday)/i,
                  /(posted\s+\d+\s+\w+)/i,
                  /(listed\s+\d+\s+\w+)/i,
                  /(advertised\s+\d+\s+\w+)/i,
                  /(\d+\s+\w+\s+ago)/i,
                  /(\w+\s+ago)/i
                ];
                
                for (const pattern of timePatterns) {
                  const match = text.match(pattern);
                  if (match) {
                    postedAgo = match[1];
                    postedTimeFound = true;
                    break;
                  }
                }
                
                if (postedTimeFound) break;
              }
            }
            
            if (titleElement && companyElement && locationElement) {
              return {
                title: titleElement.textContent.trim(),
                company: companyElement.textContent.trim(),
                location: locationElement.textContent.trim(),
                postedAgo: postedAgo || 'No date found',
                isFeatured: isFeatured,
                postedTimeFound: postedTimeFound,
                url: window.location.href,
                success: true
              };
            }
            
            return null;
          });
          
          if (jobDetails) {
            console.log(`✅ Extracted job: ${jobDetails.title} at ${jobDetails.company} - Posted: "${jobDetails.postedAgo}"`);
            return jobDetails;
          } else {
            console.log(`⚠️ Failed to extract job details from: ${url}`);
            return null;
          }
          
        } catch (error) {
          console.log(`❌ Error scraping URL ${url}:`, error.message);
          return null;
        } finally {
          await browser.close();
        }
      });
      
      // Wait for current batch to complete before starting next batch
      const batchResults = await Promise.all(batchPromises);
      browserPromises.push(...batchResults.filter(result => result !== null));
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`📊 Light mode: Extracted ${browserPromises.length} jobs from ${urls.length} URLs (parallel processing)`);
    return browserPromises;
  }

  /**
   * Update progress with smooth transitions
   */
  async updateProgress(processId, progress, stepName) {
    const process = this.activeProcesses.get(processId);
    if (process) {
      process.progress = progress;
      process.currentStep = stepName;
      workflowLogger.log(`⚡ ${stepName} (${progress}%)`, 'process');
    }
  }

  /**
   * Simulate delay for smooth loading
   */
  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Format posted time to standard format
   */
  formatPostedTime(postedText) {
    if (!postedText) return '';
    
    // Ensure postedText is a string
    const text = String(postedText).toLowerCase().trim();
    
    // ✅ Filter out "ms" values - they're not valid posted times
    if (text.includes('ms')) {
      return ''; // Reset if it contains "ms"
    }
    
    // Handle "3d ago" format (common SEEK format)
    if (text.includes('d ago')) {
      const match = text.match(/(\d+)d\s*ago/);
      if (match) {
        const num = parseInt(match[1]);
        return `${num} day${num === 1 ? '' : 's'}`;
      }
    }
    
    // Handle "3h ago" format
    if (text.includes('h ago')) {
      const match = text.match(/(\d+)h\s*ago/);
      if (match) {
        const num = parseInt(match[1]);
        return `${num} hour${num === 1 ? '' : 's'}`;
      }
    }
    
    // Handle "3m ago" format (minutes)
    if (text.includes('m ago')) {
      const match = text.match(/(\d+)m\s*ago/);
      if (match) {
        const num = parseInt(match[1]);
        return `${num} minute${num === 1 ? '' : 's'}`;
      }
    }
    
    // Handle "3w ago" format
    if (text.includes('w ago')) {
      const match = text.match(/(\d+)w\s*ago/);
      if (match) {
        const num = parseInt(match[1]);
        return `${num} week${num === 1 ? '' : 's'}`;
      }
    }
    
    // Handle common SEEK formats
    if (text.includes('minute')) {
      const match = text.match(/(\d+)\s*minute/);
      if (match) {
        const num = parseInt(match[1]);
        return `${num} minute${num === 1 ? '' : 's'}`;
      }
    }
    
    if (text.includes('hour')) {
      const match = text.match(/(\d+)\s*hour/);
      if (match) {
        const num = parseInt(match[1]);
        return `${num} hour${num === 1 ? '' : 's'}`;
      }
    }
    
    if (text.includes('day')) {
      const match = text.match(/(\d+)\s*day/);
      if (match) {
        const num = parseInt(match[1]);
        return `${num} day${num === 1 ? '' : 's'}`;
      }
    }
    
    if (text.includes('week')) {
      const match = text.match(/(\d+)\s*week/);
      if (match) {
        const num = parseInt(match[1]);
        return `${num} week${num === 1 ? '' : 's'}`;
      }
    }
    
    if (text.includes('month')) {
      const match = text.match(/(\d+)\s*month/);
      if (match) {
        const num = parseInt(match[1]);
        return `${num} month${num === 1 ? '' : 's'}`;
      }
    }
    
    // Handle "ago" format (e.g., "2 days ago")
    if (text.includes('ago')) {
      const match = text.match(/(\d+)\s*(\w+)\s*ago/);
      if (match) {
        const num = parseInt(match[1]);
        const unit = match[2];
        return `${num} ${unit}${num === 1 ? '' : 's'}`;
      }
    }
    
    // Handle "just now" or "today"
    if (text.includes('just now') || text.includes('today')) {
      return 'Just now';
    }
    
    // Handle "yesterday"
    if (text.includes('yesterday')) {
      return '1 day';
    }
    
    // Return original if no pattern matches
    return postedText;
  }

  /**
   * Format location to show only part before comma
   */
  formatLocation(locationText) {
    if (!locationText) return '';
    
    // Ensure locationText is a string
    const text = String(locationText).trim();
    
    // Split by comma and take the first part
    const parts = text.split(',');
    const primaryLocation = parts[0].trim();
    
    return primaryLocation;
  }

  /**
   * Format jobs for consistent output
   */
  formatJobs(jobs, mode) {
    return jobs.map((job, index) => ({
      id: job.id || `${mode}-job-${index + 1}`,
      title: job.title || '',
      company: job.company || '',
      location: this.formatLocation(job.location || ''),
      postedAgo: this.formatPostedTime(job.postedAgo || ''),
      url: job.url || '',
      success: job.success || false
    }));
  }

  /**
   * Get search status with enhanced info
   */
  getSearchStatus(processId) {
    const process = this.activeProcesses.get(processId);
    if (!process) {
      return { status: 'not_found', error: 'Process not found' };
    }
    
    return {
      status: process.status,
      progress: process.progress,
      jobs: process.jobs,
      error: process.error,
      totalJobs: process.jobs?.length || 0,
      jobCount: process.jobs?.length || 0, // Add jobCount for frontend compatibility
      currentStep: process.currentStep,
      mode: process.mode
    };
  }

  /**
   * Stop search process
   */
  stopSearch(processId) {
    const process = this.activeProcesses.get(processId);
    if (process) {
      process.status = 'stopped';
      workflowLogger.log(`⏹️ Enhanced fast search stopped`, 'process');
    }
  }

  /**
   * Clean up old processes
   */
  cleanupOldProcesses() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    for (const [processId, process] of this.activeProcesses.entries()) {
      if (now - process.startTime > maxAge) {
        this.activeProcesses.delete(processId);
      }
    }
  }
}

// Create singleton instance
const enhancedFastSearchController = new EnhancedFastSearchController();

module.exports = enhancedFastSearchController; 
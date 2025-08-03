const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const workflowLogger = require('./WorkflowLogger');

class JobDataManager {
  constructor() {
    this.jobDataDir = path.join(__dirname, '../../job-data');
    this.ensureJobDataDirectory();
  }

  /**
   * Ensure job-data directory exists
   */
  ensureJobDataDirectory() {
    if (!fs.existsSync(this.jobDataDir)) {
      fs.mkdirSync(this.jobDataDir, { recursive: true });
      workflowLogger.logScoring(`📁 Created job-data directory: ${this.jobDataDir}`);
    }
  }

  /**
   * Clean job-data directory at session start
   */
  cleanJobDataDirectory() {
    try {
      if (fs.existsSync(this.jobDataDir)) {
        const files = fs.readdirSync(this.jobDataDir);
        for (const file of files) {
          const filePath = path.join(this.jobDataDir, file);
          fs.unlinkSync(filePath);
        }
        workflowLogger.logScoring(`🧹 Cleaned job-data directory: ${files.length} files removed`);
      }
    } catch (error) {
      workflowLogger.logError('Error cleaning job-data directory', error.message);
    }
  }

  /**
   * Download job page HTML and save it with retry mechanism
   */
  async downloadJobHTML(jobUrl, jobId) {
    workflowLogger.logScoring(`📥 Downloading HTML for job ${jobId}: ${jobUrl}`);
    
    // Get timeout values from environment or use optimized defaults
    const browserLaunchTimeout = parseInt(process.env.TEST_BROWSER_LAUNCH_TIMEOUT) || 30000;
    const navigationTimeout = parseInt(process.env.TEST_NAVIGATION_TIMEOUT) || 25000;
    const contentWaitTimeout = parseInt(process.env.TEST_CONTENT_WAIT_TIMEOUT) || 3000;
    
    workflowLogger.logScoring(`⏱️ Using timeouts: Browser=${browserLaunchTimeout}ms, Navigation=${navigationTimeout}ms, Content=${contentWaitTimeout}ms`);
    
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let browser = null;
      
      try {
        workflowLogger.logScoring(`🔄 Attempt ${attempt}/${maxRetries} for job ${jobId}`);
        
        // Add timeout protection for browser launch
        const browserLaunchPromise = puppeteer.launch({ 
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',
            '--disable-javascript',
            '--disable-default-apps',
            '--disable-sync',
            '--disable-translate',
            '--disable-logging',
            '--disable-background-networking',
            '--disable-component-update',
            '--disable-client-side-phishing-detection',
            '--disable-hang-monitor',
            '--disable-prompt-on-repost',
            '--disable-domain-reliability',
            '--disable-ipc-flooding-protection',
            '--no-default-browser-check',
            '--no-first-run',
            '--disable-default-apps',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection'
          ]
        });
        
        // Dynamic timeout for browser launch
        browser = await Promise.race([
          browserLaunchPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Browser launch timeout after ${browserLaunchTimeout}ms`)), browserLaunchTimeout)
          )
        ]);

        const page = await browser.newPage();
        
        // Set user agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Set additional page options for better reliability
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setExtraHTTPHeaders({
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        });
        
        // Navigate to job page with dynamic timeout and retry
        await Promise.race([
          page.goto(jobUrl, { 
            waitUntil: 'domcontentloaded', 
            timeout: navigationTimeout 
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Page navigation timeout after ${navigationTimeout}ms`)), navigationTimeout)
          )
        ]);

        // Dynamic wait for dynamic content
        await Promise.race([
          new Promise(resolve => setTimeout(resolve, contentWaitTimeout)),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Content load timeout after ${contentWaitTimeout}ms`)), contentWaitTimeout)
          )
        ]);

        // Get page HTML
        const html = await page.content();
        
        // Verify we got meaningful content
        if (!html || html.length < 1000) {
          throw new Error('Page content too short, likely failed to load properly');
        }
        
        // Save HTML file
        const htmlFilePath = path.join(this.jobDataDir, `job_${jobId}.html`);
        fs.writeFileSync(htmlFilePath, html, 'utf8');
        
        workflowLogger.logScoring(`✅ HTML saved: ${htmlFilePath}`);
        
        await browser.close();
        return htmlFilePath;
        
      } catch (error) {
        lastError = error;
        workflowLogger.logError(`Error downloading HTML for job ${jobId} (attempt ${attempt}/${maxRetries})`, error.message);
        
        // Clean up browser
        if (browser) {
          try {
            await browser.close();
          } catch (closeError) {
            workflowLogger.logError('Error closing browser', closeError.message);
          }
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw new Error(`Failed to download job HTML after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        workflowLogger.logScoring(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Extract job details from HTML and convert to markdown
   */
  async extractJobDetailsToMarkdown(htmlFilePath, jobId, jobTitle, jobCompany) {
    workflowLogger.logScoring(`📝 Converting job ${jobId} details to markdown`);
    
    try {
      const html = fs.readFileSync(htmlFilePath, 'utf8');
      
      // Get timeout values from environment or use optimized defaults
      const browserLaunchTimeout = parseInt(process.env.TEST_BROWSER_LAUNCH_TIMEOUT) || 30000;
      const contentTimeout = parseInt(process.env.TEST_NAVIGATION_TIMEOUT) || 35000; // Increased timeout
      
      workflowLogger.logScoring(`⏱️ Using timeouts: Browser=${browserLaunchTimeout}ms, Content=${contentTimeout}ms`);
      
      const browser = await puppeteer.launch({ 
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });
      const page = await browser.newPage();
      
      // Set page timeout explicitly to prevent default 30s timeout
      await page.setDefaultTimeout(contentTimeout);
      await page.setDefaultNavigationTimeout(contentTimeout);
      
      // Set the HTML content with more robust timeout handling
      try {
        await page.setContent(html, { 
          timeout: contentTimeout,
          waitUntil: 'domcontentloaded'
        });
      } catch (error) {
        // If setContent fails, try a different approach
        workflowLogger.logScoring(`⚠️ setContent failed, trying alternative method: ${error.message}`);
        
        try {
          // Try setting content without waitUntil
          await page.setContent(html, { timeout: contentTimeout });
        } catch (secondError) {
          // If both setContent methods fail, use a fallback approach
          workflowLogger.logScoring(`⚠️ setContent fallback failed, using document.write: ${secondError.message}`);
          
          // Use document.write as a last resort
          await page.evaluate((htmlContent) => {
            document.open();
            document.write(htmlContent);
            document.close();
          }, html);
        }
      }
      
      // Extract job description using multiple selectors with timeout protection
      const jobDescription = await Promise.race([
        page.evaluate(() => {
        const selectors = [
          '[data-automation="jobDescription"]',
          '[data-testid="job-description"]',
          '.job-description',
          '.description',
          '.job-details',
          '[data-automation="normalJob"]',
          '.yvsb870',
          'div[data-automation="jobDescription"]',
          'section[data-automation="jobDescription"]'
        ];
        
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.innerText || element.textContent || '';
            if (text.trim().length > 100) return text.trim();
          }
        }
        
        // Fallback: find the largest visible text block
        let largestText = '';
        let largestLength = 0;
        const allDivs = Array.from(document.querySelectorAll('div'));
        
        for (const div of allDivs) {
          const style = window.getComputedStyle(div);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          
          const text = div.innerText || div.textContent || '';
          if (text.length > largestLength && text.length > 200 && text.length < 10000) {
            largestText = text;
            largestLength = text.length;
          }
        }
        
        return largestText.trim();
      }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Content evaluation timeout after ${contentTimeout}ms`)), contentTimeout)
        )
      ]);

      await browser.close();

      if (!jobDescription || jobDescription.length < 100) {
        throw new Error('Could not extract meaningful job description from HTML');
      }

      // Create markdown content
      const markdownContent = `# ${jobTitle}
**Company:** ${jobCompany}
**Job ID:** ${jobId}
**Extracted Date:** ${new Date().toISOString()}

---

## Job Description

${jobDescription}

---

*This document was automatically generated from the job posting HTML.*
`;

      // Save markdown file
      const markdownFilePath = path.join(this.jobDataDir, `job_${jobId}.md`);
      fs.writeFileSync(markdownFilePath, markdownContent, 'utf8');
      
      workflowLogger.logScoring(`✅ Markdown saved: ${markdownFilePath}`);
      
      return {
        markdownPath: markdownFilePath,
        jobDescription: jobDescription
      };
      
    } catch (error) {
      workflowLogger.logError(`Error converting job ${jobId} to markdown`, error.message);
      throw error;
    }
  }

  /**
   * Get stored job data
   */
  getJobData(jobId) {
    const htmlPath = path.join(this.jobDataDir, `job_${jobId}.html`);
    const markdownPath = path.join(this.jobDataDir, `job_${jobId}.md`);
    
    return {
      htmlPath: fs.existsSync(htmlPath) ? htmlPath : null,
      markdownPath: fs.existsSync(markdownPath) ? markdownPath : null,
      htmlExists: fs.existsSync(htmlPath),
      markdownExists: fs.existsSync(markdownPath)
    };
  }

  /**
   * Read markdown content
   */
  readMarkdownContent(jobId) {
    const markdownPath = path.join(this.jobDataDir, `job_${jobId}.md`);
    if (fs.existsSync(markdownPath)) {
      return fs.readFileSync(markdownPath, 'utf8');
    }
    return null;
  }

  /**
   * List all stored job data
   */
  listStoredJobs() {
    try {
      const files = fs.readdirSync(this.jobDataDir);
      const jobs = new Set();
      
      files.forEach(file => {
        const match = file.match(/^job_(.+)\.(html|md)$/);
        if (match) {
          jobs.add(match[1]);
        }
      });
      
      return Array.from(jobs);
    } catch (error) {
      console.error('Error listing stored jobs:', error);
      return [];
    }
  }
}

module.exports = JobDataManager;
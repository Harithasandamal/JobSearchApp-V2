const puppeteer = require('puppeteer');

class BrowserManager {
  constructor() {
    this.browser = null;
  }
  
  async launchBrowser() {
    const launchStart = Date.now();
    console.log('[DEBUG] Launching Puppeteer browser...');
    
    try {
      this.browser = await puppeteer.launch({ 
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
      const launchEnd = Date.now();
      console.log(`[TIMING] Browser launched successfully in ${launchEnd - launchStart} ms`);
      return this.browser;
    } catch (error) {
      console.error(`❌ Failed to launch browser: ${error.message}`);
      throw new Error(`Browser launch failed: ${error.message}`);
    }
  }
  
  async createPage() {
    if (!this.browser) {
      throw new Error('Browser not launched. Call launchBrowser() first.');
    }
    
    const page = await this.browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    return page;
  }
  
  async navigateToPage(page, url) {
    const pageLoadStart = Date.now();
    await page.goto(url, { waitUntil: 'networkidle2' });
    const pageLoadEnd = Date.now();
    console.log(`[TIMING] Page loaded in ${pageLoadEnd - pageLoadStart} ms`);
    
    // Wait additional time for dynamic content to load
    console.log(`[DEBUG] Waiting for dynamic content...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  async extractJobDetailsFromPage(page) {
    return await page.evaluate(() => {
      const trySelectors = (selectors) => {
        for (const selector of selectors) {
          const el = document.querySelector(selector);
          if (el && el.innerText && el.innerText.trim().length > 0) {
            return el.innerText.trim();
          }
        }
        return '';
      };
      
      const title = trySelectors([
        '[data-automation="job-detail-title"]',
        'h1',
        '.job-title'
      ]);
      
      const company = trySelectors([
        '[data-automation="advertiser-name"]',
        '.job-company'
      ]);
      
      const location = trySelectors([
        '[data-automation="job-detail-location"]',
        '.job-location'
      ]);
      
      return { title, company, location };
    });
  }
  
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = BrowserManager; 
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class LightModeSystematicTest {
  constructor() {
    this.results = {
      totalUrls: 0,
      successfulUrls: 0,
      failedUrls: 0,
      totalJobs: 0,
      successfulJobs: 0,
      failedJobs: 0,
      timing: {
        startTime: null,
        endTime: null,
        totalDuration: 0,
        averagePerUrl: 0
      },
      accuracy: {
        jobTitles: { found: 0, total: 0 },
        companies: { found: 0, total: 0 },
        locations: { found: 0, total: 0 },
        postedTimes: { found: 0, total: 0 }
      },
      errors: []
    };
  }

  async initialize() {
    console.log('🔍 LIGHT MODE SYSTEMATIC TEST STARTING');
    console.log('=' .repeat(60));
    
    this.results.timing.startTime = Date.now();
    
    // Load sample URLs from config
    const configPath = path.join(__dirname, '../../app/backend/config/testUrls.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('Sample URLs config not found');
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    this.urls = config.sampleUrls || [];
    this.results.totalUrls = this.urls.length;
    
    console.log(`📋 Loaded ${this.urls.length} URLs for testing`);
    console.log(`🎯 Testing parallel processing with max 2 concurrent browsers`);
  }

  async testParallelProcessing() {
    console.log('\n🚀 TESTING PARALLEL PROCESSING');
    console.log('-'.repeat(40));
    
    const maxConcurrentBrowsers = 2;
    const browsers = [];
    const results = [];
    
    try {
      // Launch browsers
      for (let i = 0; i < maxConcurrentBrowsers; i++) {
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        });
        browsers.push(browser);
      }
      
      console.log(`✅ Launched ${browsers.length} browsers`);
      
      // Process URLs in batches
      for (let i = 0; i < this.urls.length; i += maxConcurrentBrowsers) {
        const batch = this.urls.slice(i, i + maxConcurrentBrowsers);
        const batchPromises = batch.map((url, index) => 
          this.processUrl(url, browsers[index % browsers.length])
        );
        
        console.log(`📦 Processing batch ${Math.floor(i / maxConcurrentBrowsers) + 1}/${Math.ceil(this.urls.length / maxConcurrentBrowsers)}`);
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
        
        // Add delay between batches
        if (i + maxConcurrentBrowsers < this.urls.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Close browsers
      await Promise.all(browsers.map(browser => browser.close()));
      
      return results;
      
    } catch (error) {
      console.error('❌ Browser launch error:', error.message);
      await Promise.all(browsers.map(browser => browser.close()));
      throw error;
    }
  }

  async processUrl(url, browser) {
    const startTime = Date.now();
    const page = await browser.newPage();
    
    try {
      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Block unnecessary resources
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      // Navigate to URL
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Extract job data from individual job page
      const jobData = await page.evaluate(() => {
        const jobs = [];
        
        try {
          // Job Title
          const titleElement = document.querySelector('[data-automation="job-details-title"], h1, .job-title, [data-testid="job-title"]');
          const title = titleElement ? titleElement.textContent.trim() : '';
          
          // Company
          const companyElement = document.querySelector('[data-automation="job-details-company"], .company-name, .employer, [data-testid="company-name"]');
          const company = companyElement ? companyElement.textContent.trim() : '';
          
          // Location
          const locationElement = document.querySelector('[data-automation="job-details-location"], .location, .job-location, [data-testid="location"]');
          let location = locationElement ? locationElement.textContent.trim() : '';
          // Format location (text before comma)
          if (location.includes(',')) {
            location = location.split(',')[0].trim();
          }
          
          // Posted Time
          const timeElement = document.querySelector('[data-automation="jobListingDate"], .posted-time, .job-posted-time, time, [data-testid="posted-time"]');
          let postedTime = timeElement ? timeElement.textContent.trim() : '';
          
          // Format posted time
          if (postedTime) {
            // Handle "3m ago" format
            if (postedTime.includes('m ago')) {
              const match = postedTime.match(/(\d+)m\s*ago/);
              if (match) {
                const num = parseInt(match[1]);
                postedTime = `${num} minute${num === 1 ? '' : 's'}`;
              }
            }
            // Handle "2h ago" format
            else if (postedTime.includes('h ago')) {
              const match = postedTime.match(/(\d+)h\s*ago/);
              if (match) {
                const num = parseInt(match[1]);
                postedTime = `${num} hour${num === 1 ? '' : 's'}`;
              }
            }
            // Handle "1d ago" format
            else if (postedTime.includes('d ago')) {
              const match = postedTime.match(/(\d+)d\s*ago/);
              if (match) {
                const num = parseInt(match[1]);
                postedTime = `${num} day${num === 1 ? '' : 's'}`;
              }
            }
            // Filter out "ms" values
            if (postedTime.includes('ms')) {
              postedTime = '';
            }
          }
          
          if (title || company || location || postedTime) {
            jobs.push({
              title,
              company,
              location,
              postedTime,
              url: window.location.href
            });
          }
          
        } catch (error) {
          console.error('Error processing job page:', error);
        }
        
        return jobs;
      });
      
      const duration = Date.now() - startTime;
      
      return {
        url,
        success: true,
        jobs: jobData,
        duration,
        jobCount: jobData.length
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        url,
        success: false,
        error: error.message,
        duration,
        jobs: []
      };
    } finally {
      await page.close();
    }
  }

  async analyzeResults(results) {
    console.log('\n📊 ANALYZING RESULTS');
    console.log('-'.repeat(40));
    
    let totalJobs = 0;
    let successfulJobs = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        this.results.successfulUrls++;
        const data = result.value;
        
        console.log(`✅ URL ${index + 1}: ${data.jobCount} jobs in ${data.duration}ms`);
        
        data.jobs.forEach(job => {
          totalJobs++;
          let jobSuccess = true;
          
          if (job.title) this.results.accuracy.jobTitles.found++;
          if (job.company) this.results.accuracy.companies.found++;
          if (job.location) this.results.accuracy.locations.found++;
          if (job.postedTime) this.results.accuracy.postedTimes.found++;
          
          this.results.accuracy.jobTitles.total++;
          this.results.accuracy.companies.total++;
          this.results.accuracy.locations.total++;
          this.results.accuracy.postedTimes.total++;
          
          if (job.title && job.company && job.location) {
            successfulJobs++;
          }
        });
        
      } else {
        this.results.failedUrls++;
        const error = result.status === 'rejected' ? result.reason : result.value.error;
        console.log(`❌ URL ${index + 1}: ${error}`);
        this.results.errors.push({ url: this.urls[index], error });
      }
    });
    
    this.results.totalJobs = totalJobs;
    this.results.successfulJobs = successfulJobs;
    this.results.failedJobs = totalJobs - successfulJobs;
    
    // Calculate timing
    this.results.timing.endTime = Date.now();
    this.results.timing.totalDuration = this.results.timing.endTime - this.results.timing.startTime;
    this.results.timing.averagePerUrl = this.results.timing.totalDuration / this.results.totalUrls;
  }

  printSummary() {
    console.log('\n📈 FINAL SUMMARY');
    console.log('='.repeat(60));
    
    // URL Processing
    console.log(`🌐 URL PROCESSING:`);
    console.log(`   Total URLs: ${this.results.totalUrls}`);
    console.log(`   Successful: ${this.results.successfulUrls} (${((this.results.successfulUrls / this.results.totalUrls) * 100).toFixed(1)}%)`);
    console.log(`   Failed: ${this.results.failedUrls} (${((this.results.failedUrls / this.results.totalUrls) * 100).toFixed(1)}%)`);
    
    // Job Processing
    console.log(`\n💼 JOB PROCESSING:`);
    console.log(`   Total Jobs: ${this.results.totalJobs}`);
    console.log(`   Successful: ${this.results.successfulJobs} (${((this.results.successfulJobs / this.results.totalJobs) * 100).toFixed(1)}%)`);
    console.log(`   Failed: ${this.results.failedJobs} (${((this.results.failedJobs / this.results.totalJobs) * 100).toFixed(1)}%)`);
    
    // Timing
    console.log(`\n⏱️ TIMING:`);
    console.log(`   Total Duration: ${this.results.timing.totalDuration}ms (${(this.results.timing.totalDuration / 1000).toFixed(1)}s)`);
    console.log(`   Average per URL: ${this.results.timing.averagePerUrl.toFixed(0)}ms`);
    console.log(`   Jobs per second: ${(this.results.totalJobs / (this.results.timing.totalDuration / 1000)).toFixed(1)}`);
    
    // Accuracy
    console.log(`\n🎯 ACCURACY:`);
    console.log(`   Job Titles: ${this.results.accuracy.jobTitles.found}/${this.results.accuracy.jobTitles.total} (${((this.results.accuracy.jobTitles.found / this.results.accuracy.jobTitles.total) * 100).toFixed(1)}%)`);
    console.log(`   Companies: ${this.results.accuracy.companies.found}/${this.results.accuracy.companies.total} (${((this.results.accuracy.companies.found / this.results.accuracy.companies.total) * 100).toFixed(1)}%)`);
    console.log(`   Locations: ${this.results.accuracy.locations.found}/${this.results.accuracy.locations.total} (${((this.results.accuracy.locations.found / this.results.accuracy.locations.total) * 100).toFixed(1)}%)`);
    console.log(`   Posted Times: ${this.results.accuracy.postedTimes.found}/${this.results.accuracy.postedTimes.total} (${((this.results.accuracy.postedTimes.found / this.results.accuracy.postedTimes.total) * 100).toFixed(1)}%)`);
    
    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    if (this.results.successfulUrls / this.results.totalUrls < 0.9) {
      console.log(`   ⚠️ URL success rate below 90% - consider increasing timeout or reducing concurrent browsers`);
    }
    if (this.results.accuracy.postedTimes.found / this.results.accuracy.postedTimes.total < 0.8) {
      console.log(`   ⚠️ Posted time extraction below 80% - consider improving extraction logic`);
    }
    if (this.results.timing.averagePerUrl > 10000) {
      console.log(`   ⚠️ Average URL processing time > 10s - consider optimizing page loading`);
    }
    
    console.log(`\n✅ LIGHT MODE TEST COMPLETED`);
  }

  async run() {
    try {
      await this.initialize();
      const results = await this.testParallelProcessing();
      await this.analyzeResults(results);
      this.printSummary();
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the test
const test = new LightModeSystematicTest();
test.run(); 
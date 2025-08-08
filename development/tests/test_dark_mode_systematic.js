const puppeteer = require('puppeteer');

class DarkModeSystematicTest {
  constructor() {
    this.results = {
      totalJobs: 0,
      successfulJobs: 0,
      failedJobs: 0,
      featuredJobs: 0,
      regularJobs: 0,
      timing: {
        startTime: null,
        endTime: null,
        totalDuration: 0,
        averagePerJob: 0
      },
      accuracy: {
        jobTitles: { found: 0, total: 0 },
        companies: { found: 0, total: 0 },
        locations: { found: 0, total: 0 },
        postedTimes: { found: 0, total: 0 }
      },
      errors: []
    };
    
    this.testUrl = 'https://www.seek.com.au/manager-jobs/in-Dandenong-VIC-3175?daterange=7&distance=25&sortmode=ListedDate';
  }

  async initialize() {
    console.log('🌙 DARK MODE SYSTEMATIC TEST STARTING');
    console.log('=' .repeat(60));
    
    this.results.timing.startTime = Date.now();
    
    console.log(`🎯 Testing SEEK search results: ${this.testUrl}`);
    console.log(`🔍 Will visit individual job pages for featured jobs`);
  }

  async testDarkModeSearch() {
    console.log('\n🚀 TESTING DARK MODE SEARCH');
    console.log('-'.repeat(40));
    
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
    
    try {
      const page = await browser.newPage();
      
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
      
      console.log('📄 Navigating to SEEK search results...');
      await page.goto(this.testUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Extract job data from search results
      const jobData = await page.evaluate(() => {
        const jobs = [];
        const jobCards = document.querySelectorAll('[data-testid="job-card"], .job-card, ._job-card, [data-automation="normalJob"]');
        
        jobCards.forEach((card, index) => {
          if (index >= 20) return; // Limit to first 20 jobs
          
          try {
            // Job Title
            const titleElement = card.querySelector('[data-testid="job-title"], .job-title, h3, h2, [data-automation="jobTitle"]');
            const title = titleElement ? titleElement.textContent.trim() : '';
            
            // Company
            const companyElement = card.querySelector('[data-testid="company-name"], .company-name, .employer, [data-automation="jobCompany"]');
            const company = companyElement ? companyElement.textContent.trim() : '';
            
            // Location
            const locationElement = card.querySelector('[data-testid="location"], .location, .job-location, [data-automation="jobLocation"]');
            let location = locationElement ? locationElement.textContent.trim() : '';
            // Format location (text before comma)
            if (location.includes(',')) {
              location = location.split(',')[0].trim();
            }
            
            // Posted Time
            const timeElement = card.querySelector('[data-testid="posted-time"], .posted-time, .job-posted-time, time, [data-automation="jobListingDate"]');
            let postedTime = timeElement ? timeElement.textContent.trim() : '';
            
            // Check if it's a featured job (no posted time in card)
            const isFeatured = !postedTime || postedTime === '' || card.querySelector('.featured-job, [data-automation="featuredJob"]');
            
            // Job URL for individual page visit
            const jobLink = card.querySelector('a[href*="/job/"]');
            const jobUrl = jobLink ? jobLink.href : '';
            
            if (title || company || location) {
              jobs.push({
                title,
                company,
                location,
                postedTime,
                jobUrl,
                isFeatured,
                needsIndividualVisit: isFeatured || !postedTime
              });
            }
            
          } catch (error) {
            console.error('Error processing job card:', error);
          }
        });
        
        return jobs;
      });
      
      console.log(`📊 Found ${jobData.length} jobs on search results page`);
      
      // Process jobs with individual visits for featured jobs
      const processedJobs = [];
      for (let i = 0; i < jobData.length; i++) {
        const job = jobData[i];
        console.log(`\n🔍 Processing job ${i + 1}/${jobData.length}: ${job.title}`);
        
        if (job.needsIndividualVisit && job.jobUrl) {
          console.log(`  📄 Visiting individual job page for featured job...`);
          const individualJobData = await this.visitIndividualJobPage(browser, job.jobUrl);
          if (individualJobData) {
            job.postedTime = individualJobData.postedTime;
            job.isFeatured = true;
            this.results.featuredJobs++;
          }
        } else {
          this.results.regularJobs++;
        }
        
        // Format posted time
        if (job.postedTime) {
          job.postedTime = this.formatPostedTime(job.postedTime);
        }
        
        processedJobs.push(job);
        
        // Add delay between job processing
        if (i < jobData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      await browser.close();
      return processedJobs;
      
    } catch (error) {
      console.error('❌ Dark mode test error:', error.message);
      await browser.close();
      throw error;
    }
  }

  async visitIndividualJobPage(browser, jobUrl) {
    const page = await browser.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      await page.goto(jobUrl, { 
        waitUntil: 'networkidle2',
        timeout: 15000 
      });
      
      const jobData = await page.evaluate(() => {
        // Look for posted time in individual job page
        const timeSelectors = [
          '[data-automation="jobListingDate"]',
          '.job-listing-date',
          '.posted-date',
          'time',
          '[data-testid="posted-time"]'
        ];
        
        let postedTime = '';
        for (const selector of timeSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            postedTime = element.textContent.trim();
            break;
          }
        }
        
        return { postedTime };
      });
      
      await page.close();
      return jobData;
      
    } catch (error) {
      console.log(`  ⚠️ Failed to visit individual job page: ${error.message}`);
      await page.close();
      return null;
    }
  }

  formatPostedTime(text) {
    if (!text) return '';
    
    // Filter out "ms" values
    if (text.includes('ms')) {
      return '';
    }
    
    // Handle "3m ago" format (minutes)
    if (text.includes('m ago')) {
      const match = text.match(/(\d+)m\s*ago/);
      if (match) {
        const num = parseInt(match[1]);
        return `${num} minute${num === 1 ? '' : 's'}`;
      }
    }
    
    // Handle "2h ago" format (hours)
    if (text.includes('h ago')) {
      const match = text.match(/(\d+)h\s*ago/);
      if (match) {
        const num = parseInt(match[1]);
        return `${num} hour${num === 1 ? '' : 's'}`;
      }
    }
    
    // Handle "1d ago" format (days)
    if (text.includes('d ago')) {
      const match = text.match(/(\d+)d\s*ago/);
      if (match) {
        const num = parseInt(match[1]);
        return `${num} day${num === 1 ? '' : 's'}`;
      }
    }
    
    return text;
  }

  async analyzeResults(jobs) {
    console.log('\n📊 ANALYZING RESULTS');
    console.log('-'.repeat(40));
    
    this.results.totalJobs = jobs.length;
    
    jobs.forEach((job, index) => {
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
        this.results.successfulJobs++;
      } else {
        this.results.failedJobs++;
        jobSuccess = false;
      }
      
      const status = jobSuccess ? '✅' : '❌';
      const featured = job.isFeatured ? ' [FEATURED]' : '';
      console.log(`${status} Job ${index + 1}: ${job.title}${featured}`);
      if (job.postedTime) {
        console.log(`   Posted: ${job.postedTime}`);
      }
    });
    
    // Calculate timing
    this.results.timing.endTime = Date.now();
    this.results.timing.totalDuration = this.results.timing.endTime - this.results.timing.startTime;
    this.results.timing.averagePerJob = this.results.timing.totalDuration / this.results.totalJobs;
  }

  printSummary() {
    console.log('\n📈 FINAL SUMMARY');
    console.log('='.repeat(60));
    
    // Job Processing
    console.log(`💼 JOB PROCESSING:`);
    console.log(`   Total Jobs: ${this.results.totalJobs}`);
    console.log(`   Successful: ${this.results.successfulJobs} (${((this.results.successfulJobs / this.results.totalJobs) * 100).toFixed(1)}%)`);
    console.log(`   Failed: ${this.results.failedJobs} (${((this.results.failedJobs / this.results.totalJobs) * 100).toFixed(1)}%)`);
    console.log(`   Featured Jobs: ${this.results.featuredJobs}`);
    console.log(`   Regular Jobs: ${this.results.regularJobs}`);
    
    // Timing
    console.log(`\n⏱️ TIMING:`);
    console.log(`   Total Duration: ${this.results.timing.totalDuration}ms (${(this.results.timing.totalDuration / 1000).toFixed(1)}s)`);
    console.log(`   Average per Job: ${this.results.timing.averagePerJob.toFixed(0)}ms`);
    console.log(`   Jobs per second: ${(this.results.totalJobs / (this.results.timing.totalDuration / 1000)).toFixed(1)}`);
    
    // Accuracy
    console.log(`\n🎯 ACCURACY:`);
    console.log(`   Job Titles: ${this.results.accuracy.jobTitles.found}/${this.results.accuracy.jobTitles.total} (${((this.results.accuracy.jobTitles.found / this.results.accuracy.jobTitles.total) * 100).toFixed(1)}%)`);
    console.log(`   Companies: ${this.results.accuracy.companies.found}/${this.results.accuracy.companies.total} (${((this.results.accuracy.companies.found / this.results.accuracy.companies.total) * 100).toFixed(1)}%)`);
    console.log(`   Locations: ${this.results.accuracy.locations.found}/${this.results.accuracy.locations.total} (${((this.results.accuracy.locations.found / this.results.accuracy.locations.total) * 100).toFixed(1)}%)`);
    console.log(`   Posted Times: ${this.results.accuracy.postedTimes.found}/${this.results.accuracy.postedTimes.total} (${((this.results.accuracy.postedTimes.found / this.results.accuracy.postedTimes.total) * 100).toFixed(1)}%)`);
    
    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    if (this.results.successfulJobs / this.results.totalJobs < 0.9) {
      console.log(`   ⚠️ Job success rate below 90% - consider improving extraction selectors`);
    }
    if (this.results.accuracy.postedTimes.found / this.results.accuracy.postedTimes.total < 0.8) {
      console.log(`   ⚠️ Posted time extraction below 80% - consider improving individual page visits`);
    }
    if (this.results.timing.averagePerJob > 5000) {
      console.log(`   ⚠️ Average job processing time > 5s - consider optimizing individual page visits`);
    }
    if (this.results.featuredJobs > 0) {
      console.log(`   ✅ Featured jobs detected and processed with individual page visits`);
    }
    
    console.log(`\n✅ DARK MODE TEST COMPLETED`);
  }

  async run() {
    try {
      await this.initialize();
      const jobs = await this.testDarkModeSearch();
      await this.analyzeResults(jobs);
      this.printSummary();
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the test
const test = new DarkModeSystematicTest();
test.run(); 
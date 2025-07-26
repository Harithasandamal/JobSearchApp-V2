const fs = require('fs');
const path = require('path');
const { table } = require('table');

const ConfigManager = require('./ConfigManager');
const UrlBuilder = require('./UrlBuilder');
const BrowserManager = require('./BrowserManager');
const JobParser = require('./JobParser');

class SeekScraper {
  constructor() {
    this.browserManager = new BrowserManager();
  }
  
  async run(configPath) {
    const totalStart = Date.now();
    console.log('[DEBUG] SeekScraper started');
    
    try {
      // Load configuration
      console.log('Progress: 5%'); // Browser initialization
      const config = await ConfigManager.loadConfig(configPath);
      
      // Launch browser and create page
      console.log('Progress: 15%'); // Launching browser
      await this.browserManager.launchBrowser();
      const page = await this.browserManager.createPage();
      
      // Build URL and navigate
      console.log('Progress: 25%'); // Navigating to SEEK
      const url = UrlBuilder.buildSeekUrl(config.keyword, config.location, config.distance, config.postedAgo);
      console.log(`[DEBUG] Built URL: ${url}`);
      
      await this.browserManager.navigateToPage(page, url);
      console.log('Progress: 40%'); // Page loaded
      
      // Extract job data
      console.log('Progress: 60%'); // Starting job extraction
      const extractStart = Date.now();
      const jobs = await JobParser.extractJobData(page, config);
      const extractEnd = Date.now();
      console.log(`[TIMING] Job extraction in ${extractEnd - extractStart} ms`);
      console.log('Progress: 80%'); // Job extraction completed
      
      // Display results in table format
      this.displayResults(jobs);
      console.log('Progress: 90%'); // Processing results
      
      // Write results to file
      this.writeResults(configPath, jobs);
      console.log('Progress: 100%'); // Process completed
      console.log(`Found ${jobs.length} jobs`); // Trigger completion
      
      await this.browserManager.closeBrowser();
      
      const totalEnd = Date.now();
      console.log(`[TIMING] SeekScraper total time: ${totalEnd - totalStart} ms`);
      
      return jobs;
    } catch (error) {
      console.error('❌ SeekScraper error:', error);
      console.log('Progress: 100%'); // Mark as completed even on error
      throw error;
    }
  }
  
  displayResults(jobs) {
    if (jobs.length === 0) {
      console.log('No jobs found matching your criteria.');
      return;
    }
    
    console.log(`\n📋 Found ${jobs.length} jobs:`);
    
    // Create table data
    const tableData = [
      ['#', 'Job Title', 'Company', 'Location', 'Posted']
    ];
    
    jobs.forEach((job, index) => {
      tableData.push([
        index + 1,
        job.title.substring(0, 40) + (job.title.length > 40 ? '...' : ''),
        job.company.substring(0, 25) + (job.company.length > 25 ? '...' : ''),
        job.location.substring(0, 20) + (job.location.length > 20 ? '...' : ''),
        job.postedAgo
      ]);
    });
    
    // Display table
    console.log(table(tableData));
  }
  
  writeResults(configPath, jobs) {
    const resultsWriteStart = Date.now();
    const resultsPath = path.join(__dirname, '../', `${path.basename(configPath, '.json')}_results.json`);
    fs.writeFileSync(resultsPath, JSON.stringify({ jobs }, null, 2));
    const resultsWriteEnd = Date.now();
    console.log(`[TIMING] Results file written in ${resultsWriteEnd - resultsWriteStart} ms`);
    console.log(`[DEBUG] Wrote results file: ${resultsPath}`);
  }
}

module.exports = SeekScraper; 
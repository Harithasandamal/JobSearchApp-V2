/**
 * Get test jobs for light mode testing - SCRAPE REAL JOB DETAILS ONLY
 * Light mode: Visit 3 sample job URLs to collect actual job details - NO FALLBACK DATA
 */
const { scrapeJobDetails, scrapeAllJobsUnified } = require('./jobScrapingUtils');
const { SAMPLE_URLS } = require('../../constants/sampleUrls');

const workflowLogger = require('../../utils/WorkflowLogger');

/**
 * Get test jobs with real scraping - LIGHT MODE
 */
const getTestJobs = async (req, res) => {
  try {
    workflowLogger.log('🌞 LIGHT MODE test jobs request received', 'system');
    workflowLogger.startProcess('LIGHT MODE Job Scraping', 'Unified parallel scraping');
    
    // Use centralized sample URLs from constants
    const sampleUrls = [...SAMPLE_URLS]; // Create copy to avoid modification
    
    let jobs = [];
    
    workflowLogger.startProcess('Unified Parallel Scraping', `${sampleUrls.length} URLs - accurate data only`);
      
    try {
      const startTime = Date.now();
      
      console.log(`🚀 LIGHT MODE - Using unified parallel scraping for ${sampleUrls.length} sample URLs...`);
      
      // Use the same unified parallel scraping engine as dark mode
      const scrapedJobs = await scrapeAllJobsUnified(sampleUrls);
      
      // Format jobs consistently with dark mode approach
      const validJobs = scrapedJobs.map((job, index) => ({
        id: `light-job-${index + 1}`,
        title: job.title,
        company: job.company || 'Company not specified',
        location: job.location || 'Location not specified', 
        postedAgo: job.postedAgo || 'Time not specified',
        url: job.url
      }));
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);
      
      console.log(`✅ LIGHT MODE - Unified parallel scraping completed in ${duration} seconds`);
      console.log(`📊 Result: ${validJobs.length}/${sampleUrls.length} jobs scraped (ACCURATE DATA ONLY)`);
      
      if (validJobs.length === 0) {
        console.log(`❌ LIGHT MODE - No jobs scraped successfully - failing cleanly (NO FALLBACKS)`);
        workflowLogger.endProcess('Unified Parallel Scraping', 'failed', 'No jobs scraped - accurate data only');
        throw new Error('No sample jobs scraped successfully - accurate data only');
      }
      
      workflowLogger.endProcess('Unified Parallel Scraping', 'completed', `${validJobs.length} accurate jobs scraped`);
    } catch (error) {
      console.error('❌ LIGHT MODE - Unified scraping failed:', error);
      workflowLogger.endProcess('Unified Parallel Scraping', 'failed', error.message);
      
      return res.status(500).json({
        success: false,
        jobs: [],
        totalJobs: 0,
        message: `❌ Light mode scraping failed: ${error.message}`,
        searchCompleted: false
      });
    }
    
    // Add jobs to final result
    jobs.push(...validJobs);
    
    return res.json({
      success: true,
      jobs: jobs, // Return ALL scraped jobs, no filtering
      totalJobs: jobs.length,
      message: `✅ Light mode: ${jobs.length} accurate test jobs available for selection`,
      searchCompleted: true
    });

};

/**
 * Test manual job URL scraping - for testing current/fresh jobs
 */
const testManualJobScraping = async (req, res) => {
  try {
    // Default to a recent job URL if none provided
    const testUrl = req.body.url || req.query.url || 'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=f5c442d9c765b69183c0a9f36e76c3773779cff4';
    
    // Testing scraper with manual URL
    
    const jobDetails = await Promise.race([
      scrapeJobDetails(testUrl),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Manual test timeout after 30 seconds')), 30000)
      )
    ]);
    
    // Manual test successful
    
    res.json({
      success: true,
      jobDetails: {
        title: jobDetails.title || 'Not specified',
        company: jobDetails.company || 'Not specified',
        location: jobDetails.location || 'Not specified', 
        postedAgo: jobDetails.postedAgo || 'Not specified',
        url: testUrl
      },
      message: 'Manual job scraping test completed successfully'
    });
    
  } catch (error) {
    console.error('❌ MANUAL TEST - Failed:', error.message);
    
    res.json({
      success: false,
      error: error.message,
      message: 'Manual job scraping test failed - NO FALLBACK DATA',
      url: req.body.url || req.query.url || 'default test URL'
    });
  }
};

// Mock scored jobs moved to mockScoringController.js

// Mock analysis moved to mockAnalysisController.js

module.exports = {
  getTestJobs,
  testManualJobScraping
}; 
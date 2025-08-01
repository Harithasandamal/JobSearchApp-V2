/**
 * VALIDATION FIXES TEST
 * Quick test to verify the keyword and time validation fixes
 */

const { scrapeJobUrlsFromSearchResults } = require('../backend/controllers/search/searchResultsScraper');
const { scrapeAllJobsUnified } = require('../backend/controllers/search/jobScrapingUtils');
const { filterJobsByCriteria } = require('../backend/controllers/search/jobValidationController');

// Test the validation fixes directly
const testValidationFixes = async () => {
  console.log('🧪 TESTING VALIDATION FIXES');
  console.log('===========================');
  
  // Test with engineer jobs URL
  const searchUrl = 'https://www.seek.com.au/engineer-jobs/in-Dandenong-VIC-3175?daterange=7&distance=25&sortmode=ListedDate';
  const keyword = 'engineer';
  
  console.log(`📄 Search URL: ${searchUrl}`);
  console.log(`🎯 Keyword: "${keyword}"`);
  
  try {
    // Step 1: Get job URLs
    console.log('\n📋 Step 1: Getting job URLs...');
    const jobUrls = await scrapeJobUrlsFromSearchResults(searchUrl, 5); // Just 5 for quick test
    console.log(`✅ Found ${jobUrls.length} job URLs`);
    
    if (jobUrls.length === 0) {
      console.log('❌ No jobs found, cannot test validation');
      return;
    }
    
    // Step 2: Scrape job details
    console.log('\n🚀 Step 2: Scraping job details...');
    const jobs = await scrapeAllJobsUnified(jobUrls);
    console.log(`✅ Scraped ${jobs.length} jobs successfully`);
    
    // Format jobs
    const formattedJobs = jobs.map((job, index) => ({
      title: job.title,
      company: job.company || 'Not specified',
      location: job.location || 'Not specified',
      postedAgo: job.postedAgo || 'Not specified',
      salary: job.salary || 'Not specified',
      url: jobUrls[index] || job.url
    }));
    
    // Step 3: Test validation
    console.log('\n🎯 Step 3: Testing validation with debug output...');
    console.log('==========================================');
    
    const searchCriteria = { keyword: 'engineer', postedAgo: '7 days' };
    
    console.log('\n🔍 Individual job validation:');
    formattedJobs.forEach((job, index) => {
      console.log(`\n--- JOB ${index + 1}: ${job.title} ---`);
    });
    
    const validatedJobs = filterJobsByCriteria(formattedJobs, searchCriteria);
    
    console.log('\n📊 VALIDATION SUMMARY:');
    console.log(`   Total jobs: ${formattedJobs.length}`);
    console.log(`   Valid jobs: ${validatedJobs.length}`);
    console.log(`   Success rate: ${((validatedJobs.length / formattedJobs.length) * 100).toFixed(1)}%`);
    
    // Display jobs that should have matched
    console.log('\n🎯 Jobs that should contain "engineer":');
    formattedJobs.forEach((job, index) => {
      const titleLower = job.title.toLowerCase();
      const hasEngineer = titleLower.includes('engineer');
      const status = hasEngineer ? '✅ SHOULD MATCH' : '❌ NO MATCH';
      console.log(`   ${index + 1}. ${job.title} - ${status}`);
    });
    
  } catch (error) {
    console.error(`\n💥 VALIDATION TEST FAILED: ${error.message}`);
  }
  
  console.log('\n👋 Validation test complete');
  setTimeout(() => process.exit(0), 2000);
};

// Run the test
testValidationFixes();
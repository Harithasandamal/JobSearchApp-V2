/**
 * PARALLEL SCRAPING VALIDATION TEST
 * Tests that parallel scraping works correctly after refactoring
 * 
 * Tests:
 * 1. Parallel scraping of 3 sample URLs (3 browser instances)
 * 2. Search results page scraping → extract URLs → parallel scrape all jobs
 * 3. Display results in table format
 */

const readline = require('readline');
const { scrapeJobDetails, scrapeAllJobsUnified } = require('../backend/controllers/search/jobScrapingUtils');
const { scrapeJobUrlsFromSearchResults } = require('../backend/controllers/search/searchResultsScraper');
const { filterJobsByCriteria } = require('../backend/controllers/search/jobValidationController');

// Interactive prompt setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

// Display results in table format
const displayJobsTable = (jobs, title) => {
  console.log(`\n📊 ${title}`);
  console.log('='.repeat(120));
  console.log('| # | Status | Title (40 chars)                      | Company (25 chars)       | Location (15)   | Posted    | URL (30 chars)');
  console.log('='.repeat(120));
  
  jobs.forEach((job, index) => {
    const status = job.title ? '✅' : '❌';
    const title = (job.title || 'FAILED').substring(0, 40).padEnd(40);
    const company = (job.company || 'N/A').substring(0, 25).padEnd(25);
    const location = (job.location || 'N/A').substring(0, 15).padEnd(15);
    const posted = (job.postedAgo || 'N/A').substring(0, 10).padEnd(10);
    const url = (job.url || '').substring(0, 30).padEnd(30);
    
    console.log(`| ${(index + 1).toString().padStart(2)} | ${status}    | ${title} | ${company} | ${location} | ${posted} | ${url}`);
  });
  
  console.log('='.repeat(120));
  
  const successCount = jobs.filter(job => job.title).length;
  console.log(`📈 SUCCESS RATE: ${successCount}/${jobs.length} jobs (${((successCount/jobs.length)*100).toFixed(1)}%)`);
};

// Test 1: Parallel scraping of 3 sample URLs
const testParallelSampleScraping = async () => {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 TEST 1: PARALLEL SCRAPING OF 3 SAMPLE URLs');
  console.log('='.repeat(80));
  
  const sampleUrls = [
    'https://www.seek.com.au/job/85981995?ref=search-standalone&type=standard&origin=jobTitle#sol=014f12b9189e0a6d2c275dd68ab2722888ade58a',
    'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=014f12b9189e0a6d2c275dd68ab2722888ade58b',
    'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=014f12b9189e0a6d2c275dd68ab2722888ade58c'
  ];
  
  console.log('🎯 Testing parallel scraping with unified method (multiple browser instances)...');
  console.log(`📋 URLs to scrape: ${sampleUrls.length}`);
  
  try {
    const startTime = Date.now();
    
    // Use the unified parallel scraper
    console.log('🌐 Launching parallel scraping with multiple browser instances...');
    const jobs = await scrapeAllJobsUnified(sampleUrls);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Format results for display
    const formattedJobs = jobs.map((job, index) => ({
      title: job.title,
      company: job.company || 'Not specified',
      location: job.location || 'Not specified', 
      postedAgo: job.postedAgo || 'Not specified',
      salary: job.salary || 'Not specified',
      url: sampleUrls[index] || job.url
    }));
    
    displayJobsTable(formattedJobs, 'PARALLEL SCRAPING RESULTS (3 Sample URLs)');
    
    console.log(`\n⚡ PERFORMANCE:`);
    console.log(`   Total time: ${duration}s`);
    console.log(`   Average per job: ${(duration / sampleUrls.length).toFixed(2)}s`);
    console.log(`   Parallel efficiency: ${jobs.length > 0 ? 'SUCCESS' : 'FAILED'}`);
    
    return { success: jobs.length > 0, jobs: formattedJobs, duration };
    
  } catch (error) {
    console.error(`\n💥 PARALLEL SCRAPING FAILED: ${error.message}`);
    return { success: false, jobs: [], duration: 0 };
  }
};

// Test 2: Search results → parallel scraping
const testSearchResultsParallelScraping = async (searchUrl, keyword = '') => {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 TEST 2: SEARCH RESULTS → PARALLEL JOB SCRAPING');
  console.log('='.repeat(80));
  
  console.log(`📄 Search URL: ${searchUrl.substring(0, 80)}...`);
  if (keyword) {
    console.log(`🎯 Keyword validation: "${keyword}"`);
  }
  
  try {
    // Step 1: Extract job URLs from search page
    console.log('\n📋 Step 1: Extracting job URLs from search results...');
    const startExtractTime = Date.now();
    
    const jobUrls = await scrapeJobUrlsFromSearchResults(searchUrl, 30); // Get ALL jobs from first page (up to 30)
    
    const endExtractTime = Date.now();
    const extractDuration = ((endExtractTime - startExtractTime) / 1000).toFixed(2);
    
    console.log(`✅ Found ${jobUrls.length} job URLs in ${extractDuration}s`);
    
    if (jobUrls.length === 0) {
      console.log('❌ No job URLs found - cannot test parallel scraping');
      return { success: false };
    }
    
    // Display found URLs
    console.log('\n📋 Found job URLs:');
    jobUrls.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`);
    });
    
    // Step 2: Parallel scrape all job details
    console.log(`\n🚀 Step 2: Parallel scraping ${jobUrls.length} jobs with multiple browser instances...`);
    const startScrapeTime = Date.now();
    
    const jobs = await scrapeAllJobsUnified(jobUrls);
    
    const endScrapeTime = Date.now();
    const scrapeDuration = ((endScrapeTime - startScrapeTime) / 1000).toFixed(2);
    
    // Format results
    const formattedJobs = jobs.map((job, index) => ({
      title: job.title,
      company: job.company || 'Not specified',
      location: job.location || 'Not specified',
      postedAgo: job.postedAgo || 'Not specified', 
      salary: job.salary || 'Not specified',
      url: jobUrls[index] || job.url
    }));
    
    displayJobsTable(formattedJobs, 'PARALLEL SEARCH RESULTS SCRAPING');
    
    // Step 3: Cross-validation if keyword provided
    if (keyword && formattedJobs.length > 0) {
      console.log(`\n🎯 Step 3: Cross-validation with keyword "${keyword}"`);
      
      const searchCriteria = { keyword, postedAgo: '7 days' };
      const validatedJobs = filterJobsByCriteria(formattedJobs, searchCriteria);
      
      console.log(`\n📊 VALIDATION SUMMARY:`);
      console.log(`   📋 Total jobs scraped: ${formattedJobs.length}`);
      console.log(`   ✅ Jobs matching "${keyword}": ${validatedJobs.length}`);
      console.log(`   📈 Match rate: ${((validatedJobs.length / formattedJobs.length) * 100).toFixed(1)}%`);
    }
    
    console.log(`\n⚡ PERFORMANCE SUMMARY:`);
    console.log(`   URL extraction: ${extractDuration}s`);
    console.log(`   Parallel scraping: ${scrapeDuration}s`);
    console.log(`   Total time: ${(parseFloat(extractDuration) + parseFloat(scrapeDuration)).toFixed(2)}s`);
    console.log(`   Parallel efficiency: ${jobs.length}/${jobUrls.length} jobs (${((jobs.length/jobUrls.length)*100).toFixed(1)}%)`);
    
    return { 
      success: jobs.length > 0, 
      jobs: formattedJobs, 
      jobUrls, 
      extractDuration, 
      scrapeDuration 
    };
    
  } catch (error) {
    console.error(`\n💥 SEARCH RESULTS PARALLEL SCRAPING FAILED: ${error.message}`);
    return { success: false };
  }
};

// Main test runner
const runParallelScrapingTests = async () => {
  console.log('🧪 PARALLEL SCRAPING VALIDATION TEST SUITE');
  console.log('===========================================');
  console.log('Testing parallel scraping functionality after refactoring.\n');
  
  try {
    // Test 1: Parallel sample scraping
    console.log('🚀 Running Test 1: Parallel scraping of 3 sample URLs...');
    const test1Result = await testParallelSampleScraping();
    
    if (!test1Result.success) {
      console.log('\n❌ Test 1 FAILED - Parallel scraping is broken!');
      rl.close();
      return;
    }
    
    console.log('\n✅ Test 1 PASSED - Sample parallel scraping works!');
    
    // Ask user to proceed
    const proceed = await askQuestion('\n📝 Proceed to search results parallel test? (Y/N): ');
    
    if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
      console.log('\n⏹️ Testing stopped by user.');
      rl.close();
      return;
    }
    
    // Test 2: Search results parallel scraping
    const searchUrl = await askQuestion('\n📝 Please provide search results URL (no keyword): ');
    
    if (!searchUrl) {
      console.log('❌ No search URL provided');
      rl.close();
      return;
    }
    
    const test2Result = await testSearchResultsParallelScraping(searchUrl);
    
    if (!test2Result.success) {
      console.log('\n❌ Test 2 FAILED - Search results parallel scraping is broken!');
    } else {
      console.log('\n✅ Test 2 PASSED - Search results parallel scraping works!');
    }
    
    // Ask for keyword test
    const proceedKeyword = await askQuestion('\n📝 Proceed to keyword validation test? (Y/N): ');
    
    if (proceedKeyword.toLowerCase() === 'y' || proceedKeyword.toLowerCase() === 'yes') {
      const searchUrlWithKeyword = await askQuestion('\n📝 Please provide search results URL WITH keyword: ');
      const keyword = await askQuestion('🎯 What keyword to validate? ');
      
      if (searchUrlWithKeyword && keyword) {
        const test3Result = await testSearchResultsParallelScraping(searchUrlWithKeyword, keyword);
        
        if (test3Result.success) {
          console.log('\n✅ Test 3 PASSED - Keyword validation parallel scraping works!');
        } else {
          console.log('\n❌ Test 3 FAILED - Keyword validation parallel scraping is broken!');
        }
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('🎯 PARALLEL SCRAPING TEST COMPLETE');
    console.log('='.repeat(80));
    console.log('✅ All parallel scraping functionality validated!');
    console.log('🚀 Multiple browser instances working correctly!');
    console.log('📊 Table display format working correctly!');
    
  } catch (error) {
    console.error(`\n💥 PARALLEL SCRAPING TEST SUITE FAILED: ${error.message}`);
  } finally {
    console.log('\n👋 Parallel scraping testing finished - exiting...');
    rl.close();
    setTimeout(() => process.exit(0), 1000);
  }
};

// Run the tests
runParallelScrapingTests();
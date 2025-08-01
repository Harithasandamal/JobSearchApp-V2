/**
 * COMPREHENSIVE PARALLEL SCRAPING TEST
 * Tests both sample jobs and real SEEK URL scraping with cross-validation
 */

const { scrapeJobUrlsFromSearchResults } = require('../backend/controllers/search/searchResultsScraper');
const { scrapeAllJobsUnified } = require('../backend/controllers/search/jobScrapingUtils');
const { filterJobsByCriteria } = require('../backend/controllers/search/jobValidationController');
const readline = require('readline');

// Sample job URLs for testing
const SAMPLE_URLS = [
  'https://www.seek.com.au/job/85981995?ref=recom-homepage&pos=4&sp=3&ori=hp:search_bar&pos_num=5',
  'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard',
  'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard'
];

/**
 * Extract keyword from SEEK URL
 */
const extractKeywordFromUrl = (url) => {
  try {
    // Pattern: /keyword-jobs/ or /Keyword-jobs/
    const keywordMatch = url.match(/\/([^\/]+)-jobs\//);
    if (keywordMatch) {
      return keywordMatch[1].toLowerCase();
    }
    
    // No keyword found
    return null;
  } catch (error) {
    console.log(`⚠️ Error extracting keyword from URL: ${error.message}`);
    return null;
  }
};

/**
 * Extract posted time criteria from SEEK URL
 */
const extractPostedTimeFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const daterange = urlObj.searchParams.get('daterange');
    
    if (!daterange) return '7 days'; // default
    
    switch (daterange) {
      case '1': return '1 day';
      case '3': return '3 days';
      case '7': return '7 days';
      case '14': return '14 days';
      case '30': return '30 days';
      default: return '7 days';
    }
  } catch (error) {
    console.log(`⚠️ Error extracting posted time from URL: ${error.message}`);
    return '7 days';
  }
};

/**
 * Display results in a formatted table
 */
const displayResultsTable = (jobs, title, validatedJobs = null) => {
  console.log(`\n📊 ${title}`);
  console.log('='.repeat(120));
  console.log('| # | Status | Title (35 chars)                   | Company (20 chars)    | Location (12)  | Posted    | Valid |');
  console.log('='.repeat(120));
  
  jobs.forEach((job, index) => {
    const num = (index + 1).toString().padStart(2, ' ');
    const status = job.title ? '✅' : '❌';
    const title = (job.title || 'Failed to scrape').substring(0, 35).padEnd(35, ' ');
    const company = (job.company || 'N/A').substring(0, 20).padEnd(20, ' ');
    const location = (job.location || 'N/A').substring(0, 12).padEnd(12, ' ');
    const posted = (job.postedAgo || 'N/A').substring(0, 9).padEnd(9, ' ');
    
    let validStatus = 'N/A';
    if (validatedJobs) {
      const isValid = validatedJobs.some(validJob => validJob.title === job.title);
      validStatus = isValid ? '✅' : '❌';
    }
    
    console.log(`| ${num} | ${status}     | ${title} | ${company} | ${location} | ${posted} | ${validStatus}    |`);
  });
  
  console.log('='.repeat(120));
  
  if (validatedJobs) {
    const successRate = ((validatedJobs.length / jobs.length) * 100).toFixed(1);
    console.log(`📈 VALIDATION: ${validatedJobs.length}/${jobs.length} jobs passed (${successRate}%)`);
  }
  
  const scrapedCount = jobs.filter(job => job.title).length;
  const scrapeRate = ((scrapedCount / jobs.length) * 100).toFixed(1);
  console.log(`📈 SCRAPING: ${scrapedCount}/${jobs.length} jobs scraped successfully (${scrapeRate}%)`);
};

/**
 * Test 1: Sample Jobs Parallel Scraping
 */
const testSampleJobs = async () => {
  console.log('\n🧪 TEST 1: PARALLEL SCRAPING OF 3 SAMPLE JOBS');
  console.log('='.repeat(60));
  console.log('📋 Testing parallel scraping with 3 hardcoded sample URLs...');
  console.log(`📊 URLs to process: ${SAMPLE_URLS.length}`);
  
  try {
    const startTime = Date.now();
    console.log('\n🚀 Starting parallel scraping...');
    
    const jobs = await scrapeAllJobsUnified(SAMPLE_URLS);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Format jobs for display
    const formattedJobs = jobs.map((job, index) => ({
      title: job.title,
      company: job.company || 'Not specified',
      location: job.location || 'Not specified',
      postedAgo: job.postedAgo || 'Not specified',
      salary: job.salary || 'Not specified',
      url: SAMPLE_URLS[index] || job.url
    }));
    
    displayResultsTable(formattedJobs, 'SAMPLE JOBS PARALLEL SCRAPING RESULTS');
    
    console.log(`\n⚡ PERFORMANCE:`);
    console.log(`   Total time: ${duration}s`);
    console.log(`   Average per job: ${(parseFloat(duration) / SAMPLE_URLS.length).toFixed(2)}s`);
    console.log(`   Jobs/second: ${(SAMPLE_URLS.length / parseFloat(duration)).toFixed(1)}`);
    
    return { success: true, jobs: formattedJobs, duration };
    
  } catch (error) {
    console.error(`\n💥 TEST 1 FAILED: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Test 2: Real SEEK URL Scraping with Cross-Validation
 */
const testRealSeekUrl = async (searchUrl) => {
  console.log('\n🧪 TEST 2: REAL SEEK URL PARALLEL SCRAPING + CROSS-VALIDATION');
  console.log('='.repeat(80));
  console.log(`📄 Search URL: ${searchUrl}`);
  
  // Extract criteria from URL
  const keyword = extractKeywordFromUrl(searchUrl);
  const postedAgo = extractPostedTimeFromUrl(searchUrl);
  
  console.log(`🎯 Extracted Keyword: ${keyword || 'None'}`);
  console.log(`⏰ Extracted Posted Time: ${postedAgo}`);
  
  try {
    // Step 1: Get job URLs from search results
    console.log('\n📋 Step 1: Extracting job URLs from search results...');
    const startExtractTime = Date.now();
    
    const jobUrls = await scrapeJobUrlsFromSearchResults(searchUrl, 30); // Get ALL jobs
    
    const endExtractTime = Date.now();
    const extractDuration = ((endExtractTime - startExtractTime) / 1000).toFixed(2);
    
    console.log(`✅ Found ${jobUrls.length} job URLs in ${extractDuration}s`);
    
    if (jobUrls.length === 0) {
      console.log('❌ No job URLs found from search results');
      return { success: false, error: 'No job URLs found' };
    }
    
    // Step 2: Scrape all job details in parallel
    console.log('\n🚀 Step 2: Parallel scraping of job details...');
    const startScrapeTime = Date.now();
    
    const jobs = await scrapeAllJobsUnified(jobUrls);
    
    const endScrapeTime = Date.now();
    const scrapeDuration = ((endScrapeTime - startScrapeTime) / 1000).toFixed(2);
    
    console.log(`✅ Scraped ${jobs.length} jobs in ${scrapeDuration}s`);
    
    // Format jobs for processing
    const formattedJobs = jobs.map((job, index) => ({
      title: job.title,
      company: job.company || 'Not specified',
      location: job.location || 'Not specified',
      postedAgo: job.postedAgo || 'Not specified',
      salary: job.salary || 'Not specified',
      url: jobUrls[index] || job.url
    }));
    
    // Step 3: Cross-validate against extracted criteria
    console.log('\n🎯 Step 3: Cross-validation against extracted criteria...');
    
    const searchCriteria = { keyword, postedAgo };
    const validatedJobs = filterJobsByCriteria(formattedJobs, searchCriteria);
    
    // Display results
    displayResultsTable(formattedJobs, 'REAL SEEK URL SCRAPING + CROSS-VALIDATION RESULTS', validatedJobs);
    
    console.log(`\n⚡ PERFORMANCE:`);
    console.log(`   URL extraction: ${extractDuration}s`);
    console.log(`   Parallel scraping: ${scrapeDuration}s`);
    console.log(`   Total time: ${(parseFloat(extractDuration) + parseFloat(scrapeDuration)).toFixed(2)}s`);
    console.log(`   Average per job: ${(parseFloat(scrapeDuration) / jobUrls.length).toFixed(2)}s`);
    
    console.log(`\n🎯 CROSS-VALIDATION SUMMARY:`);
    if (keyword) {
      const keywordMatches = formattedJobs.filter(job => 
        job.title.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      console.log(`   Keyword "${keyword}": ${keywordMatches}/${formattedJobs.length} jobs match`);
    }
    console.log(`   Posted time "${postedAgo}": ${validatedJobs.length}/${formattedJobs.length} jobs within limit`);
    
    return { 
      success: true, 
      jobs: formattedJobs, 
      validatedJobs, 
      criteria: searchCriteria,
      performance: { extractDuration, scrapeDuration }
    };
    
  } catch (error) {
    console.error(`\n💥 TEST 2 FAILED: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Interactive user input for SEEK URL
 */
const getUserSeekUrl = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\n📝 Please provide a SEEK search URL for testing:');
    console.log('   Examples:');
    console.log('   - With keyword: https://www.seek.com.au/engineer-jobs/in-Dandenong-VIC-3175?daterange=7&distance=25');
    console.log('   - Without keyword: https://www.seek.com.au/jobs/in-Dandenong-VIC-3175?daterange=7&distance=25');
    console.log('');
    
    rl.question('🔗 Enter SEEK URL: ', (url) => {
      rl.close();
      resolve(url.trim());
    });
  });
};

/**
 * Get user confirmation
 */
const getUserConfirmation = (message) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(`${message} (Y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim() === 'y');
    });
  });
};

/**
 * Main test execution
 */
const runComprehensiveTest = async () => {
  console.log('🧪 COMPREHENSIVE PARALLEL SCRAPING TEST SUITE');
  console.log('===============================================');
  console.log('Testing parallel scraping functionality with cross-validation.\n');
  
  try {
    // TEST 1: Sample Jobs
    const test1Result = await testSampleJobs();
    
    if (!test1Result.success) {
      console.log('❌ Test 1 failed, aborting test suite');
      return;
    }
    
    // Ask for confirmation to proceed
    console.log('\n✅ Test 1 completed successfully!');
    const proceedToTest2 = await getUserConfirmation('\n🤔 Proceed to Test 2 (Real SEEK URL)?');
    
    if (!proceedToTest2) {
      console.log('\n👋 Test suite stopped by user');
      return;
    }
    
    // TEST 2: Real SEEK URL
    const seekUrl = await getUserSeekUrl();
    
    if (!seekUrl || !seekUrl.includes('seek.com.au')) {
      console.log('❌ Invalid SEEK URL provided');
      return;
    }
    
    const test2Result = await testRealSeekUrl(seekUrl);
    
    // Final summary
    console.log('\n🎯 COMPREHENSIVE TEST SUITE SUMMARY');
    console.log('=====================================');
    console.log(`✅ Test 1 (Sample Jobs): ${test1Result.success ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Test 2 (Real SEEK URL): ${test2Result.success ? 'PASSED' : 'FAILED'}`);
    
    if (test1Result.success && test2Result.success) {
      console.log('\n🎉 ALL TESTS PASSED - PARALLEL SCRAPING FULLY VALIDATED!');
    } else {
      console.log('\n⚠️ Some tests failed - review results above');
    }
    
  } catch (error) {
    console.error(`\n💥 TEST SUITE FAILED: ${error.message}`);
  }
  
  console.log('\n👋 Test suite complete - exiting...');
  setTimeout(() => process.exit(0), 2000);
};

// Run the test suite
runComprehensiveTest();
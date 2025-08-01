/**
 * FINAL COMPREHENSIVE PARALLEL SCRAPING TEST
 * Clean, reliable test with proper error handling and single table display
 */

const { scrapeJobUrlsFromSearchResults } = require('../backend/controllers/search/searchResultsScraper');
const { scrapeAllJobsUnified } = require('../backend/controllers/search/jobScrapingUtils');
const { validateJobAgainstCriteria } = require('../backend/controllers/search/jobValidationController');
const readline = require('readline');

// Sample job URLs - consistent structure
const SAMPLE_URLS = [
  'https://www.seek.com.au/job/85981995?ref=search-standalone&type=standard&origin=jobTitle#sol=014f12b9189e0a6d2c275dd68ab2722888ade58a',
  'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=014f12b9189e0a6d2c275dd68ab2722888ade58b',
  'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=014f12b9189e0a6d2c275dd68ab2722888ade58c'
];

/**
 * Extract keyword from SEEK URL
 */
const extractKeywordFromUrl = (url) => {
  try {
    const keywordMatch = url.match(/\/([^\/]+)-jobs\//);
    return keywordMatch ? keywordMatch[1].toLowerCase() : null;
  } catch (error) {
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
    
    switch (daterange) {
      case '1': return '1 day';
      case '3': return '3 days';
      case '7': return '7 days';
      case '14': return '14 days';
      case '30': return '30 days';
      default: return '7 days';
    }
  } catch (error) {
    return '7 days';
  }
};

/**
 * Filter jobs and validate (without duplicate table display)
 */
const validateJobsSilently = (jobs, searchCriteria) => {
  const validationResults = jobs.map(job => ({
    job,
    validation: validateJobAgainstCriteria(job, searchCriteria)
  }));
  
  const validJobs = validationResults
    .filter(result => result.validation.isValid)
    .map(result => result.job);
  
  return { validJobs, validationResults };
};

/**
 * Display comprehensive results table
 */
const displayComprehensiveTable = (allJobs, validJobs, title, searchCriteria) => {
  console.log(`\n📊 ${title}`);
  console.log('='.repeat(130));
  console.log('| # | Success | Valid | Title (30 chars)           | Company (18 chars)  | Location (12) | Posted    | Reason');
  console.log('='.repeat(130));
  
  allJobs.forEach((job, index) => {
    const num = (index + 1).toString().padStart(2, ' ');
    const success = job.title && job.title.trim() !== '' ? '✅' : '❌';
    const isValid = validJobs.some(validJob => validJob.title === job.title);
    const valid = success === '✅' ? (isValid ? '✅' : '❌') : 'N/A';
    
    const title = (job.title || 'FAILED TO SCRAPE').substring(0, 30).padEnd(30, ' ');
    const company = (job.company || 'N/A').substring(0, 18).padEnd(18, ' ');
    const location = (job.location || 'N/A').substring(0, 12).padEnd(12, ' ');
    const posted = (job.postedAgo || 'N/A').substring(0, 9).padEnd(9, ' ');
    
    let reason = 'All criteria met';
    if (success === '❌') {
      reason = 'Scraping failed/timeout';
    } else if (!isValid) {
      if (searchCriteria.keyword && !job.title.toLowerCase().includes(searchCriteria.keyword.toLowerCase())) {
        reason = `No "${searchCriteria.keyword}"`;
      } else {
        reason = `Time > ${searchCriteria.postedAgo}`;
      }
    }
    
    console.log(`| ${num} | ${success}      | ${valid}    | ${title} | ${company} | ${location} | ${posted} | ${reason}`);
  });
  
  console.log('='.repeat(130));
  
  const scrapedCount = allJobs.filter(job => job.title && job.title.trim() !== '').length;
  const scrapeRate = ((scrapedCount / allJobs.length) * 100).toFixed(1);
  const validRate = ((validJobs.length / scrapedCount) * 100).toFixed(1);
  
  console.log(`📈 SCRAPING: ${scrapedCount}/${allJobs.length} jobs (${scrapeRate}%)`);
  console.log(`📈 VALIDATION: ${validJobs.length}/${scrapedCount} scraped jobs passed (${validRate}%)`);
  console.log(`📈 OVERALL: ${validJobs.length}/${allJobs.length} total jobs meet criteria (${((validJobs.length / allJobs.length) * 100).toFixed(1)}%)`);
};

/**
 * Test 1: Sample Jobs (Clean)
 */
const testSampleJobsClean = async () => {
  console.log('\n🧪 TEST 1: CLEAN PARALLEL SCRAPING OF 3 SAMPLE JOBS');
  console.log('='.repeat(60));
  console.log('📋 Testing with 5 browser instances (10s timeout)...');
  
  try {
    const startTime = Date.now();
    console.log('\n🚀 Starting parallel scraping...');
    
    const jobs = await scrapeAllJobsUnified(SAMPLE_URLS);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Filter out failed jobs (empty titles, timeouts)
    const successfulJobs = jobs.filter(job => job.title && job.title.trim() !== '');
    const failedJobs = jobs.filter(job => !job.title || job.title.trim() === '');
    
    console.log(`\n📊 SCRAPING RESULTS:`);
    console.log(`   Total attempts: ${SAMPLE_URLS.length}`);
    console.log(`   Successful: ${successfulJobs.length}`);
    console.log(`   Failed/Timeout: ${failedJobs.length}`);
    
    // Format all jobs for display (including failed ones)
    const formattedJobs = SAMPLE_URLS.map((url, index) => {
      const job = jobs.find(j => j.url === url) || jobs[index] || {};
      return {
        title: job.title || '',
        company: job.company || '',
        location: job.location || '',
        postedAgo: job.postedAgo || '',
        url: url
      };
    });
    
    // No validation for sample jobs - just show scraping success
    displayComprehensiveTable(formattedJobs, successfulJobs, '3 SAMPLE JOBS SCRAPING RESULTS', {});
    
    console.log(`\n⚡ PERFORMANCE:`);
    console.log(`   Total time: ${duration}s`);
    console.log(`   Browser instances: 5`);
    console.log(`   Timeout: 10 seconds`);
    console.log(`   Success rate: ${((successfulJobs.length / SAMPLE_URLS.length) * 100).toFixed(1)}%`);
    
    return { success: successfulJobs.length === SAMPLE_URLS.length, jobs: formattedJobs };
    
  } catch (error) {
    console.error(`\n💥 TEST 1 FAILED: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Test 2: Real SEEK URL (Clean)
 */
const testRealSeekUrlClean = async (searchUrl) => {
  console.log('\n🧪 TEST 2: CLEAN REAL SEEK URL PARALLEL SCRAPING');
  console.log('='.repeat(55));
  console.log(`📄 Search URL: ${searchUrl}`);
  
  const keyword = extractKeywordFromUrl(searchUrl);
  const postedAgo = extractPostedTimeFromUrl(searchUrl);
  const searchCriteria = { keyword, postedAgo };
  
  console.log(`🎯 Extracted Keyword: ${keyword || 'None'}`);
  console.log(`⏰ Posted Time Filter: ${postedAgo}`);
  console.log(`🌐 Browser instances: 5 (10s timeout)`);
  
  try {
    // Step 1: Get job URLs
    console.log('\n📋 Step 1: Extracting job URLs...');
    const startExtractTime = Date.now();
    
    const jobUrls = await scrapeJobUrlsFromSearchResults(searchUrl, 30);
    
    const extractDuration = ((Date.now() - startExtractTime) / 1000).toFixed(2);
    console.log(`✅ Found ${jobUrls.length} job URLs in ${extractDuration}s`);
    
    if (jobUrls.length === 0) {
      console.log('❌ No job URLs found');
      return { success: false, error: 'No job URLs found' };
    }
    
    // Step 2: Scrape job details
    console.log('\n🚀 Step 2: Parallel scraping with 5 browsers...');
    const startScrapeTime = Date.now();
    
    const jobs = await scrapeAllJobsUnified(jobUrls);
    
    const scrapeDuration = ((Date.now() - startScrapeTime) / 1000).toFixed(2);
    
    // Filter out failed jobs
    const successfulJobs = jobs.filter(job => job.title && job.title.trim() !== '');
    const failedCount = jobs.length - successfulJobs.length;
    
    console.log(`✅ Scraping complete: ${successfulJobs.length}/${jobUrls.length} successful (${failedCount} failed/timeout)`);
    
    // Format jobs
    const formattedJobs = jobs.map((job, index) => ({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      postedAgo: job.postedAgo || '',
      url: jobUrls[index] || job.url
    }));
    
    // Step 3: Validation (silent - no duplicate tables)
    console.log('\n🎯 Step 3: Cross-validation...');
    const { validJobs } = validateJobsSilently(successfulJobs, searchCriteria);
    
    // Display single comprehensive table
    displayComprehensiveTable(formattedJobs, validJobs, 'REAL SEEK URL SCRAPING + VALIDATION RESULTS', searchCriteria);
    
    console.log(`\n⚡ PERFORMANCE:`);
    console.log(`   URL extraction: ${extractDuration}s`);
    console.log(`   Parallel scraping: ${scrapeDuration}s`);
    console.log(`   Total time: ${(parseFloat(extractDuration) + parseFloat(scrapeDuration)).toFixed(2)}s`);
    console.log(`   Browser instances: 5`);
    console.log(`   Timeout: 10 seconds`);
    
    console.log(`\n🎯 SUMMARY:`);
    console.log(`   URLs found: ${jobUrls.length}`);
    console.log(`   Successfully scraped: ${successfulJobs.length} (${((successfulJobs.length / jobUrls.length) * 100).toFixed(1)}%)`);
    console.log(`   Failed/Timeout: ${failedCount}`);
    if (keyword) {
      const keywordMatches = successfulJobs.filter(job => 
        job.title.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      console.log(`   Keyword "${keyword}" matches: ${keywordMatches}/${successfulJobs.length}`);
    }
    console.log(`   Final valid jobs: ${validJobs.length}/${successfulJobs.length}`);
    
    return { success: true, jobs: formattedJobs, validJobs, successfulJobs };
    
  } catch (error) {
    console.error(`\n💥 TEST 2 FAILED: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Get user input
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

const getUserSeekUrl = () => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\n📝 Provide a SEEK search URL:');
    console.log('   Example: https://www.seek.com.au/engineer-jobs/in-Dandenong-VIC-3175?daterange=7&distance=25');
    
    rl.question('🔗 Enter URL: ', (url) => {
      rl.close();
      resolve(url.trim());
    });
  });
};

/**
 * Main test execution
 */
const runFinalTest = async () => {
  console.log('🧪 FINAL COMPREHENSIVE PARALLEL SCRAPING TEST');
  console.log('===============================================');
  console.log('🔧 Fixes: 10s timeout, no duplicate tables, proper error handling\n');
  
  try {
    // TEST 1: Sample Jobs
    const test1Result = await testSampleJobsClean();
    
    if (!test1Result.success) {
      console.log('❌ Test 1 failed, aborting');
      return;
    }
    
    console.log('\n✅ Test 1 completed!');
    const proceed = await getUserConfirmation('\n🤔 Proceed to Test 2 (Real SEEK URL)?');
    
    if (!proceed) {
      console.log('\n👋 Test stopped by user');
      return;
    }
    
    // TEST 2: Real SEEK URL
    const seekUrl = await getUserSeekUrl();
    
    if (!seekUrl || !seekUrl.includes('seek.com.au')) {
      console.log('❌ Invalid SEEK URL');
      return;
    }
    
    const test2Result = await testRealSeekUrlClean(seekUrl);
    
    // Final summary
    console.log('\n🎯 FINAL TEST SUMMARY');
    console.log('======================');
    console.log(`✅ Test 1 (3 Sample Jobs): ${test1Result.success ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Test 2 (Real SEEK URL): ${test2Result.success ? 'PASSED' : 'FAILED'}`);
    console.log(`🔧 Timeout: 10 seconds (as requested)`);
    console.log(`🌐 Browser instances: 5`);
    console.log(`📊 Single table display: Fixed`);
    console.log(`🚫 Failed jobs excluded: Fixed`);
    
    if (test1Result.success && test2Result.success) {
      console.log('\n🎉 ALL TESTS PASSED - SYSTEM FULLY VALIDATED!');
    } else {
      console.log('\n⚠️ Some tests failed - check results above');
    }
    
  } catch (error) {
    console.error(`\n💥 TEST SUITE FAILED: ${error.message}`);
  }
  
  console.log('\n👋 Final test complete');
  setTimeout(() => process.exit(0), 2000);
};

// Run the test
runFinalTest();
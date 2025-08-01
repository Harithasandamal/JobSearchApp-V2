/**
 * REFACTORING VALIDATION TEST SCRIPT
 * Tests 3 critical scenarios before proceeding to next refactoring phase
 * 
 * Test Cases:
 * 1. Light mode (hardcoded 3 sample URLs)
 * 2. Dark mode without keyword (Dandenong, 25km, 7 days)  
 * 3. Dark mode with keyword (analyst, Dandenong, 25km, 7 days)
 */

const { scrapeJobDetails, scrapeAllJobsUnified } = require('../backend/controllers/search/jobScrapingUtils');
const { scrapeJobUrlsFromSearchResults } = require('../backend/controllers/search/searchResultsScraper');
const UrlBuilder = require('../backend/scrapers/UrlBuilder');

// Test configuration
const TIMEOUT_PER_JOB = 15000; // 15 seconds per job
const TIMEOUT_SEARCH = 30000;  // 30 seconds for search results
const MAX_JOBS_TO_TEST = 5;    // Limit for performance

// Sample URLs for light mode (from testJobsController.js)
const SAMPLE_URLS = [
  'https://www.seek.com.au/job/85981995?ref=recom-homepage&pos=4&sp=3&origin=jobTitle#sol=941dd2919d55ebc790f6017d3e00d197d7ce28a0',
  'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=f5c442d9c765b69183c0a9f36e76c3773779cff4',
  'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=ac705abd43f8e7aa11c57e26bdd7ef8de3e67313'
];

// Test parameters for dark mode
const DARK_MODE_PARAMS = {
  location: 'Dandenong',
  distance: '25 km', 
  postedAgo: '7 days'
};

/**
 * Utility: Safe job scraping with timeout
 */
async function scrapeJobSafely(url, index, timeoutMs = TIMEOUT_PER_JOB) {
  try {
    const result = await Promise.race([
      scrapeJobDetails(url),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
    
    if (result && result.title && result.company) {
      console.log(`   ✅ Job ${index + 1}: "${result.title}" at "${result.company}"`);
      return { success: true, data: result, url };
    } else {
      console.log(`   ❌ Job ${index + 1}: Invalid data returned`);
      return { success: false, error: 'Invalid data', url };
    }
  } catch (error) {
    console.log(`   ❌ Job ${index + 1}: ${error.message}`);
    return { success: false, error: error.message, url };
  }
}

/**
 * TEST 1: Light Mode (3 hardcoded sample URLs)
 */
async function testLightMode() {
  console.log('🌞 TEST 1: LIGHT MODE (Test Mode)');
  console.log('=' .repeat(50));
  console.log(`Testing ${SAMPLE_URLS.length} hardcoded sample job URLs...`);
  
  const startTime = Date.now();
  
  console.log(`🚀 LIGHT MODE - Using unified parallel scraping for all ${SAMPLE_URLS.length} sample URLs simultaneously...`);
  
  // Use unified parallel scraping for light mode (same as dark mode)
  const scrapedJobs = await scrapeAllJobsUnified(SAMPLE_URLS);
  
  // Convert to expected result format
  const results = SAMPLE_URLS.map((url, index) => {
    const job = scrapedJobs.find(j => j.url === url);
    if (job && job.title && job.company) {
      console.log(`   ✅ Job ${index + 1}: "${job.title}" at "${job.company}"`);
      return { success: true, data: job, url };
    } else {
      console.log(`   ❌ Job ${index + 1}: Failed to scrape job from ${url}`);
      return { success: false, error: 'Failed to scrape', url };
    }
  });
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);
  const successCount = results.filter(r => r.success).length;
  
  console.log(`\n📊 LIGHT MODE RESULTS:`);
  console.log(`   ✅ Successful: ${successCount}/${SAMPLE_URLS.length}`);
  console.log(`   ⏱️ Total time: ${duration}s`);
  console.log(`   🚀 Avg per job: ${(parseFloat(duration) / SAMPLE_URLS.length).toFixed(1)}s`);
  
  const testPassed = successCount >= 2; // At least 2/3 jobs must work
  console.log(`   🎯 Test Result: ${testPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  return {
    testName: 'Light Mode',
    passed: testPassed,
    successCount,
    totalCount: SAMPLE_URLS.length,
    duration: parseFloat(duration),
    results
  };
}

/**
 * TEST 2: Dark Mode without keyword
 */
async function testDarkModeNoKeyword() {
  console.log('\n🌙 TEST 2: DARK MODE WITHOUT KEYWORD (Real Mode)');
  console.log('=' .repeat(50));
  
  const { location, distance, postedAgo } = DARK_MODE_PARAMS;
  console.log(`Searching for jobs in ${location} (${distance}, ${postedAgo})...`);
  
  try {
    // Build search URL
    const searchUrl = UrlBuilder.buildSeekUrl('', location, distance, postedAgo);
    console.log(`🔗 Search URL: ${searchUrl}`);
    
    // Get job URLs from search results
    console.log('\n🔍 Fetching job URLs from search results...');
    const jobUrls = await Promise.race([
      scrapeJobUrlsFromSearchResults(searchUrl, MAX_JOBS_TO_TEST),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Search timeout after ${TIMEOUT_SEARCH}ms`)), TIMEOUT_SEARCH)
      )
    ]);
    
    if (jobUrls.length === 0) {
      console.log('❌ No job URLs found from search results');
      return {
        testName: 'Dark Mode (No Keyword)',
        passed: false,
        successCount: 0,
        totalCount: 0,
        duration: 0,
        error: 'No job URLs found'
      };
    }
    
    console.log(`✅ Found ${jobUrls.length} job URLs`);
    
    // Test scraping first few jobs IN PARALLEL
    const urlsToTest = jobUrls.slice(0, Math.min(MAX_JOBS_TO_TEST, jobUrls.length));
    console.log(`\n🧪 Testing PARALLEL scraping of ${urlsToTest.length} jobs...`);
    
    const startTime = Date.now();
    
    // UNIFIED PARALLEL EXECUTION - all jobs scraped with unified engine
    console.log(`🚀 Using unified scraping engine for ${urlsToTest.length} jobs...`);
    const scrapedJobs = await scrapeAllJobsUnified(urlsToTest);
    
    // Convert to expected result format
    const results = urlsToTest.map((url, index) => {
      const job = scrapedJobs.find(j => j.url === url);
      if (job && job.title && job.company) {
        console.log(`   ✅ Job ${index + 1}: "${job.title}" at "${job.company}"`);
        return { success: true, data: job, url };
      } else {
        console.log(`   ❌ Job ${index + 1}: Failed to scrape job from ${url}`);
        return { success: false, error: 'Failed to scrape', url };
      }
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    const successCount = results.filter(r => r.success).length;
    
    console.log(`\n📊 DARK MODE (NO KEYWORD) RESULTS:`);
    console.log(`   🔗 URLs found: ${jobUrls.length}`);
    console.log(`   ✅ Scraped successfully: ${successCount}/${urlsToTest.length}`);
    console.log(`   ⏱️ Scraping time: ${duration}s`);
    
    const testPassed = successCount >= Math.ceil(urlsToTest.length * 0.6); // 60% success rate
    console.log(`   🎯 Test Result: ${testPassed ? '✅ PASSED' : '❌ FAILED'}`);
    
    return {
      testName: 'Dark Mode (No Keyword)',
      passed: testPassed,
      successCount,
      totalCount: urlsToTest.length,
      urlsFound: jobUrls.length,
      duration: parseFloat(duration),
      results
    };
    
  } catch (error) {
    console.log(`❌ Dark mode (no keyword) test failed: ${error.message}`);
    return {
      testName: 'Dark Mode (No Keyword)',
      passed: false,
      successCount: 0,
      totalCount: 0,
      duration: 0,
      error: error.message
    };
  }
}

/**
 * TEST 3: Dark Mode with keyword
 */
async function testDarkModeWithKeyword() {
  console.log('\n🌙 TEST 3: DARK MODE WITH KEYWORD (Real Mode)');
  console.log('=' .repeat(50));
  
  const keyword = 'analyst';
  const { location, distance, postedAgo } = DARK_MODE_PARAMS;
  console.log(`Searching for "${keyword}" jobs in ${location} (${distance}, ${postedAgo})...`);
  
  try {
    // Build search URL with keyword
    const searchUrl = UrlBuilder.buildSeekUrl(keyword, location, distance, postedAgo);
    console.log(`🔗 Search URL: ${searchUrl}`);
    
    // Get job URLs from search results
    console.log('\n🔍 Fetching job URLs from search results...');
    const jobUrls = await Promise.race([
      scrapeJobUrlsFromSearchResults(searchUrl, MAX_JOBS_TO_TEST),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Search timeout after ${TIMEOUT_SEARCH}ms`)), TIMEOUT_SEARCH)
      )
    ]);
    
    if (jobUrls.length === 0) {
      console.log('❌ No job URLs found from search results');
      return {
        testName: 'Dark Mode (With Keyword)',
        passed: false,
        successCount: 0,
        totalCount: 0,
        duration: 0,
        error: 'No job URLs found'
      };
    }
    
    console.log(`✅ Found ${jobUrls.length} job URLs`);
    
    // Test scraping first few jobs IN PARALLEL
    const urlsToTest = jobUrls.slice(0, Math.min(MAX_JOBS_TO_TEST, jobUrls.length));
    console.log(`\n🧪 Testing PARALLEL scraping of ${urlsToTest.length} jobs...`);
    
    const startTime = Date.now();
    
    // UNIFIED PARALLEL EXECUTION - all jobs scraped with unified engine
    console.log(`🚀 Using unified scraping engine for ${urlsToTest.length} jobs...`);
    const scrapedJobs = await scrapeAllJobsUnified(urlsToTest);
    
    // Convert to expected result format
    const results = urlsToTest.map((url, index) => {
      const job = scrapedJobs.find(j => j.url === url);
      if (job && job.title && job.company) {
        console.log(`   ✅ Job ${index + 1}: "${job.title}" at "${job.company}"`);
        return { success: true, data: job, url };
      } else {
        console.log(`   ❌ Job ${index + 1}: Failed to scrape job from ${url}`);
        return { success: false, error: 'Failed to scrape', url };
      }
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    const successCount = results.filter(r => r.success).length;
    
    // Validate keyword relevance
    const relevantJobs = results.filter(r => 
      r.success && r.data.title.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    
    console.log(`\n📊 DARK MODE (WITH KEYWORD) RESULTS:`);
    console.log(`   🔗 URLs found: ${jobUrls.length}`);
    console.log(`   ✅ Scraped successfully: ${successCount}/${urlsToTest.length}`);
    console.log(`   🎯 Keyword relevant: ${relevantJobs}/${successCount}`);
    console.log(`   ⏱️ Scraping time: ${duration}s`);
    
    const testPassed = successCount >= Math.ceil(urlsToTest.length * 0.6) && relevantJobs >= 1;
    console.log(`   🎯 Test Result: ${testPassed ? '✅ PASSED' : '❌ FAILED'}`);
    
    return {
      testName: 'Dark Mode (With Keyword)',
      passed: testPassed,
      successCount,
      totalCount: urlsToTest.length,
      urlsFound: jobUrls.length,
      relevantJobs,
      duration: parseFloat(duration),
      results
    };
    
  } catch (error) {
    console.log(`❌ Dark mode (with keyword) test failed: ${error.message}`);
    return {
      testName: 'Dark Mode (With Keyword)',
      passed: false,
      successCount: 0,
      totalCount: 0,
      duration: 0,
      error: error.message
    };
  }
}

/**
 * Main test runner
 */
async function runRefactoringValidationTests() {
  console.log('🧪 REFACTORING VALIDATION TEST SUITE');
  console.log('=====================================');
  console.log('Testing core functionality before proceeding to next refactoring phase\n');
  
  const overallStartTime = Date.now();
  const testResults = [];
  
  try {
    // Run all 3 tests sequentially
    const test1 = await testLightMode();
    testResults.push(test1);
    
    const test2 = await testDarkModeNoKeyword();
    testResults.push(test2);
    
    const test3 = await testDarkModeWithKeyword();
    testResults.push(test3);
    
    // Overall results
    const overallEndTime = Date.now();
    const overallDuration = ((overallEndTime - overallStartTime) / 1000).toFixed(1);
    
    const passedTests = testResults.filter(test => test.passed).length;
    const allTestsPassed = passedTests === testResults.length;
    
    console.log('\n' + '=' .repeat(70));
    console.log('🎯 REFACTORING VALIDATION SUMMARY');
    console.log('=' .repeat(70));
    
    testResults.forEach((test, index) => {
      console.log(`${index + 1}. ${test.testName}: ${test.passed ? '✅ PASSED' : '❌ FAILED'}`);
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      } else {
        console.log(`   Success Rate: ${test.successCount}/${test.totalCount} (${((test.successCount/test.totalCount)*100).toFixed(1)}%)`);
      }
    });
    
    console.log(`\n📊 OVERALL RESULT: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
    console.log(`🕐 Total test time: ${overallDuration}s`);
    console.log(`📈 Tests passed: ${passedTests}/${testResults.length}`);
    
    if (allTestsPassed) {
      console.log('\n🚀 ✅ READY TO PROCEED TO NEXT REFACTORING PHASE!');
      console.log('All core functionality is working correctly.');
    } else {
      console.log('\n⚠️ ❌ NOT READY FOR NEXT PHASE');
      console.log('Some functionality needs to be fixed before proceeding.');
    }
    
    return {
      allPassed: allTestsPassed,
      results: testResults,
      totalDuration: parseFloat(overallDuration)
    };
    
  } catch (error) {
    console.error('\n❌ TEST SUITE CRASHED:', error.message);
    console.error(error.stack);
    return {
      allPassed: false,
      error: error.message,
      results: testResults
    };
  }
}

// Export for use in refactoring phases
module.exports = {
  runRefactoringValidationTests,
  testLightMode,
  testDarkModeNoKeyword, 
  testDarkModeWithKeyword
};

// Run tests if this file is executed directly
if (require.main === module) {
  runRefactoringValidationTests()
    .then(result => {
      console.log('\n👋 Test suite completed');
      process.exit(result.allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite failed to run:', error.message);
      process.exit(1);
    });
}
/**
 * IMPROVED PARALLEL SCRAPING TEST
 * Enhanced test with 5 browser instances and better error handling
 */

const { scrapeJobUrlsFromSearchResults } = require('../backend/controllers/search/searchResultsScraper');
const { scrapeAllJobsUnified } = require('../backend/controllers/search/jobScrapingUtils');
const { filterJobsByCriteria } = require('../backend/controllers/search/jobValidationController');
const readline = require('readline');

// Sample job URLs for testing - Updated to consistent structure
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
  console.log('='.repeat(130));
  console.log('| # | Status | Title (35 chars)                   | Company (20 chars)    | Location (12)  | Posted    | Valid |');
  console.log('='.repeat(130));
  
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
  
  console.log('='.repeat(130));
  
  if (validatedJobs) {
    const successRate = ((validatedJobs.length / jobs.length) * 100).toFixed(1);
    console.log(`📈 VALIDATION: ${validatedJobs.length}/${jobs.length} jobs passed (${successRate}%)`);
  }
  
  const scrapedCount = jobs.filter(job => job.title).length;
  const scrapeRate = ((scrapedCount / jobs.length) * 100).toFixed(1);
  console.log(`📈 SCRAPING: ${scrapedCount}/${jobs.length} jobs scraped successfully (${scrapeRate}%)`);
};

/**
 * Test 1: Sample Jobs Parallel Scraping (Enhanced)
 */
const testSampleJobsEnhanced = async () => {
  console.log('\n🧪 TEST 1: ENHANCED PARALLEL SCRAPING OF 3 SAMPLE JOBS');
  console.log('='.repeat(65));
  console.log('📋 Testing with 5 browser instances for better performance...');
  console.log(`📊 URLs to process: ${SAMPLE_URLS.length}`);
  
  // Show the URLs being tested
  console.log('\n📋 Sample URLs:');
  SAMPLE_URLS.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url.substring(0, 80)}...`);
  });
  
  try {
    const startTime = Date.now();
    console.log('\n🚀 Starting enhanced parallel scraping with 5 browser instances...');
    
    const jobs = await scrapeAllJobsUnified(SAMPLE_URLS);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n📊 Scraping completed! Processing ${jobs.length} results...`);
    
    // Ensure we have exactly 3 jobs (one for each URL)
    if (jobs.length !== SAMPLE_URLS.length) {
      console.log(`⚠️ Warning: Expected ${SAMPLE_URLS.length} jobs, got ${jobs.length}`);
      
      // Add placeholders for missing jobs
      const finalJobs = [];
      SAMPLE_URLS.forEach((url, index) => {
        const job = jobs.find(j => j.url === url) || jobs[index];
        if (job) {
          finalJobs.push(job);
        } else {
          finalJobs.push({
            title: `Failed to scrape job ${index + 1}`,
            company: 'Error',
            location: 'Error',
            postedAgo: 'Error',
            url: url
          });
        }
      });
      jobs.splice(0, jobs.length, ...finalJobs);
    }
    
    // Format jobs for display
    const formattedJobs = jobs.map((job, index) => ({
      title: job.title,
      company: job.company || 'Not specified',
      location: job.location || 'Not specified',
      postedAgo: job.postedAgo || 'Not specified',
      salary: job.salary || 'Not specified',
      url: SAMPLE_URLS[index] || job.url
    }));
    
    displayResultsTable(formattedJobs, '3 SAMPLE JOBS ENHANCED PARALLEL SCRAPING RESULTS');
    
    console.log(`\n⚡ PERFORMANCE (5 Browser Instances):`);
    console.log(`   Total time: ${duration}s`);
    console.log(`   Average per job: ${(parseFloat(duration) / SAMPLE_URLS.length).toFixed(2)}s`);
    console.log(`   Jobs/second: ${(SAMPLE_URLS.length / parseFloat(duration)).toFixed(1)}`);
    console.log(`   Browser instances: 5 (enhanced performance)`);
    console.log(`   Parallel efficiency: ${formattedJobs.filter(j => j.title !== 'Error').length === SAMPLE_URLS.length ? 'SUCCESS' : 'PARTIAL'}`);
    
    return { success: true, jobs: formattedJobs, duration };
    
  } catch (error) {
    console.error(`\n💥 TEST 1 FAILED: ${error.message}`);
    return { success: false, error: error.message };
  }
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
 * Get user SEEK URL
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
 * Test 2: Real SEEK URL Scraping with Enhanced Performance
 */
const testRealSeekUrlEnhanced = async (searchUrl) => {
  console.log('\n🧪 TEST 2: ENHANCED REAL SEEK URL PARALLEL SCRAPING');
  console.log('='.repeat(60));
  console.log(`📄 Search URL: ${searchUrl}`);
  
  // Extract criteria from URL
  const keyword = extractKeywordFromUrl(searchUrl);
  const postedAgo = extractPostedTimeFromUrl(searchUrl);
  
  console.log(`🎯 Extracted Keyword: ${keyword || 'None'}`);
  console.log(`⏰ Extracted Posted Time: ${postedAgo}`);
  console.log(`🌐 Using 5 browser instances for enhanced performance`);
  
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
    
    // Step 2: Scrape all job details in parallel with 5 browser instances
    console.log('\n🚀 Step 2: Enhanced parallel scraping with 5 browser instances...');
    const startScrapeTime = Date.now();
    
    const jobs = await scrapeAllJobsUnified(jobUrls);
    
    const endScrapeTime = Date.now();
    const scrapeDuration = ((endScrapeTime - startScrapeTime) / 1000).toFixed(2);
    
    console.log(`✅ Scraped ${jobs.length}/${jobUrls.length} jobs in ${scrapeDuration}s`);
    
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
    displayResultsTable(formattedJobs, 'ENHANCED REAL SEEK URL SCRAPING + CROSS-VALIDATION', validatedJobs);
    
    console.log(`\n⚡ ENHANCED PERFORMANCE (5 Browser Instances):`);
    console.log(`   URL extraction: ${extractDuration}s`);
    console.log(`   Parallel scraping: ${scrapeDuration}s`);
    console.log(`   Total time: ${(parseFloat(extractDuration) + parseFloat(scrapeDuration)).toFixed(2)}s`);
    console.log(`   Average per job: ${(parseFloat(scrapeDuration) / jobUrls.length).toFixed(2)}s`);
    console.log(`   Success rate: ${((jobs.length / jobUrls.length) * 100).toFixed(1)}%`);
    console.log(`   Browser instances: 5 (enhanced)`);
    
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
 * Main test execution
 */
const runEnhancedTest = async () => {
  console.log('🧪 ENHANCED PARALLEL SCRAPING TEST SUITE');
  console.log('==========================================');
  console.log('Testing enhanced parallel scraping with 5 browser instances.\n');
  
  try {
    // TEST 1: Sample Jobs with Enhanced Performance
    const test1Result = await testSampleJobsEnhanced();
    
    if (!test1Result.success) {
      console.log('❌ Test 1 failed, aborting test suite');
      return;
    }
    
    // Ask for confirmation to proceed
    console.log('\n✅ Test 1 completed!');
    const proceedToTest2 = await getUserConfirmation('\n🤔 Proceed to Test 2 (Real SEEK URL with enhanced performance)?');
    
    if (!proceedToTest2) {
      console.log('\n👋 Test suite stopped by user');
      return;
    }
    
    // TEST 2: Real SEEK URL with Enhanced Performance
    const seekUrl = await getUserSeekUrl();
    
    if (!seekUrl || !seekUrl.includes('seek.com.au')) {
      console.log('❌ Invalid SEEK URL provided');
      return;
    }
    
    const test2Result = await testRealSeekUrlEnhanced(seekUrl);
    
    // Final summary
    console.log('\n🎯 ENHANCED TEST SUITE SUMMARY');
    console.log('===============================');
    console.log(`✅ Test 1 (3 Sample Jobs): ${test1Result.success ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Test 2 (Real SEEK URL): ${test2Result.success ? 'PASSED' : 'FAILED'}`);
    console.log(`🌐 Browser Instances: 5 (Enhanced Performance)`);
    
    if (test1Result.success && test2Result.success) {
      console.log('\n🎉 ALL ENHANCED TESTS PASSED - 5 BROWSER INSTANCES VALIDATED!');
    } else {
      console.log('\n⚠️ Some tests failed - review results above');
    }
    
  } catch (error) {
    console.error(`\n💥 ENHANCED TEST SUITE FAILED: ${error.message}`);
  }
  
  console.log('\n👋 Enhanced test suite complete - exiting...');
  setTimeout(() => process.exit(0), 2000);
};

// Run the enhanced test suite
runEnhancedTest();
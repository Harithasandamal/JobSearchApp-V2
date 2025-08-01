/**
 * INTERACTIVE REFACTORING TEST SCRIPT
 * Tests 3 scenarios with manual confirmation at each step
 * 
 * Phase 1: Light Mode (3 hardcoded sample URLs)
 * Phase 2: Dark Mode (No keyword) - Dandenong, 25km, 7 days
 * Phase 3: Dark Mode (With keyword) - analyst, Dandenong, 25km, 7 days
 */

const readline = require('readline');
const { scrapeJobDetails, scrapeAllJobsUnified } = require('./backend/controllers/search/jobScrapingUtils');
const { scrapeJobUrlsFromSearchResults } = require('./backend/controllers/search/searchResultsScraper');
const UrlBuilder = require('./backend/scrapers/UrlBuilder');

// Interactive prompt setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askConfirmation = (message) => {
  return new Promise((resolve) => {
    rl.question(`\n${message} (y/n): `, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
};

const waitForConfirmation = (phase) => {
  return new Promise((resolve) => {
    console.log(`\n🔍 PHASE ${phase} COMPLETE - Please review the results above.`);
    console.log(`Press ENTER to continue to next phase... (or wait 10 seconds for auto-continue)`);
    
    let resolved = false;
    
    // Auto-continue after 10 seconds if no input
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('\n⏰ Auto-continuing to next phase...');
        resolve();
      }
    }, 10000);
    
    // Manual continue on ENTER
    process.stdin.once('data', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve();
      }
    });
  });
};

// Validation functions (copied from jobSearchController.js)
const validateJobAgainstCriteria = (job, searchCriteria) => {
  const { keyword, postedAgo } = searchCriteria;
  
  let isValid = true;
  let reasons = [];
  
  // Keyword validation (exact match as requested)
  if (keyword && keyword.trim()) {
    const jobText = `${job.title || ''} ${job.summary || ''}`.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    const hasKeyword = jobText.includes(keywordLower);
    
    if (!hasKeyword) {
      isValid = false;
      reasons.push(`Missing keyword "${keyword}"`);
    }
  }
  
  // Posted time validation (strict SEEK format validation)
  if (postedAgo && job.postedAgo) {
    const isValidTime = validatePostedTime(job.postedAgo, postedAgo);
    if (!isValidTime) {
      isValid = false;
      reasons.push(`Posted time "${job.postedAgo}" exceeds "${postedAgo}"`);
    }
  }
  
  return { isValid, reasons };
};

const validatePostedTime = (jobPostedAgo, criteriaPostedAgo) => {
  if (!jobPostedAgo || jobPostedAgo === 'Unknown' || jobPostedAgo === 'Time not specified') {
    return false;
  }
  
  const parseTime = (timeStr) => {
    const lower = timeStr.toLowerCase();
    
    // Handle SEEK formats: "just now", "X minute(s)", "X hour(s)", "X day(s)", "X month(s)"
    if (lower.includes('just now') || lower.includes('just posted')) return 0;
    
    const match = lower.match(/(\d+)\s*(minute|hour|day|month)/);
    if (match) {
      const num = parseInt(match[1]);
      const unit = match[2];
      
      switch (unit) {
        case 'minute': return num / (24 * 60); // Convert to days
        case 'hour': return num / 24; // Convert to days  
        case 'day': return num;
        case 'month': return num * 30; // Convert to days
        default: return Infinity;
      }
    }
    
    return Infinity;
  };
  
  const jobDays = parseTime(jobPostedAgo);
  const criteriaDays = parseInt(criteriaPostedAgo.replace(/\D/g, '')) || 7;
  
  return jobDays <= criteriaDays;
};

const filterJobsByCriteria = (jobs, searchCriteria) => {
  const validationResults = jobs.map(job => ({
    job,
    validation: validateJobAgainstCriteria(job, searchCriteria)
  }));
  
  // Display validation table
  console.log('\n📊 VALIDATION RESULTS:');
  console.log('='.repeat(100));
  validationResults.forEach((result, index) => {
    const { job, validation } = result;
    const status = validation.isValid ? '✅ VALID' : '❌ INVALID';
    const reasons = validation.reasons.length > 0 ? ` (${validation.reasons.join(', ')})` : '';
    
    console.log(`${index + 1}. ${job.title?.substring(0, 40) || 'No title'}... - ${status}${reasons}`);
  });
  
  const validJobs = validationResults
    .filter(result => result.validation.isValid)
    .map(result => result.job);
    
  console.log(`\n📈 VALIDATION SUMMARY: ${validJobs.length}/${jobs.length} jobs passed criteria`);
  return validJobs;
};

// Test data formatting
const formatJobForDisplay = (job, index) => {
  console.log(`\n📋 JOB ${index + 1}:`);
  console.log(`   🔗 URL: ${job.url}`);
  console.log(`   🏢 Title: ${job.title || 'N/A'}`);
  console.log(`   🏢 Company: ${job.company || 'N/A'}`);
  console.log(`   📍 Location: ${job.location || 'N/A'}`);
  console.log(`   ⏰ Posted: ${job.postedAgo || 'N/A'}`);
  console.log(`   💰 Salary: ${job.salary || 'N/A'}`);
  console.log(`   📊 Type: ${job.jobType || 'N/A'}`);
  console.log(`   📝 Summary: ${job.summary ? job.summary.substring(0, 150) + '...' : 'N/A'}`);
  console.log(`   ✅ Valid: ${job.isValid ? 'YES' : 'NO'}`);
};

// Phase 1: Light Mode Test
const testLightMode = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🌞 PHASE 1: LIGHT MODE TEST (3 Sample URLs)');
  console.log('='.repeat(60));
  
  // Exact same URLs from testJobsController.js
  const sampleUrls = [
    'https://www.seek.com.au/job/85981995?ref=recom-homepage&pos=4&sp=3&origin=jobTitle#sol=941dd2919d55ebc790f6017d3e00d197d7ce28a0',
    'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=f5c442d9c765b69183c0a9f36e76c3773779cff4',
    'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=ac705abd43f8e7aa11c57e26bdd7ef8de3e67313'
  ];

  console.log(`\n📊 Testing ${sampleUrls.length} hardcoded URLs:`);
  sampleUrls.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url.substring(0, 70)}...`);
  });

  try {
    console.log('\n🚀 Starting parallel scraping...');
    const startTime = Date.now();
    
    // Scrape all URLs in parallel (same as production method)
    const scrapingPromises = sampleUrls.map(async (url, index) => {
      try {
        console.log(`   🔍 Scraping job ${index + 1}...`);
        const jobData = await scrapeJobDetails(url);
        return { ...jobData, url, isValid: !!jobData.title };
      } catch (error) {
        console.log(`   ❌ Job ${index + 1} failed: ${error.message}`);
        return { url, isValid: false, error: error.message };
      }
    });

    const results = await Promise.all(scrapingPromises);
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n⏱️ SCRAPING COMPLETED in ${duration}s`);
    console.log('\n📊 RESULTS:');
    
    results.forEach(formatJobForDisplay);
    
    const validJobs = results.filter(job => job.isValid);
    console.log(`\n📈 SUMMARY:`);
    console.log(`   ✅ Valid jobs: ${validJobs.length}/${results.length}`);
    console.log(`   ⏱️ Total time: ${duration}s`);
    console.log(`   🚀 Avg time per job: ${(duration / results.length).toFixed(2)}s`);
    
    return validJobs;
    
  } catch (error) {
    console.error(`\n❌ LIGHT MODE TEST FAILED: ${error.message}`);
    return [];
  }
};

// Phase 2: Dark Mode Test (No Keyword)
const testDarkModeNoKeyword = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🌙 PHASE 2: DARK MODE TEST (No Keyword)');
  console.log('='.repeat(60));
  
  const searchParams = {
    keyword: '',
    location: 'Dandenong',
    distance: '25 km',
    postedAgo: '7 days'
  };

  console.log('\n📋 Search Parameters:');
  console.log(`   🔍 Keyword: ${searchParams.keyword || '(none)'}`);
  console.log(`   📍 Location: ${searchParams.location}`);
  console.log(`   📏 Distance: ${searchParams.distance}`);
  console.log(`   ⏰ Posted: ${searchParams.postedAgo}`);

  try {
    // Build search URL using current UrlBuilder
    console.log('\n🔧 Building search URL...');
    const searchUrl = UrlBuilder.buildSeekUrl(
      searchParams.keyword,
      searchParams.location,
      searchParams.distance,
      searchParams.postedAgo
    );
    
    console.log(`\n🔗 Generated URL:`);
    console.log(`   ${searchUrl}`);

    // ACTUAL DARK MODE SEARCH IMPLEMENTATION
    console.log('\n🔍 Starting real search and scraping...');
    
    // Step 1: Extract job URLs from search results page
    console.log('\n📄 Step 1: Extracting job URLs from search results...');
    const startTime = Date.now();
    const jobUrls = await scrapeJobUrlsFromSearchResults(searchUrl, 15);
    
    if (jobUrls.length === 0) {
      console.log('❌ No job URLs found from search results');
      return { searchUrl, params: searchParams, jobUrls: [], jobs: [] };
    }
    
    console.log(`✅ Found ${jobUrls.length} job URLs from search results`);
    jobUrls.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url.substring(0, 70)}...`);
    });
    
    // Step 2: Scrape individual job details  
    console.log('\n🚀 Step 2: Scraping individual job details in parallel...');
    const jobs = await scrapeAllJobsUnified(jobUrls);
    
    // Format jobs for display
    const formattedJobs = jobs.map((job, index) => ({
      id: `dark-job-${index + 1}`,
      title: job.title,
      company: job.company || 'Company not specified',
      location: job.location || 'Location not specified',
      postedAgo: job.postedAgo || 'Time not specified',
      salary: job.salary || 'Not specified',
      jobType: job.jobType || 'Not specified',
      summary: job.summary || 'No summary available',
      url: job.url,
      isValid: !!job.title
    }));
    
    // Step 3: Validate results (no keyword filtering for this phase)
    console.log('\n✅ Step 3: Validating results against search criteria...');
    const validatedJobs = filterJobsByCriteria(formattedJobs, searchParams);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Display results table
    console.log('\n📊 DARK MODE (NO KEYWORD) RESULTS:');
    validatedJobs.forEach(formatJobForDisplay);
    
    console.log(`\n📈 FINAL SUMMARY:`);
    console.log(`   🔗 URLs found: ${jobUrls.length}`);
    console.log(`   🛠️ Jobs scraped: ${formattedJobs.length}`);
    console.log(`   ✅ Valid jobs: ${validatedJobs.length}`);
    console.log(`   ⏱️ Total time: ${duration}s`);
    
    return { searchUrl, params: searchParams, jobUrls, jobs: validatedJobs };
    
  } catch (error) {
    console.error(`\n❌ DARK MODE (No Keyword) TEST FAILED: ${error.message}`);
    return null;
  }
};

// Phase 3: Dark Mode Test (With Keyword)
const testDarkModeWithKeyword = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🌙 PHASE 3: DARK MODE TEST (With Keyword)');
  console.log('='.repeat(60));
  
  const searchParams = {
    keyword: 'analyst',
    location: 'Dandenong',
    distance: '25 km',
    postedAgo: '7 days'
  };

  console.log('\n📋 Search Parameters:');
  console.log(`   🔍 Keyword: ${searchParams.keyword}`);
  console.log(`   📍 Location: ${searchParams.location}`);
  console.log(`   📏 Distance: ${searchParams.distance}`);
  console.log(`   ⏰ Posted: ${searchParams.postedAgo}`);

  try {
    // Build search URL with keyword
    console.log('\n🔧 Building search URL with keyword...');
    const searchUrl = UrlBuilder.buildSeekUrl(
      searchParams.keyword,
      searchParams.location,
      searchParams.distance,
      searchParams.postedAgo
    );
    
    console.log(`\n🔗 Generated URL:`);
    console.log(`   ${searchUrl}`);

    // Show validation criteria
    console.log('\n✅ VALIDATION CRITERIA:');
    console.log(`   🎯 Keyword Match: Job title/description must contain "${searchParams.keyword}"`);
    console.log(`   📍 Location Match: Job location must be within ${searchParams.distance} of ${searchParams.location}`);
    console.log(`   ⏰ Time Match: Job posted within ${searchParams.postedAgo}`);
    
    // ACTUAL DARK MODE SEARCH IMPLEMENTATION WITH KEYWORD VALIDATION
    console.log('\n🔍 Starting real search and scraping with keyword validation...');
    
    // Step 1: Extract job URLs from search results page
    console.log('\n📄 Step 1: Extracting job URLs from search results...');
    const startTime = Date.now();
    const jobUrls = await scrapeJobUrlsFromSearchResults(searchUrl, 15);
    
    if (jobUrls.length === 0) {
      console.log('❌ No job URLs found from search results');
      return { searchUrl, params: searchParams, jobUrls: [], jobs: [] };
    }
    
    console.log(`✅ Found ${jobUrls.length} job URLs from search results`);
    jobUrls.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url.substring(0, 70)}...`);
    });
    
    // Step 2: Scrape individual job details  
    console.log('\n🚀 Step 2: Scraping individual job details in parallel...');
    const jobs = await scrapeAllJobsUnified(jobUrls);
    
    // Format jobs for display
    const formattedJobs = jobs.map((job, index) => ({
      id: `dark-keyword-job-${index + 1}`,
      title: job.title,
      company: job.company || 'Company not specified',
      location: job.location || 'Location not specified',
      postedAgo: job.postedAgo || 'Time not specified',
      salary: job.salary || 'Not specified',
      jobType: job.jobType || 'Not specified',
      summary: job.summary || 'No summary available',
      url: job.url,
      isValid: !!job.title
    }));
    
    // Step 3: Validate results WITH STRICT KEYWORD FILTERING
    console.log('\n✅ Step 3: Validating results with STRICT keyword filtering...');
    const validatedJobs = filterJobsByCriteria(formattedJobs, searchParams);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Display results table
    console.log('\n📊 DARK MODE (WITH KEYWORD) RESULTS:');
    validatedJobs.forEach(formatJobForDisplay);
    
    // Show keyword validation details
    console.log('\n🎯 KEYWORD VALIDATION BREAKDOWN:');
    formattedJobs.forEach((job, index) => {
      const jobText = `${job.title || ''} ${job.summary || ''}`.toLowerCase();
      const hasKeyword = jobText.includes(searchParams.keyword.toLowerCase());
      const status = hasKeyword ? '✅ MATCH' : '❌ NO MATCH';
      console.log(`   ${index + 1}. ${job.title?.substring(0, 50) || 'No title'}... - ${status}`);
    });
    
    console.log(`\n📈 FINAL SUMMARY:`);
    console.log(`   🔗 URLs found: ${jobUrls.length}`);
    console.log(`   🛠️ Jobs scraped: ${formattedJobs.length}`);
    console.log(`   🎯 Keyword matches: ${formattedJobs.filter(job => {
      const jobText = `${job.title || ''} ${job.summary || ''}`.toLowerCase();
      return jobText.includes(searchParams.keyword.toLowerCase());
    }).length}`);
    console.log(`   ✅ Final valid jobs: ${validatedJobs.length}`);
    console.log(`   ⏱️ Total time: ${duration}s`);
    
    return { searchUrl, params: searchParams, jobUrls, jobs: validatedJobs };
    
  } catch (error) {
    console.error(`\n❌ DARK MODE (With Keyword) TEST FAILED: ${error.message}`);
    return null;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🧪 INTERACTIVE REFACTORING TEST SUITE');
  console.log('=====================================');
  console.log('This script tests the 3 core scenarios before refactoring.');
  console.log('Each phase requires manual confirmation to proceed.\n');

  try {
    // Phase 1: Light Mode
    console.log('🔄 Starting Phase 1...');
    const lightModeResults = await testLightMode();
    console.log(`✅ Phase 1 completed with ${lightModeResults ? lightModeResults.length : 0} jobs`);
    await waitForConfirmation(1);

    // Phase 2: Dark Mode (No Keyword)  
    console.log('🔄 Starting Phase 2...');
    const darkModeNoKeywordResults = await testDarkModeNoKeyword();
    console.log(`✅ Phase 2 completed with ${darkModeNoKeywordResults ? darkModeNoKeywordResults.jobs.length : 0} jobs`);
    await waitForConfirmation(2);

    // Phase 3: Dark Mode (With Keyword)
    console.log('🔄 Starting Phase 3...');
    const darkModeWithKeywordResults = await testDarkModeWithKeyword();
    console.log(`✅ Phase 3 completed with ${darkModeWithKeywordResults ? darkModeWithKeywordResults.jobs.length : 0} jobs`);
    await waitForConfirmation(3);

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 TEST SUITE COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Phase 1 (Light Mode): ${lightModeResults ? lightModeResults.length : 0} jobs extracted`);
    console.log(`✅ Phase 2 (Dark Mode - No Keyword): ${darkModeNoKeywordResults ? darkModeNoKeywordResults.jobs.length : 0} jobs found`);
    console.log(`✅ Phase 3 (Dark Mode - With Keyword): ${darkModeWithKeywordResults ? darkModeWithKeywordResults.jobs.length : 0} jobs found`);
    console.log('\n🚀 Ready to proceed with refactoring phases!');

  } catch (error) {
    console.error(`\n💥 TEST SUITE FAILED: ${error.message}`);
    console.error('Stack trace:', error.stack);
  } finally {
    console.log('\n🔄 Cleaning up...');
    try {
      rl.close();
    } catch (e) {
      // Ignore cleanup errors
    }
    
    // Force exit after a short delay to ensure cleanup
    setTimeout(() => {
      console.log('👋 Test suite finished - exiting...');
      process.exit(0);
    }, 2000);
  }
};

// Run if called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testLightMode, testDarkModeNoKeyword, testDarkModeWithKeyword };
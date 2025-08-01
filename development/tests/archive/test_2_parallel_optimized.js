/**
 * TEST 2 ONLY - OPTIMIZED PARALLEL SCRAPING
 * Focus on getting 100% success rate on first attempt with real SEEK URL
 */

const { scrapeJobUrlsFromSearchResults } = require('../backend/controllers/search/searchResultsScraper');
const { scrapeAllJobsUnified } = require('../backend/controllers/search/jobScrapingUtils');
const { validateJobAgainstCriteria } = require('../backend/controllers/search/jobValidationController');

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
 * Extract posted time from SEEK URL
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
 * Display optimized results table
 */
const displayOptimizedResultsTable = (allJobs, validJobs, searchCriteria) => {
  console.log(`\n📊 OPTIMIZED PARALLEL SCRAPING RESULTS`);
  console.log('='.repeat(120));
  console.log('| # | Scraped | Valid | Title (30 chars)           | Company (18 chars)  | Posted    | Validation');
  console.log('='.repeat(120));
  
  allJobs.forEach((job, index) => {
    const num = (index + 1).toString().padStart(2, ' ');
    const scraped = job.title && job.title.trim() !== '' ? '✅' : '❌';
    
    let valid = 'N/A';
    let validation = 'N/A';
    
    if (scraped === '✅') {
      const isValid = validJobs.some(validJob => validJob.title === job.title);
      valid = isValid ? '✅' : '❌';
      
      if (isValid) {
        validation = 'Passed';
      } else if (searchCriteria.keyword && !job.title.toLowerCase().includes(searchCriteria.keyword.toLowerCase())) {
        validation = `No "${searchCriteria.keyword}"`;
      } else {
        validation = `Time > ${searchCriteria.postedAgo}`;
      }
    } else {
      validation = 'Scraping failed';
    }
    
    const title = (job.title || 'TIMEOUT/FAILED').substring(0, 30).padEnd(30, ' ');
    const company = (job.company || 'N/A').substring(0, 18).padEnd(18, ' ');
    const posted = (job.postedAgo || 'N/A').substring(0, 9).padEnd(9, ' ');
    
    console.log(`| ${num} | ${scraped}      | ${valid}    | ${title} | ${company} | ${posted} | ${validation}`);
  });
  
  console.log('='.repeat(120));
  
  const scrapedCount = allJobs.filter(job => job.title && job.title.trim() !== '').length;
  const scrapeRate = ((scrapedCount / allJobs.length) * 100).toFixed(1);
  const validRate = scrapedCount > 0 ? ((validJobs.length / scrapedCount) * 100).toFixed(1) : '0.0';
  
  console.log(`📈 SCRAPING SUCCESS: ${scrapedCount}/${allJobs.length} jobs (${scrapeRate}%)`);
  console.log(`📈 VALIDATION SUCCESS: ${validJobs.length}/${scrapedCount} scraped jobs (${validRate}%)`);
  console.log(`📈 OVERALL SUCCESS: ${validJobs.length}/${allJobs.length} total jobs (${((validJobs.length / allJobs.length) * 100).toFixed(1)}%)`);
};

/**
 * Test 2: Optimized Real SEEK URL Scraping
 */
const testOptimizedRealSeekUrl = async () => {
  console.log('🧪 TEST 2: OPTIMIZED PARALLEL SCRAPING (REAL SEEK URL)');
  console.log('======================================================');
  console.log('🎯 Goal: 100% success rate on first attempt');
  console.log('🔧 Method: Batched parallel processing with 5 browsers');
  console.log('⏰ Timeout: 10 seconds per job');
  console.log('📦 Batch size: 5 jobs per batch\n');
  
  // Use a known working SEEK URL for testing
  const searchUrl = 'https://www.seek.com.au/manager-jobs/in-Dandenong-VIC-3175?daterange=7&distance=25';
  
  console.log(`📄 Test URL: ${searchUrl}`);
  
  const keyword = extractKeywordFromUrl(searchUrl);
  const postedAgo = extractPostedTimeFromUrl(searchUrl);
  const searchCriteria = { keyword, postedAgo };
  
  console.log(`🎯 Keyword Filter: ${keyword || 'None'}`);
  console.log(`⏰ Posted Time Filter: ${postedAgo}`);
  
  try {
    // Step 1: Extract job URLs
    console.log('\n📋 STEP 1: Extracting job URLs from search results...');
    const startExtractTime = Date.now();
    
    const jobUrls = await scrapeJobUrlsFromSearchResults(searchUrl, 25); // Get 25 jobs for thorough testing
    
    const extractDuration = ((Date.now() - startExtractTime) / 1000).toFixed(2);
    console.log(`✅ Extracted ${jobUrls.length} job URLs in ${extractDuration}s`);
    
    if (jobUrls.length === 0) {
      console.log('❌ No job URLs found - test cannot proceed');
      return { success: false, error: 'No job URLs found' };
    }
    
    // Step 2: Optimized parallel scraping with batching
    console.log('\n🚀 STEP 2: Optimized batched parallel scraping...');
    console.log(`📦 Processing ${jobUrls.length} jobs in batches of 5`);
    console.log('🌐 5 browser instances with 300ms creation delay');
    console.log('⏰ 10s timeout per job with resource optimization');
    
    const startScrapeTime = Date.now();
    
    const jobs = await scrapeAllJobsUnified(jobUrls);
    
    const scrapeDuration = ((Date.now() - startScrapeTime) / 1000).toFixed(2);
    
    // Analyze scraping results
    const successfulJobs = jobs.filter(job => job.title && job.title.trim() !== '');
    const failedJobs = jobs.filter(job => !job.title || job.title.trim() === '');
    
    console.log(`\n📊 SCRAPING ANALYSIS:`);
    console.log(`   Total job URLs: ${jobUrls.length}`);
    console.log(`   Successfully scraped: ${successfulJobs.length}`);
    console.log(`   Failed/Timeout: ${failedJobs.length}`);
    console.log(`   First-attempt success rate: ${((successfulJobs.length / jobUrls.length) * 100).toFixed(1)}%`);
    console.log(`   Total scraping time: ${scrapeDuration}s`);
    console.log(`   Average time per job: ${(parseFloat(scrapeDuration) / jobUrls.length).toFixed(2)}s`);
    
    // Format all jobs for display
    const formattedJobs = jobs.map((job, index) => ({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      postedAgo: job.postedAgo || '',
      url: jobUrls[index] || job.url
    }));
    
    // Step 3: Validation (only for successfully scraped jobs)
    console.log('\n🎯 STEP 3: Cross-validation against search criteria...');
    
    const validatedJobs = [];
    successfulJobs.forEach(job => {
      const validation = validateJobAgainstCriteria(job, searchCriteria);
      if (validation.isValid) {
        validatedJobs.push(job);
      }
    });
    
    console.log(`   Validation completed: ${validatedJobs.length}/${successfulJobs.length} scraped jobs passed`);
    
    // Display comprehensive results
    displayOptimizedResultsTable(formattedJobs, validatedJobs, searchCriteria);
    
    // Performance summary
    console.log(`\n⚡ PERFORMANCE SUMMARY:`);
    console.log(`   URL extraction: ${extractDuration}s`);
    console.log(`   Parallel scraping: ${scrapeDuration}s`);
    console.log(`   Total time: ${(parseFloat(extractDuration) + parseFloat(scrapeDuration)).toFixed(2)}s`);
    console.log(`   Browsers used: 5 (batched processing)`);
    console.log(`   Timeout per job: 10 seconds`);
    console.log(`   Resource optimization: Enabled`);
    
    // Success criteria analysis
    const firstAttemptSuccessRate = (successfulJobs.length / jobUrls.length) * 100;
    const overallSuccessRate = (validatedJobs.length / jobUrls.length) * 100;
    
    console.log(`\n🎯 SUCCESS CRITERIA ANALYSIS:`);
    console.log(`   First-attempt scraping: ${firstAttemptSuccessRate.toFixed(1)}% (Target: 95%+)`);
    console.log(`   Overall pipeline: ${overallSuccessRate.toFixed(1)}% (URLs → Valid jobs)`);
    
    if (firstAttemptSuccessRate >= 95) {
      console.log('   ✅ FIRST-ATTEMPT SUCCESS TARGET MET!');
    } else {
      console.log('   ❌ First-attempt success below 95% - needs optimization');
    }
    
    if (keyword) {
      const keywordMatches = successfulJobs.filter(job => 
        job.title.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      console.log(`   Keyword matching: ${keywordMatches}/${successfulJobs.length} jobs contain "${keyword}"`);
    }
    
    const testSuccess = firstAttemptSuccessRate >= 95;
    
    console.log(`\n🏁 TEST 2 RESULT: ${testSuccess ? 'PASSED' : 'NEEDS OPTIMIZATION'}`);
    
    if (testSuccess) {
      console.log('🎉 Optimized parallel scraping working perfectly!');
      console.log('✅ Ready to apply this approach to Test 1 (sample jobs)');
    } else {
      console.log('⚠️ Parallel scraping needs further optimization');
      console.log('🔧 Consider: longer delays, smaller batches, or resource tuning');
    }
    
    return { 
      success: testSuccess, 
      successRate: firstAttemptSuccessRate,
      jobs: formattedJobs, 
      validJobs: validatedJobs,
      performance: { extractDuration, scrapeDuration }
    };
    
  } catch (error) {
    console.error(`\n💥 TEST 2 FAILED: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Run Test 2
const runTest = async () => {
  console.log('🚀 STARTING OPTIMIZED TEST 2');
  console.log('=============================\n');
  
  const result = await testOptimizedRealSeekUrl();
  
  console.log('\n👋 Test 2 complete');
  setTimeout(() => process.exit(0), 2000);
};

runTest();
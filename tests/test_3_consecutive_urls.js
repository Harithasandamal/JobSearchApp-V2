/**
 * TEST 3 CONSECUTIVE SEARCH URLs - OPTIMIZED PARALLEL SCRAPING
 * Tests 3 search URLs consecutively with 12s timeout and proper batching for all 22 jobs
 */

const { scrapeJobUrlsFromSearchResults } = require('../backend/controllers/search/searchResultsScraper');
const { scrapeAllJobsUnified } = require('../backend/controllers/search/jobScrapingUtils');
const { validateJobAgainstCriteria } = require('../backend/controllers/search/jobValidationController');
const readline = require('readline');

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
 * Display compact results table for consecutive testing
 */
const displayCompactResultsTable = (allJobs, validJobs, searchCriteria, testNumber) => {
  console.log(`\n📊 TEST ${testNumber} RESULTS - BATCHED PARALLEL SCRAPING (12s timeout)`);
  console.log('='.repeat(110));
  console.log('| # | OK | Val | Title (25 chars)      | Company (15 chars) | Posted   | Status');
  console.log('='.repeat(110));
  
  allJobs.forEach((job, index) => {
    const num = (index + 1).toString().padStart(2, ' ');
    const scraped = job.title && job.title.trim() !== '' ? '✅' : '❌';
    
    let valid = 'N/A';
    let status = 'N/A';
    
    if (scraped === '✅') {
      const isValid = validJobs.some(validJob => validJob.title === job.title);
      valid = isValid ? '✅' : '❌';
      
      if (isValid) {
        status = 'Valid';
      } else if (searchCriteria.keyword && !job.title.toLowerCase().includes(searchCriteria.keyword.toLowerCase())) {
        status = `No "${searchCriteria.keyword}"`;
      } else {
        status = `Time>${searchCriteria.postedAgo}`;
      }
    } else {
      status = 'Timeout/Failed';
    }
    
    const title = (job.title || 'TIMEOUT').substring(0, 25).padEnd(25, ' ');
    const company = (job.company || 'N/A').substring(0, 15).padEnd(15, ' ');
    const posted = (job.postedAgo || 'N/A').substring(0, 8).padEnd(8, ' ');
    
    console.log(`| ${num} | ${scraped} | ${valid}  | ${title} | ${company} | ${posted} | ${status}`);
  });
  
  console.log('='.repeat(110));
  
  const scrapedCount = allJobs.filter(job => job.title && job.title.trim() !== '').length;
  const scrapeRate = ((scrapedCount / allJobs.length) * 100).toFixed(1);
  const validRate = scrapedCount > 0 ? ((validJobs.length / scrapedCount) * 100).toFixed(1) : '0.0';
  
  console.log(`📈 SCRAPED: ${scrapedCount}/${allJobs.length} (${scrapeRate}%) | VALID: ${validJobs.length}/${scrapedCount} (${validRate}%) | BATCH: 5x batches with jobs 21,22 included`);
  
  return { scrapedCount, validCount: validJobs.length, totalCount: allJobs.length };
};

/**
 * Test single search URL with optimized batching
 */
const testSingleSearchUrl = async (searchUrl, testNumber) => {
  console.log(`\n🧪 TEST ${testNumber}: SEARCH URL VALIDATION`);
  console.log('='.repeat(50));
  console.log(`📄 URL: ${searchUrl.substring(0, 80)}...`);
  
  const keyword = extractKeywordFromUrl(searchUrl);
  const postedAgo = extractPostedTimeFromUrl(searchUrl);
  const searchCriteria = { keyword, postedAgo };
  
  console.log(`🎯 Keyword: ${keyword || 'None'} | ⏰ Time: ${postedAgo} | 🌐 5 browsers | ⏱️ 12s timeout`);
  
  try {
    // Step 1: Extract job URLs
    console.log(`\n📋 Step 1: Extracting job URLs...`);
    const startExtractTime = Date.now();
    
    const jobUrls = await scrapeJobUrlsFromSearchResults(searchUrl, 30); // Get all jobs from first page
    
    const extractDuration = ((Date.now() - startExtractTime) / 1000).toFixed(2);
    console.log(`✅ Found ${jobUrls.length} URLs in ${extractDuration}s`);
    
    if (jobUrls.length === 0) {
      console.log('❌ No job URLs found');
      return { success: false, error: 'No URLs found', testNumber };
    }
    
    // Step 2: Batched parallel scraping
    console.log(`\n🚀 Step 2: Batched parallel scraping...`);
    console.log(`📦 Expected batches: Batch 1(1-5), Batch 2(6-10), Batch 3(11-15), Batch 4(16-20), Batch 5(21-${jobUrls.length})`);
    
    const startScrapeTime = Date.now();
    
    const jobs = await scrapeAllJobsUnified(jobUrls);
    
    const scrapeDuration = ((Date.now() - startScrapeTime) / 1000).toFixed(2);
    
    // Format jobs
    const formattedJobs = jobs.map((job, index) => ({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      postedAgo: job.postedAgo || '',
      url: jobUrls[index] || job.url
    }));
    
    // Step 3: Validation
    console.log(`\n🎯 Step 3: Validation...`);
    const successfulJobs = jobs.filter(job => job.title && job.title.trim() !== '');
    
    const validatedJobs = [];
    successfulJobs.forEach(job => {
      const validation = validateJobAgainstCriteria(job, searchCriteria);
      if (validation.isValid) {
        validatedJobs.push(job);
      }
    });
    
    // Display results
    const stats = displayCompactResultsTable(formattedJobs, validatedJobs, searchCriteria, testNumber);
    
    // Performance metrics
    const successRate = (stats.scrapedCount / stats.totalCount) * 100;
    console.log(`⚡ Performance: Extract(${extractDuration}s) + Scrape(${scrapeDuration}s) = Total(${(parseFloat(extractDuration) + parseFloat(scrapeDuration)).toFixed(2)}s)`);
    console.log(`🎯 Success Rate: ${successRate.toFixed(1)}% first-attempt | Target: 90%+ | Status: ${successRate >= 90 ? '✅ PASSED' : '❌ NEEDS IMPROVEMENT'}`);
    
    return { 
      success: successRate >= 90, 
      successRate,
      testNumber,
      stats,
      performance: { extractDuration, scrapeDuration }
    };
    
  } catch (error) {
    console.error(`\n💥 TEST ${testNumber} FAILED: ${error.message}`);
    return { success: false, error: error.message, testNumber };
  }
};

/**
 * Get search URLs from user
 */
const getSearchUrls = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const urls = [];
  
  console.log('\n📝 Please provide 3 SEEK search URLs for consecutive testing:');
  console.log('   Example: https://www.seek.com.au/engineer-jobs/in-Dandenong-VIC-3175?daterange=7&distance=25');
  console.log('');
  
  for (let i = 1; i <= 3; i++) {
    const url = await new Promise((resolve) => {
      rl.question(`🔗 Enter Search URL ${i}: `, (answer) => {
        resolve(answer.trim());
      });
    });
    
    if (url && url.includes('seek.com.au')) {
      urls.push(url);
      console.log(`   ✅ URL ${i} added`);
    } else {
      console.log(`   ❌ Invalid URL ${i} - skipping`);
    }
  }
  
  rl.close();
  return urls;
};

/**
 * Main test execution
 */
const runConsecutiveTests = async () => {
  console.log('🧪 3 CONSECUTIVE SEARCH URLs - BATCHED PARALLEL SCRAPING TEST');
  console.log('============================================================');
  console.log('🔧 Optimizations: 12s timeout, 5-batch processing, jobs 21-22 included');
  console.log('🎯 Target: 90%+ success rate per search URL\n');
  
  try {
    const searchUrls = await getSearchUrls();
    
    if (searchUrls.length === 0) {
      console.log('❌ No valid URLs provided');
      return;
    }
    
    console.log(`\n🚀 Starting consecutive testing of ${searchUrls.length} search URLs...`);
    
    const results = [];
    
    // Test each URL consecutively
    for (let i = 0; i < searchUrls.length; i++) {
      const result = await testSingleSearchUrl(searchUrls[i], i + 1);
      results.push(result);
      
      // Brief pause between tests
      if (i < searchUrls.length - 1) {
        console.log('\n⏳ Pausing 3 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Final summary
    console.log('\n🎯 CONSECUTIVE TESTING SUMMARY');
    console.log('==============================');
    
    let totalSuccess = 0;
    results.forEach((result, index) => {
      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      const rate = result.successRate ? `${result.successRate.toFixed(1)}%` : 'N/A';
      console.log(`   Test ${index + 1}: ${status} (${rate} success rate)`);
      
      if (result.success) totalSuccess++;
    });
    
    const overallSuccess = (totalSuccess / searchUrls.length) * 100;
    console.log(`\n📊 OVERALL RESULTS:`);
    console.log(`   Tests passed: ${totalSuccess}/${searchUrls.length}`);
    console.log(`   Overall success: ${overallSuccess.toFixed(1)}%`);
    console.log(`   Batching: 5 batches with jobs 21-22 included`);
    console.log(`   Timeout: 12 seconds per job`);
    console.log(`   Browser instances: 5`);
    
    if (overallSuccess >= 75) {
      console.log('\n🎉 CONSECUTIVE TESTING SUCCESSFUL!');
      console.log('✅ Optimized parallel scraping is working reliably');
    } else {
      console.log('\n⚠️ Some tests failed - may need further optimization');
    }
    
  } catch (error) {
    console.error(`\n💥 CONSECUTIVE TESTING FAILED: ${error.message}`);
  }
  
  console.log('\n👋 Consecutive testing complete');
  setTimeout(() => process.exit(0), 2000);
};

// Run the consecutive tests
runConsecutiveTests();
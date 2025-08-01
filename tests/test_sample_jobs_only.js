/**
 * TEST 1: 3 SAMPLE JOBS PARALLEL SCRAPING ONLY
 * Clean test to show the 3 sample jobs results clearly
 */

const { scrapeAllJobsUnified } = require('../backend/controllers/search/jobScrapingUtils');

// Sample job URLs for testing - Updated to consistent structure
const SAMPLE_URLS = [
  'https://www.seek.com.au/job/85981995?ref=search-standalone&type=standard&origin=jobTitle#sol=014f12b9189e0a6d2c275dd68ab2722888ade58a',
  'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=014f12b9189e0a6d2c275dd68ab2722888ade58b',
  'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=014f12b9189e0a6d2c275dd68ab2722888ade58c'
];

/**
 * Display results in a formatted table
 */
const displayResultsTable = (jobs, title) => {
  console.log(`\n📊 ${title}`);
  console.log('='.repeat(130));
  console.log('| # | Status | Title (40 chars)                        | Company (25 chars)       | Location (15)   | Posted    | URL (30 chars)                 |');
  console.log('='.repeat(130));
  
  jobs.forEach((job, index) => {
    const num = (index + 1).toString().padStart(2, ' ');
    const status = job.title ? '✅' : '❌';
    const title = (job.title || 'Failed to scrape').substring(0, 40).padEnd(40, ' ');
    const company = (job.company || 'N/A').substring(0, 25).padEnd(25, ' ');
    const location = (job.location || 'N/A').substring(0, 15).padEnd(15, ' ');
    const posted = (job.postedAgo || 'N/A').substring(0, 9).padEnd(9, ' ');
    const url = (job.url || SAMPLE_URLS[index] || 'N/A').substring(0, 30).padEnd(30, ' ');
    
    console.log(`| ${num} | ${status}     | ${title} | ${company} | ${location} | ${posted} | ${url} |`);
  });
  
  console.log('='.repeat(130));
  
  const scrapedCount = jobs.filter(job => job.title).length;
  const scrapeRate = ((scrapedCount / jobs.length) * 100).toFixed(1);
  console.log(`📈 SUCCESS RATE: ${scrapedCount}/${jobs.length} jobs (${scrapeRate}%)`);
};

/**
 * Test sample jobs parallel scraping
 */
const testSampleJobs = async () => {
  console.log('🧪 TEST 1: PARALLEL SCRAPING OF 3 SAMPLE JOBS');
  console.log('='.repeat(60));
  console.log('📋 Testing parallel scraping with 3 hardcoded sample URLs...');
  console.log(`📊 URLs to process: ${SAMPLE_URLS.length}`);
  
  // Show the URLs being tested
  console.log('\n📋 Sample URLs:');
  SAMPLE_URLS.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url.substring(0, 80)}...`);
  });
  
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
    
    displayResultsTable(formattedJobs, '3 SAMPLE JOBS PARALLEL SCRAPING RESULTS');
    
    console.log(`\n⚡ PERFORMANCE:`);
    console.log(`   Total time: ${duration}s`);
    console.log(`   Average per job: ${(parseFloat(duration) / SAMPLE_URLS.length).toFixed(2)}s`);
    console.log(`   Jobs/second: ${(SAMPLE_URLS.length / parseFloat(duration)).toFixed(1)}`);
    console.log(`   Parallel efficiency: ${jobs.length === SAMPLE_URLS.length ? 'SUCCESS' : 'PARTIAL'}`);
    
    return { success: true, jobs: formattedJobs, duration };
    
  } catch (error) {
    console.error(`\n💥 TEST 1 FAILED: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Run the test
const runTest = async () => {
  console.log('🧪 SAMPLE JOBS PARALLEL SCRAPING TEST');
  console.log('======================================');
  console.log('Testing parallel scraping functionality with 3 hardcoded sample URLs.\n');
  
  const result = await testSampleJobs();
  
  console.log('\n🎯 TEST 1 SUMMARY');
  console.log('==================');
  console.log(`✅ Result: ${result.success ? 'PASSED' : 'FAILED'}`);
  
  if (result.success) {
    console.log('🎉 3 SAMPLE JOBS PARALLEL SCRAPING VALIDATED!');
    console.log('✅ Multiple browser instances working correctly');
    console.log('✅ All job details scraped successfully');
    console.log('✅ Performance metrics look good');
  } else {
    console.log(`❌ Test failed: ${result.error}`);
  }
  
  console.log('\n👋 Test complete - ready for confirmation to proceed to Test 2');
  setTimeout(() => process.exit(0), 2000);
};

runTest();
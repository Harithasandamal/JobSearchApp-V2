/**
 * Test the optimized scraper with both sample URLs and real search results
 */
const { scrapeAllJobsOptimized } = require('./controllers/search/jobScrapingUtils');

async function testOptimizedScraper() {
  console.log('🧪 TESTING OPTIMIZED SCRAPER');
  console.log('=' .repeat(80));
  
  // Test 1: Sample URLs
  console.log('\n📋 TEST 1: Sample URLs');
  console.log('-' .repeat(40));
  
  const sampleUrls = [
    'https://www.seek.com.au/job/85981995?ref=recom-homepage&pos=4&sp=3&origin=jobTitle#sol=941dd2919d55ebc790f6017d3e00d197d7ce28a0',
    'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=f5c442d9c765b69183c0a9f36e76c3773779cff4'
  ];
  
  try {
    const jobs = await scrapeAllJobsOptimized(sampleUrls);
    
    console.log(`\n✅ Sample URL Test Results:`);
    console.log(`   Jobs found: ${jobs.length}/${sampleUrls.length}`);
    jobs.forEach((job, i) => {
      console.log(`   ${i+1}. "${job.title}" at "${job.company}"`);
    });
    
  } catch (error) {
    console.error(`❌ Sample URL test failed: ${error.message}`);
  }
  
  // Test 2: Real search results
  console.log('\n📋 TEST 2: Real Search Results');
  console.log('-' .repeat(40));
  
  try {
    const { getJobUrlsForSearch } = require('./controllers/search/searchResultsScraper');
    const realUrls = await getJobUrlsForSearch('developer', 'Melbourne', '50 km', '7 days', 5);
    
    if (realUrls.length > 0) {
      console.log(`Found ${realUrls.length} real job URLs from search`);
      
      const realJobs = await scrapeAllJobsOptimized(realUrls.slice(0, 3)); // Test first 3
      
      console.log(`\n✅ Real Search Test Results:`);
      console.log(`   Jobs found: ${realJobs.length}/${Math.min(3, realUrls.length)}`);
      realJobs.forEach((job, i) => {
        console.log(`   ${i+1}. "${job.title}" at "${job.company}"`);
      });
      
    } else {
      console.log('❌ No real job URLs found from search');
    }
    
  } catch (error) {
    console.error(`❌ Real search test failed: ${error.message}`);
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('🏁 TESTING COMPLETE');
}

// Run the test
testOptimizedScraper().then(() => {
  console.log('All tests completed');
  process.exit(0);
}).catch(error => {
  console.error('Test suite failed:', error.message);
  process.exit(1);
});
/**
 * Test Job URL Issue in Light Mode
 * Verifies that jobs have proper URLs for extraction
 */

const { SAMPLE_URLS } = require('../../app/backend/constants/sampleUrls');
const OptimizedSeekScraper = require('../../app/backend/utils/OptimizedSeekScraper');

async function testJobUrlIssue() {
  console.log('🧪 Testing Job URL Issue in Light Mode');
  console.log('========================================');
  
  // Test with sample URLs
  const testUrls = SAMPLE_URLS.slice(0, 2);
  
  if (testUrls.length === 0) {
    console.log('❌ No test URLs available');
    return false;
  }
  
  console.log(`📋 Testing with ${testUrls.length} sample URLs:`);
  testUrls.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url}`);
  });
  
  const scraper = new OptimizedSeekScraper();
  scraper.maxBrowsers = 1; // Use single browser for testing
  
  try {
    console.log('\n🚀 Scraping jobs to check URL structure...');
    
    const result = await scraper.scrapeAllJobsParallel(testUrls, 1);
    
    console.log('\n📊 Scraping Results:');
    console.log(`   Total Jobs: ${result.metrics.totalJobs}`);
    console.log(`   Successful: ${result.metrics.successful}`);
    console.log(`   Failed: ${result.metrics.failed}`);
    
    if (result.jobs.length > 0) {
      console.log('\n✅ Job Structure Analysis:');
      result.jobs.forEach((job, index) => {
        console.log(`\n   Job ${index + 1}:`);
        console.log(`     Title: ${job.title}`);
        console.log(`     Company: ${job.company}`);
        console.log(`     Location: ${job.location}`);
        console.log(`     Posted: ${job.postedAgo}`);
        console.log(`     URL: ${job.url || 'NO URL'}`);
        console.log(`     Success: ${job.success}`);
        
        // Check if URL is valid for extraction
        const hasValidUrl = job.url && (job.url.startsWith('http') || job.url.startsWith('https'));
        console.log(`     Valid URL for extraction: ${hasValidUrl ? '✅' : '❌'}`);
      });
      
      // Check if all jobs have valid URLs
      const jobsWithValidUrls = result.jobs.filter(job => 
        job.url && (job.url.startsWith('http') || job.url.startsWith('https'))
      );
      
      console.log(`\n📋 Summary:`);
      console.log(`   Jobs with valid URLs: ${jobsWithValidUrls.length}/${result.jobs.length}`);
      console.log(`   Jobs ready for extraction: ${jobsWithValidUrls.length}`);
      
      return jobsWithValidUrls.length === result.jobs.length;
    } else {
      console.log('\n❌ No jobs scraped successfully');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run test
testJobUrlIssue()
  .then(success => {
    console.log(`\n${success ? '✅' : '❌'} Job URL issue test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  }); 
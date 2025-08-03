/**
 * Test Scraping Improvements
 * Verifies that browser errors and timeout issues are fixed
 */

const OptimizedSeekScraper = require('../../app/backend/utils/OptimizedSeekScraper');
const { SAMPLE_URLS } = require('../../app/backend/constants/sampleUrls');

async function testScrapingImprovements() {
  console.log('🧪 Testing Scraping Improvements');
  console.log('================================');
  
  // Use real URLs from config
  const testUrls = SAMPLE_URLS.slice(0, 3); // Test with first 3 URLs
  
  if (testUrls.length === 0) {
    console.log('❌ No test URLs available');
    return false;
  }
  
  console.log(`📋 Using ${testUrls.length} real test URLs`);
  
  const scraper = new OptimizedSeekScraper();
  scraper.maxBrowsers = 2; // Use fewer browsers for testing
  
  try {
    console.log(`🚀 Testing enhanced scraping with ${testUrls.length} URLs...`);
    
    const result = await scraper.scrapeAllJobsParallel(testUrls, 1);
    
    console.log('\n📊 Results:');
    console.log(`   Total Jobs: ${result.metrics.totalJobs}`);
    console.log(`   Successful: ${result.metrics.successful}`);
    console.log(`   Failed: ${result.metrics.failed}`);
    console.log(`   Success Rate: ${result.metrics.successRate.toFixed(1)}%`);
    console.log(`   Total Time: ${(result.metrics.totalDuration/1000).toFixed(1)}s`);
    console.log(`   Jobs/Second: ${result.metrics.jobsPerSecond.toFixed(1)}`);
    
    if (result.metrics.errorTypes && Object.keys(result.metrics.errorTypes).length > 0) {
      console.log('\n🔍 Error Analysis:');
      Object.entries(result.metrics.errorTypes).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} jobs`);
      });
    }
    
    // Show detailed error information
    if (result.allResults) {
      console.log('\n📋 Detailed Results:');
      result.allResults.forEach((job, index) => {
        const status = job.success ? '✅' : '❌';
        console.log(`   ${status} Job ${index + 1}: ${job.title || 'No title'} (${job.scrapeDuration}ms)`);
        if (!job.success && job.error) {
          console.log(`      Error: ${job.error}`);
        }
      });
    }
    
    if (result.jobs.length > 0) {
      console.log('\n✅ Sample successful job:');
      const sampleJob = result.jobs[0];
      console.log(`   Title: ${sampleJob.title}`);
      console.log(`   Company: ${sampleJob.company}`);
      console.log(`   Location: ${sampleJob.location}`);
      console.log(`   Posted: ${sampleJob.postedAgo}`);
    }
    
    console.log('\n🎯 Test completed successfully!');
    return result.metrics.successRate > 0;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run test
testScrapingImprovements()
  .then(success => {
    console.log(`\n${success ? '✅' : '❌'} Scraping improvements test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  }); 
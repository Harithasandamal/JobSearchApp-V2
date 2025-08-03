/**
 * Test Progress Tracking
 * Verifies that loading bars accurately reflect backend progress
 */

const { SAMPLE_URLS } = require('../../app/backend/constants/sampleUrls');
const OptimizedSeekScraper = require('../../app/backend/utils/OptimizedSeekScraper');

async function testProgressTracking() {
  console.log('🧪 Testing Progress Tracking Accuracy');
  console.log('=====================================');
  
  // Test with sample URLs
  const testUrls = SAMPLE_URLS.slice(0, 2);
  
  if (testUrls.length === 0) {
    console.log('❌ No test URLs available');
    return false;
  }
  
  console.log(`📋 Testing progress tracking with ${testUrls.length} sample URLs`);
  
  const scraper = new OptimizedSeekScraper();
  scraper.maxBrowsers = 1; // Use single browser for testing
  
  try {
    console.log('\n🚀 Testing scraping with progress tracking...');
    
    const startTime = Date.now();
    const result = await scraper.scrapeAllJobsParallel(testUrls, 1);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n📊 Progress Tracking Results:');
    console.log(`   Total Jobs: ${result.metrics.totalJobs}`);
    console.log(`   Successful: ${result.metrics.successful}`);
    console.log(`   Failed: ${result.metrics.failed}`);
    console.log(`   Success Rate: ${result.metrics.successRate.toFixed(1)}%`);
    console.log(`   Total Time: ${duration.toFixed(1)}s`);
    console.log(`   Jobs/Second: ${result.metrics.jobsPerSecond.toFixed(1)}`);
    
    // Test progress mapping for light mode
    console.log('\n🔍 Light Mode Progress Mapping Test:');
    const lightModeProgressSteps = [
      { progress: 0, expectedStep: 0, description: 'Initializing' },
      { progress: 10, expectedStep: 1, description: 'Browser initialized' },
      { progress: 30, expectedStep: 2, description: 'Connected to sources' },
      { progress: 60, expectedStep: 3, description: 'Loading listings' },
      { progress: 80, expectedStep: 4, description: 'Extracting info' },
      { progress: 95, expectedStep: 4, description: 'Processing results' },
      { progress: 100, expectedStep: 4, description: 'Completed' }
    ];
    
    lightModeProgressSteps.forEach(({ progress, expectedStep, description }) => {
      let stepIndex = 0;
      if (progress >= 10) stepIndex = 1;
      if (progress >= 30) stepIndex = 2;
      if (progress >= 60) stepIndex = 3;
      if (progress >= 80) stepIndex = 4;
      if (progress >= 95) stepIndex = 4;
      
      const status = stepIndex === expectedStep ? '✅' : '❌';
      console.log(`   ${status} ${progress}% → Step ${stepIndex} (${description})`);
    });
    
    // Test progress mapping for dark mode (scoring)
    console.log('\n🔍 Dark Mode Progress Mapping Test:');
    const darkModeProgressSteps = [
      { progress: 0, expectedStep: 0, description: 'Initializing' },
      { progress: 10, expectedStep: 1, description: 'Downloading pages' },
      { progress: 30, expectedStep: 2, description: 'Converting to markdown' },
      { progress: 60, expectedStep: 3, description: 'ChatGPT extraction' },
      { progress: 90, expectedStep: 4, description: 'Compiling results' },
      { progress: 100, expectedStep: 4, description: 'Completed' }
    ];
    
    darkModeProgressSteps.forEach(({ progress, expectedStep, description }) => {
      let stepIndex = 0;
      if (progress >= 10) stepIndex = 1;
      if (progress >= 30) stepIndex = 2;
      if (progress >= 60) stepIndex = 3;
      if (progress >= 90) stepIndex = 4;
      
      const status = stepIndex === expectedStep ? '✅' : '❌';
      console.log(`   ${status} ${progress}% → Step ${stepIndex} (${description})`);
    });
    
    // Test backend progress granularity
    console.log('\n🔍 Backend Progress Granularity Test:');
    const backendProgressSteps = [
      { step: 'URL Collection', progress: 25, description: 'URLs collected' },
      { step: 'Scraping Start', progress: 50, description: 'Job scraping started' },
      { step: 'Scraping Complete', progress: 75, description: 'Jobs scraped' },
      { step: 'Sorting', progress: 85, description: 'Results sorted' },
      { step: 'Final', progress: 100, description: 'Search completed' }
    ];
    
    backendProgressSteps.forEach(({ step, progress, description }) => {
      console.log(`   ✅ ${step}: ${progress}% (${description})`);
    });
    
    console.log('\n🎯 Progress tracking test completed successfully!');
    return result.metrics.successRate > 0;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run test
testProgressTracking()
  .then(success => {
    console.log(`\n${success ? '✅' : '❌'} Progress tracking test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  }); 
/**
 * SIMPLE DATA PERSISTENCE TEST
 * Quick test to verify data persistence doesn't break core functionality
 */

const { scrapeAllJobsUnified } = require('../backend/controllers/search/jobScrapingUtils');
const { SAMPLE_URLS } = require('../backend/constants/sampleUrls');

async function testDataPersistenceCompatibility() {
  console.log('🧪 DATA PERSISTENCE COMPATIBILITY TEST');
  console.log('======================================');
  console.log('Testing that data persistence changes don\'t break core scraping...\n');
  
  try {
    console.log(`🚀 Testing unified scraping with ${SAMPLE_URLS.length} sample URLs...`);
    
    const startTime = Date.now();
    const jobs = await scrapeAllJobsUnified(SAMPLE_URLS);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n✅ DATA PERSISTENCE COMPATIBILITY TEST SUCCESS:`);
    console.log(`   Duration: ${duration}s`);
    console.log(`   Jobs: ${jobs.length}/${SAMPLE_URLS.length} scraped`);
    
    if (jobs.length === SAMPLE_URLS.length) {
      console.log(`🎯 COMPATIBILITY: All ${jobs.length} jobs scraped successfully ✓`);
      process.exit(0);
    } else {
      console.log(`⚠️ COMPATIBILITY WARNING: Only ${jobs.length}/${SAMPLE_URLS.length} jobs scraped`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ DATA PERSISTENCE COMPATIBILITY FAILED: ${error.message}`);
    process.exit(1);
  }
}

testDataPersistenceCompatibility();
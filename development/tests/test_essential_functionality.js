/**
 * ESSENTIAL FUNCTIONALITY TEST
 * Simplified test script to verify core features work
 * Used during refactoring to ensure no breaking changes
 */

const { scrapeJobDetails } = require('../../app/backend/controllers/search/jobScrapingUtils');

// Single test job URL for quick validation
const TEST_URL = 'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=f5c442d9c765b69183c0a9f36e76c3773779cff4';

async function testEssentialFunctionality() {
  console.log('⚡ ESSENTIAL FUNCTIONALITY TEST');
  console.log('==============================');
  console.log('Quick test to verify core scraping still works\n');
  
  console.log(`🔍 Testing single job scraping...`);
  console.log(`URL: ${TEST_URL.substring(0, 70)}...`);
  
  const startTime = Date.now();
  
  try {
    const result = await Promise.race([
      scrapeJobDetails(TEST_URL),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 20s')), 20000)
      )
    ]);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (result && result.title && result.company) {
      console.log(`✅ SUCCESS (${duration}s):`);
      console.log(`   Title: ${result.title}`);
      console.log(`   Company: ${result.company}`);
      console.log(`   Location: ${result.location || 'N/A'}`);
      console.log(`   Posted: ${result.postedAgo || 'N/A'}`);
      
      console.log('\n🎯 RESULT: ✅ CORE FUNCTIONALITY WORKING');
      return true;
    } else {
      console.log(`❌ FAILED: Invalid data returned`);
      console.log('\n🎯 RESULT: ❌ CORE FUNCTIONALITY BROKEN');
      return false;
    }
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`❌ FAILED (${duration}s): ${error.message}`);
    console.log('\n🎯 RESULT: ❌ CORE FUNCTIONALITY BROKEN');
    return false;
  }
}

// Run test if executed directly
if (require.main === module) {
  testEssentialFunctionality()
    .then(success => {
      console.log(`\n👋 Essential test ${success ? 'PASSED' : 'FAILED'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed to run:', error.message);
      process.exit(1);
    });
}

module.exports = { testEssentialFunctionality };
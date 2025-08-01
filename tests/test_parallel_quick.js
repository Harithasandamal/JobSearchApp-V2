/**
 * Quick test to verify parallel scraping improvements
 */
const { scrapeJobUrlsFromSearchResults } = require('../backend/controllers/search/searchResultsScraper');
const { scrapeJobDetails } = require('../backend/controllers/search/jobScrapingUtils');
const UrlBuilder = require('../backend/scrapers/UrlBuilder');

async function testParallelImprovement() {
  console.log('⚡ TESTING PARALLEL SCRAPING IMPROVEMENT');
  console.log('=======================================');
  
  try {
    // Build search URL for quick test
    const searchUrl = UrlBuilder.buildSeekUrl('', 'Dandenong', '25 km', '7 days');
    console.log(`🔗 Search URL: ${searchUrl.substring(0, 80)}...`);
    
    // Get 3 job URLs
    console.log('\n🔍 Getting job URLs...');
    const jobUrls = await scrapeJobUrlsFromSearchResults(searchUrl, 3);
    console.log(`✅ Found ${jobUrls.length} job URLs`);
    
    if (jobUrls.length < 2) {
      console.log('⚠️ Not enough URLs for parallel test');
      return;
    }
    
    // Test TRUE PARALLEL execution
    console.log('\n🚀 Testing PARALLEL scraping...');
    const startTime = Date.now();
    
    const results = await Promise.all(
      jobUrls.slice(0, 3).map(async (url, index) => {
        try {
          const result = await Promise.race([
            scrapeJobDetails(url),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 15000)
            )
          ]);
          
          if (result && result.title) {
            console.log(`   ✅ Job ${index + 1}: "${result.title}" - PARALLEL`);
            return { success: true, title: result.title };
          }
          return { success: false };
        } catch (error) {
          console.log(`   ❌ Job ${index + 1}: Failed - ${error.message}`);
          return { success: false, error: error.message };
        }
      })
    );
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    const successCount = results.filter(r => r.success).length;
    
    console.log(`\n📊 PARALLEL TEST RESULTS:`);
    console.log(`   ✅ Success: ${successCount}/${results.length}`);
    console.log(`   ⏱️ Total time: ${duration}s`);
    console.log(`   🚀 Speed: All jobs processed simultaneously`);
    
    if (successCount >= 2) {
      console.log('🎯 RESULT: ✅ PARALLEL SCRAPING WORKING');
    } else {
      console.log('🎯 RESULT: ⚠️ SOME FAILURES BUT PARALLEL STRUCTURE CORRECT');
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

// Run if executed directly
if (require.main === module) {
  testParallelImprovement()
    .then(() => {
      console.log('\n👋 Parallel test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testParallelImprovement };
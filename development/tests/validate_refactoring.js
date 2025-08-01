/**
 * REFACTORING VALIDATION TEST SCRIPT
 * Tests functionality after file splits to ensure nothing broke
 * 
 * Step 1: Test 3 sample job details scraping (hardcoded URLs)
 * Step 2: Test search results URL scraping (user-provided URLs)
 * Step 3: Test individual job URL scraping (user-provided URL)
 */

const readline = require('readline');
const { scrapeJobDetails } = require('../../app/backend/controllers/search/jobScrapingUtils');
const { scrapeJobUrlsFromSearchResults } = require('../../app/backend/controllers/search/searchResultsScraper');
const { filterJobsByCriteria } = require('../../app/backend/controllers/search/jobValidationController');

// Interactive prompt setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

const formatJobForDisplay = (job, index) => {
  console.log(`\n📋 JOB ${index + 1}:`);
  console.log(`   🔗 URL: ${job.url}`);
  console.log(`   🏢 Title: ${job.title || 'N/A'}`);
  console.log(`   🏢 Company: ${job.company || 'N/A'}`);
  console.log(`   📍 Location: ${job.location || 'N/A'}`);
  console.log(`   ⏰ Posted: ${job.postedAgo || 'N/A'}`);
  console.log(`   💰 Salary: ${job.salary || 'N/A'}`);
  console.log(`   📊 Type: ${job.jobType || 'N/A'}`);
  console.log(`   📝 Summary: ${job.summary ? job.summary.substring(0, 150) + '...' : 'N/A'}`);
  console.log(`   ✅ Status: ${job.title ? 'SUCCESS' : 'FAILED'}`);
};

// Step 1: Test 3 Sample Job Details Scraping
const testSampleJobScraping = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 STEP 1: TESTING 3 SAMPLE JOB DETAILS SCRAPING');
  console.log('='.repeat(70));
  
  const sampleUrls = [
    'https://www.seek.com.au/job/85981995?ref=recom-homepage&pos=4&sp=3&origin=jobTitle#sol=941dd2919d55ebc790f6017d3e00d197d7ce28a0',
    'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=f5c442d9c765b69183c0a9f36e76c3773779cff4',
    'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=ac705abd43f8e7aa11c57e26bdd7ef8de3e67313'
  ];
  
  console.log(`📊 Testing ${sampleUrls.length} hardcoded sample URLs:`);
  sampleUrls.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url.substring(0, 70)}...`);
  });
  
  try {
    console.log('\n🚀 Starting individual job scraping with 20-second timeout per job...');
    const startTime = Date.now();
    
    const results = [];
    
    for (let i = 0; i < sampleUrls.length; i++) {
      const url = sampleUrls[i];
      console.log(`\n🔍 Scraping job ${i + 1}/${sampleUrls.length}...`);
      
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Job scraping timeout after 20 seconds')), 20000);
        });
        
        const scrapingPromise = scrapeJobDetails(url);
        const jobData = await Promise.race([scrapingPromise, timeoutPromise]);
        
        if (jobData && jobData.title) {
          console.log(`   ✅ SUCCESS: ${jobData.title} - ${jobData.company || 'Unknown company'}`);
          results.push({ ...jobData, url, isValid: true });
        } else {
          console.log(`   ❌ FAILED: No job data returned`);
          results.push({ url, isValid: false, error: 'No job data returned' });
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        results.push({ url, isValid: false, error: error.message });
      }
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n📊 SAMPLE JOB SCRAPING RESULTS:');
    console.log('='.repeat(70));
    results.forEach(formatJobForDisplay);
    
    const successCount = results.filter(job => job.isValid).length;
    console.log(`\n📈 SUMMARY:`);
    console.log(`   ✅ Successful: ${successCount}/${results.length}`);
    console.log(`   ⏱️ Total time: ${duration}s`);
    console.log(`   🚀 Average per job: ${(duration / results.length).toFixed(2)}s`);
    
    return { success: successCount > 0, results, successCount };
    
  } catch (error) {
    console.error(`\n💥 SAMPLE JOB SCRAPING FAILED: ${error.message}`);
    return { success: false, results: [], successCount: 0 };
  }
};

// Step 2: Test Search Results URL Scraping
const testSearchResultsScraping = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 STEP 2: TESTING SEARCH RESULTS URL SCRAPING');
  console.log('='.repeat(70));
  
  console.log('Now I need search results URLs from you to test our scraping mechanism.');
  console.log('I will test both with and without keyword validation.\n');
  
  // Test without keyword first
  const searchUrl1 = await askQuestion('📝 Please provide a search results URL (WITHOUT keyword): ');
  
  if (!searchUrl1) {
    console.log('❌ No URL provided, skipping search results test');
    return { success: false };
  }
  
  try {
    console.log(`\n🔍 Testing search results scraping: ${searchUrl1.substring(0, 80)}...`);
    
    const startTime = Date.now();
    const jobUrls = await scrapeJobUrlsFromSearchResults(searchUrl1, 10);
    const endTime = Date.now();
    
    console.log(`\n📊 SEARCH RESULTS (NO KEYWORD):`);
    console.log(`   🔗 URLs found: ${jobUrls.length}`);
    console.log(`   ⏱️ Time taken: ${((endTime - startTime) / 1000).toFixed(2)}s`);
    
    if (jobUrls.length > 0) {
      console.log('\n📋 Found job URLs:');
      jobUrls.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`);
      });
    }
    
    // Ask for keyword test
    const testWithKeyword = await askQuestion('\n🎯 Test with keyword validation? (y/n): ');
    
    if (testWithKeyword.toLowerCase() === 'y' || testWithKeyword.toLowerCase() === 'yes') {
      const searchUrl2 = await askQuestion('📝 Please provide a search results URL WITH keyword (e.g., analyst jobs): ');
      const keyword = await askQuestion('🔍 What keyword should I validate against? ');
      
      if (searchUrl2 && keyword) {
        console.log(`\n🔍 Testing search with keyword validation: "${keyword}"`);
        
        const startTime2 = Date.now();
        const jobUrls2 = await scrapeJobUrlsFromSearchResults(searchUrl2, 10);
        const endTime2 = Date.now();
        
        console.log(`\n📊 SEARCH RESULTS (WITH KEYWORD "${keyword}"):`);
        console.log(`   🔗 URLs found: ${jobUrls2.length}`);
        console.log(`   ⏱️ Time taken: ${((endTime2 - startTime2) / 1000).toFixed(2)}s`);
        
        if (jobUrls2.length > 0) {
          console.log('\n📋 Found job URLs:');
          jobUrls2.forEach((url, index) => {
            console.log(`   ${index + 1}. ${url}`);
          });
          
          // Test cross-validation with sample job scraping
          console.log(`\n🧪 Testing cross-validation by scraping first 2 jobs...`);
          
          const testJobs = [];
          for (let i = 0; i < Math.min(2, jobUrls2.length); i++) {
            try {
              console.log(`   🔍 Scraping job ${i + 1} for validation...`);
              const jobData = await Promise.race([
                scrapeJobDetails(jobUrls2[i]),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
              ]);
              
              if (jobData && jobData.title) {
                testJobs.push({
                  ...jobData,
                  url: jobUrls2[i]
                });
                console.log(`      ✅ ${jobData.title} - ${jobData.company || 'Unknown'}`);
              }
            } catch (error) {
              console.log(`      ❌ Failed: ${error.message}`);
            }
          }
          
          if (testJobs.length > 0) {
            console.log(`\n🎯 CROSS-VALIDATION TEST:`);
            const searchCriteria = { keyword, postedAgo: '7 days' };
            const validatedJobs = filterJobsByCriteria(testJobs, searchCriteria);
            
            console.log(`\n📈 VALIDATION SUMMARY:`);
            console.log(`   📋 Jobs scraped: ${testJobs.length}`);
            console.log(`   ✅ Jobs matching "${keyword}": ${validatedJobs.length}`);
          }
        }
      }
    }
    
    return { success: jobUrls.length > 0 };
    
  } catch (error) {
    console.error(`\n💥 SEARCH RESULTS SCRAPING FAILED: ${error.message}`);
    return { success: false };
  }
};

// Step 3: Test Individual Job URL
const testIndividualJobUrl = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🎯 STEP 3: TESTING INDIVIDUAL JOB URL SCRAPING');
  console.log('='.repeat(70));
  
  const jobUrl = await askQuestion('📝 Please provide a job URL to test: ');
  
  if (!jobUrl) {
    console.log('❌ No URL provided, skipping individual job test');
    return { success: false };
  }
  
  try {
    console.log(`\n🔍 Testing individual job scraping: ${jobUrl.substring(0, 80)}...`);
    
    const startTime = Date.now();
    const jobData = await Promise.race([
      scrapeJobDetails(jobUrl),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 20 seconds')), 20000))
    ]);
    const endTime = Date.now();
    
    if (jobData && jobData.title) {
      console.log('\n✅ INDIVIDUAL JOB SCRAPING SUCCESS:');
      formatJobForDisplay({ ...jobData, url: jobUrl }, 0);
      console.log(`\n⏱️ Scraping time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
      return { success: true, jobData };
    } else {
      console.log('\n❌ INDIVIDUAL JOB SCRAPING FAILED: No job data returned');
      return { success: false };
    }
    
  } catch (error) {
    console.error(`\n💥 INDIVIDUAL JOB SCRAPING FAILED: ${error.message}`);
    return { success: false };
  }
};

// Main test runner
const runValidationTests = async () => {
  console.log('🧪 REFACTORING VALIDATION TEST SUITE');
  console.log('=====================================');
  console.log('Testing functionality after file splits to ensure nothing broke.\n');
  
  try {
    // Step 1: Sample job scraping
    const step1Result = await testSampleJobScraping();
    
    if (!step1Result.success) {
      console.log('\n❌ Step 1 failed. Cannot proceed to search results testing.');
      rl.close();
      return;
    }
    
    console.log('\n✅ Step 1 passed! Sample job scraping is working.');
    
    // Step 2: Search results scraping
    const step2Result = await testSearchResultsScraping();
    
    const continueToStep3 = await askQuestion('\n📝 Did Step 2 pass? Continue to individual job URL test? (y/n): ');
    
    if (continueToStep3.toLowerCase() !== 'y' && continueToStep3.toLowerCase() !== 'yes') {
      console.log('\n⏹️ Testing stopped by user.');
      rl.close();
      return;
    }
    
    // Step 3: Individual job URL
    const step3Result = await testIndividualJobUrl();
    
    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('🎯 VALIDATION TEST COMPLETE');
    console.log('='.repeat(70));
    console.log(`✅ Step 1 (Sample Jobs): ${step1Result.success ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Step 2 (Search Results): ${step2Result.success ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Step 3 (Individual Job): ${step3Result.success ? 'PASSED' : 'FAILED'}`);
    
    const allPassed = step1Result.success && step2Result.success && step3Result.success;
    console.log(`\n🎯 OVERALL RESULT: ${allPassed ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n🚀 Refactoring validation successful! All functionality intact.');
    } else {
      console.log('\n⚠️ Some functionality may need attention after refactoring.');
    }
    
  } catch (error) {
    console.error(`\n💥 VALIDATION TEST SUITE FAILED: ${error.message}`);
  } finally {
    console.log('\n👋 Validation testing finished - exiting...');
    rl.close();
    setTimeout(() => process.exit(0), 1000);
  }
};

// Run the validation tests
runValidationTests();
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Test improved logger functionality
async function testImprovedLogger() {
  console.log('🔧 Testing Improved Logger');
  console.log('=' .repeat(30));
  
  const testJobs = [
    {
      id: 'test-improved-logger-1',
      title: 'Test Job Improved Logger 1',
      company: 'Test Company 1',
      location: 'Melbourne VIC',
      url: 'https://www.seek.com.au/job/59745689'
    }
  ];
  
  const testConfig = {
    selectedJobs: testJobs,
    timestamp: new Date().toISOString()
  };
  
  const configPath = path.join(__dirname, `improved_logger_test_config_${Date.now()}.json`);
  fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const extractionProcess = spawn('node', [
      path.join(__dirname, '../../app/backend/JobDataExtractor.js'),
      configPath
    ], {
      cwd: path.join(__dirname, '../../app/backend'),
      env: {
        ...process.env,
        TEST_NAVIGATION_TIMEOUT: '25000',
        TEST_BROWSER_LAUNCH_TIMEOUT: '30000',
        TEST_CONTENT_WAIT_TIMEOUT: '3000'
      }
    });
    
    let output = '';
    let errorOutput = '';
    let technicalMessages = 0;
    let userFriendlyMessages = 0;
    let loadingEffects = 0;
    
    extractionProcess.stdout.on('data', (data) => {
      output += data.toString();
      
      // Count different types of messages
      if (data.toString().includes('Built URL:') || data.toString().includes('API: POST') || data.toString().includes('Results file not found')) {
        technicalMessages++;
      }
      
      if (data.toString().includes('Processing job') || data.toString().includes('Job data extraction')) {
        userFriendlyMessages++;
      }
      
      if (data.toString().includes('⏳') || data.toString().includes('█') || data.toString().includes('░')) {
        loadingEffects++;
      }
    });
    
    extractionProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    extractionProcess.on('close', (code) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Check for results file
      const resultsPath = configPath.replace('.json', '_results.json');
      let resultsFound = false;
      let extractedJobs = [];
      
      try {
        if (fs.existsSync(resultsPath)) {
          resultsFound = true;
          const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
          extractedJobs = resultsData.extractedJobs || [];
          
          // Clean up results file
          fs.unlinkSync(resultsPath);
        }
      } catch (error) {
        console.error('Error reading results:', error.message);
      }
      
      // Clean up config file
      try {
        fs.unlinkSync(configPath);
      } catch (error) {
        // Ignore cleanup errors
      }
      
      console.log('\n📊 IMPROVED LOGGER TEST RESULTS:');
      console.log('=' .repeat(40));
      console.log(`✅ Success: ${resultsFound && extractedJobs.length > 0}`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📝 Jobs Extracted: ${extractedJobs.length}/${testJobs.length}`);
      console.log(`🔧 Technical Messages: ${technicalMessages}`);
      console.log(`👤 User-Friendly Messages: ${userFriendlyMessages}`);
      console.log(`🎨 Loading Effects: ${loadingEffects}`);
      
      // Test 2: Verify logger improvements
      console.log('\n🧪 Logger Improvement Verification:');
      console.log('-' .repeat(35));
      
      const improvementsVerified = {
        reducedTechnicalMessages: technicalMessages <= 2, // Should have minimal technical messages
        increasedUserFriendlyMessages: userFriendlyMessages > 0,
        loadingEffectsPresent: loadingEffects > 0,
        extractionSuccess: extractedJobs.length > 0,
        overallSuccess: resultsFound && extractedJobs.length > 0
      };
      
      console.log(`🔧 Reduced Technical Messages: ${improvementsVerified.reducedTechnicalMessages ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`👤 User-Friendly Messages: ${improvementsVerified.increasedUserFriendlyMessages ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`🎨 Loading Effects Present: ${improvementsVerified.loadingEffectsPresent ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`📝 Extraction Success: ${improvementsVerified.extractionSuccess ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`🎯 Overall Success: ${improvementsVerified.overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
      
      const allImprovementsWorking = Object.values(improvementsVerified).every(Boolean);
      
      if (allImprovementsWorking) {
        console.log('\n🎉 LOGGER IMPROVEMENTS VERIFIED!');
        console.log('✅ Technical messages filtered out');
        console.log('✅ User-friendly messages increased');
        console.log('✅ Loading effects implemented');
        console.log('✅ Clean and structured output');
        console.log('✅ Terminal effects working');
      } else {
        console.log('\n⚠️  Some logger improvements need attention');
        if (!improvementsVerified.reducedTechnicalMessages) {
          console.log('❌ Technical messages still appearing');
        }
        if (!improvementsVerified.increasedUserFriendlyMessages) {
          console.log('❌ User-friendly messages not increased');
        }
        if (!improvementsVerified.loadingEffectsPresent) {
          console.log('❌ Loading effects not working');
        }
      }
      
      resolve({
        success: allImprovementsWorking,
        duration,
        extractedJobsCount: extractedJobs.length,
        expectedJobsCount: testJobs.length,
        technicalMessages,
        userFriendlyMessages,
        loadingEffects,
        improvementsVerified
      });
    });
    
    // Set overall timeout for the entire process (3 minutes)
    setTimeout(() => {
      extractionProcess.kill('SIGTERM');
      reject(new Error('Improved logger test timed out after 3 minutes'));
    }, 180000);
  });
}

// Run the improved logger test
if (require.main === module) {
  testImprovedLogger()
    .then(result => {
      console.log('\n✅ Improved logger test finished');
      if (result.success) {
        console.log('🎉 LOGGER IMPROVEMENTS WORKING!');
        console.log('✅ Technical messages filtered');
        console.log('✅ User-friendly output achieved');
        console.log('✅ Loading effects implemented');
        console.log('✅ Clean and structured logging');
        process.exit(0);
      } else {
        console.log('❌ Some logger improvements need attention');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Improved logger test failed:', error);
      process.exit(1);
    });
}

module.exports = { testImprovedLogger }; 
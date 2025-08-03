const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Test logger fixes
async function testLoggerFixes() {
  console.log('🔧 Testing Logger Fixes');
  console.log('=' .repeat(30));
  
  const testJobs = [
    {
      id: 'test-logger-fix-1',
      title: 'Test Job Logger Fix 1',
      company: 'Test Company 1',
      location: 'Melbourne VIC',
      url: 'https://www.seek.com.au/job/59745689'
    }
  ];
  
  const testConfig = {
    selectedJobs: testJobs,
    timestamp: new Date().toISOString()
  };
  
  const configPath = path.join(__dirname, `logger_test_config_${Date.now()}.json`);
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
    let resultsFileErrors = 0;
    let excessiveLogging = 0;
    
    extractionProcess.stdout.on('data', (data) => {
      output += data.toString();
      
      // Count excessive logging
      if (data.toString().includes('💾 Saved')) {
        excessiveLogging++;
      }
      
      // Count results file errors
      if (data.toString().includes('Results file not found')) {
        resultsFileErrors++;
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
      
      console.log('\n📊 LOGGER FIX TEST RESULTS:');
      console.log('=' .repeat(35));
      console.log(`✅ Success: ${resultsFound && extractedJobs.length > 0}`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📝 Jobs Extracted: ${extractedJobs.length}/${testJobs.length}`);
      console.log(`📄 Results File Errors: ${resultsFileErrors}`);
      console.log(`🔇 Excessive Logging Count: ${excessiveLogging}`);
      
      const fixesVerified = {
        resultsFileReliability: resultsFileErrors === 0 || resultsFound,
        reducedLogging: excessiveLogging <= 2, // Should have minimal logging
        extractionSuccess: extractedJobs.length > 0,
        overallSuccess: resultsFound && extractedJobs.length > 0
      };
      
      console.log('\n🧪 Fix Verification:');
      console.log(`📄 Results File Reliability: ${fixesVerified.resultsFileReliability ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`🔇 Reduced Logging: ${fixesVerified.reducedLogging ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`📝 Extraction Success: ${fixesVerified.extractionSuccess ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`🎯 Overall Success: ${fixesVerified.overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
      
      const allFixesWorking = Object.values(fixesVerified).every(Boolean);
      
      if (allFixesWorking) {
        console.log('\n🎉 LOGGER FIXES VERIFIED!');
        console.log('✅ Results file errors reduced');
        console.log('✅ Excessive logging reduced');
        console.log('✅ Extraction still works correctly');
      } else {
        console.log('\n⚠️  Some logger fixes may need attention');
      }
      
      resolve({
        success: allFixesWorking,
        duration,
        extractedJobsCount: extractedJobs.length,
        expectedJobsCount: testJobs.length,
        resultsFileErrors,
        excessiveLogging,
        fixesVerified
      });
    });
    
    // Set overall timeout for the entire process (3 minutes)
    setTimeout(() => {
      extractionProcess.kill('SIGTERM');
      reject(new Error('Logger fix test timed out after 3 minutes'));
    }, 180000);
  });
}

// Run the logger fix test
if (require.main === module) {
  testLoggerFixes()
    .then(result => {
      console.log('\n✅ Logger fix test finished');
      if (result.success) {
        console.log('🎉 LOGGER FIXES WORKING!');
        console.log('✅ Results file errors resolved');
        console.log('✅ Excessive logging reduced');
        console.log('✅ System reliability improved');
        process.exit(0);
      } else {
        console.log('❌ Some logger fixes need attention');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Logger fix test failed:', error);
      process.exit(1);
    });
}

module.exports = { testLoggerFixes }; 
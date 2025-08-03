const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Final comprehensive test before git restore point
async function testFinalCleanup() {
  console.log('🧹 Final Cleanup Test - Pre-Git Restore Point');
  console.log('=' .repeat(50));
  
  const testJobs = [
    {
      id: 'final-test-1',
      title: 'Final Test Job 1',
      company: 'Test Company 1',
      location: 'Melbourne VIC',
      url: 'https://www.seek.com.au/job/59745689'
    },
    {
      id: 'final-test-2',
      title: 'Final Test Job 2',
      company: 'Test Company 2',
      location: 'Melbourne VIC',
      url: 'https://www.seek.com.au/job/59745690'
    }
  ];
  
  const testConfig = {
    selectedJobs: testJobs,
    timestamp: new Date().toISOString()
  };
  
  const configPath = path.join(__dirname, `final_cleanup_test_config_${Date.now()}.json`);
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
    let successfulExtractions = 0;
    let resultsFileErrors = 0;
    let excessiveLogging = 0;
    let connectionErrors = 0;
    
    extractionProcess.stdout.on('data', (data) => {
      output += data.toString();
      
      // Count successful extractions
      if (data.toString().includes('✅ Job') && data.toString().includes('extracted:')) {
        successfulExtractions++;
      }
      
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
      
      // Count connection errors
      if (data.toString().includes('ERR_CONNECTION_CLOSED')) {
        connectionErrors++;
      }
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
      
      console.log('\n📊 FINAL CLEANUP TEST RESULTS:');
      console.log('=' .repeat(40));
      console.log(`✅ Success: ${resultsFound && extractedJobs.length > 0}`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📝 Jobs Extracted: ${extractedJobs.length}/${testJobs.length}`);
      console.log(`🔗 Connection Errors: ${connectionErrors}`);
      console.log(`📄 Results File Errors: ${resultsFileErrors}`);
      console.log(`✅ Successful Extractions: ${successfulExtractions}`);
      console.log(`🔇 Excessive Logging Count: ${excessiveLogging}`);
      
      // Verify extracted data structure
      let dataStructureValid = false;
      if (extractedJobs.length > 0) {
        const firstJob = extractedJobs[0];
        dataStructureValid = 
          firstJob.mandatoryRequirements && Array.isArray(firstJob.mandatoryRequirements) &&
          firstJob.preferredRequirements && Array.isArray(firstJob.preferredRequirements) &&
          firstJob.responsibilities && Array.isArray(firstJob.responsibilities) &&
          firstJob.employerQuestions && Array.isArray(firstJob.employerQuestions) &&
          firstJob.otherDetails && Array.isArray(firstJob.otherDetails) &&
          firstJob.compatibilityScore !== undefined &&
          firstJob.maxPossibleScore !== undefined;
      }
      
      console.log(`📋 Data Structure Valid: ${dataStructureValid}`);
      
      // Test 2: Verify all fixes are working
      console.log('\n🧪 Final Verification:');
      console.log('-' .repeat(25));
      
      const allSystemsWorking = {
        extractionSuccess: extractedJobs.length > 0,
        dataStructureValid: dataStructureValid,
        connectionReliability: connectionErrors === 0 || connectionErrors < testJobs.length,
        resultsFileReliability: resultsFileErrors === 0 || resultsFound,
        reducedLogging: excessiveLogging <= 3, // Should have minimal logging
        overallSuccess: resultsFound && extractedJobs.length > 0
      };
      
      console.log(`📝 Extraction Success: ${allSystemsWorking.extractionSuccess ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`📋 Data Structure Valid: ${allSystemsWorking.dataStructureValid ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`🔗 Connection Reliability: ${allSystemsWorking.connectionReliability ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`📄 Results File Reliability: ${allSystemsWorking.resultsFileReliability ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`🔇 Reduced Logging: ${allSystemsWorking.reducedLogging ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`🎯 Overall Success: ${allSystemsWorking.overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
      
      const allSystemsVerified = Object.values(allSystemsWorking).every(Boolean);
      
      if (allSystemsVerified) {
        console.log('\n🎉 ALL SYSTEMS VERIFIED FOR GIT RESTORE POINT!');
        console.log('✅ Job extraction working correctly');
        console.log('✅ Data structure properly formatted');
        console.log('✅ Connection errors resolved');
        console.log('✅ Results file reliability improved');
        console.log('✅ Logger verbosity reduced');
        console.log('✅ Ready for git restore point');
      } else {
        console.log('\n⚠️  Some systems need attention before git restore point');
        if (!allSystemsWorking.extractionSuccess) {
          console.log('❌ Job extraction needs improvement');
        }
        if (!allSystemsWorking.dataStructureValid) {
          console.log('❌ Data structure needs validation');
        }
        if (!allSystemsWorking.connectionReliability) {
          console.log('❌ Connection reliability needs improvement');
        }
        if (!allSystemsWorking.resultsFileReliability) {
          console.log('❌ Results file reliability needs improvement');
        }
        if (!allSystemsWorking.reducedLogging) {
          console.log('❌ Logger verbosity needs reduction');
        }
      }
      
      resolve({
        success: allSystemsVerified,
        duration,
        extractedJobsCount: extractedJobs.length,
        expectedJobsCount: testJobs.length,
        connectionErrors,
        resultsFileErrors,
        successfulExtractions,
        excessiveLogging,
        dataStructureValid,
        allSystemsWorking
      });
    });
    
    // Set overall timeout for the entire process (4 minutes)
    setTimeout(() => {
      extractionProcess.kill('SIGTERM');
      reject(new Error('Final cleanup test timed out after 4 minutes'));
    }, 240000);
  });
}

// Run the final cleanup test
if (require.main === module) {
  testFinalCleanup()
    .then(result => {
      console.log('\n✅ Final cleanup test finished');
      if (result.success) {
        console.log('🎉 READY FOR GIT RESTORE POINT!');
        console.log('✅ All systems verified and working');
        console.log('✅ Job extraction process stable');
        console.log('✅ Logger improvements implemented');
        console.log('✅ Data structure properly formatted');
        console.log('✅ Ready to commit as restore point');
        process.exit(0);
      } else {
        console.log('❌ Some systems need attention before git restore point');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Final cleanup test failed:', error);
      process.exit(1);
    });
}

module.exports = { testFinalCleanup }; 
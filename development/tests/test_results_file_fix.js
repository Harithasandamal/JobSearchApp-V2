const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Test the results file fix
async function testResultsFileFix() {
  console.log('🔧 Testing Results File Fix');
  console.log('=' .repeat(40));
  
  const testJob = {
    id: 'test-results-fix',
    title: 'Test Job for Results Fix',
    company: 'Test Company',
    location: 'Melbourne VIC',
    url: 'https://www.seek.com.au/job/59745689'
  };
  
  const testConfig = {
    selectedJobs: [testJob],
    timestamp: new Date().toISOString()
  };
  
  const configPath = path.join(__dirname, `results_test_config_${Date.now()}.json`);
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
    let resultsFileCreated = false;
    let resultsFileReadable = false;
    
    extractionProcess.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data.toString());
    });
    
    extractionProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data.toString());
    });
    
    extractionProcess.on('close', (code) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Check for results file
      const resultsPath = configPath.replace('.json', '_results.json');
      let success = false;
      let extractedJobs = [];
      
      try {
        if (fs.existsSync(resultsPath)) {
          resultsFileCreated = true;
          console.log('✅ Results file was created');
          
          const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
          extractedJobs = resultsData.extractedJobs || [];
          
          if (extractedJobs.length > 0 && extractedJobs[0].mandatoryRequirements?.length > 0) {
            resultsFileReadable = true;
            success = true;
            console.log('✅ Results file is readable and contains valid data');
          } else {
            console.log('❌ Results file exists but contains invalid data');
          }
          
          // Clean up results file
          fs.unlinkSync(resultsPath);
        } else {
          console.log('❌ Results file was not created');
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
      
      console.log('\n📊 RESULTS FILE TEST RESULTS:');
      console.log('=' .repeat(35));
      console.log(`✅ Success: ${success}`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📝 Jobs Extracted: ${extractedJobs.length}`);
      console.log(`📄 Results File Created: ${resultsFileCreated}`);
      console.log(`📖 Results File Readable: ${resultsFileReadable}`);
      console.log(`❌ Has Errors: ${errorOutput.length > 0}`);
      
      if (success) {
        console.log('\n🎉 RESULTS FILE ISSUE RESOLVED!');
        console.log('✅ Results file is created properly');
        console.log('✅ Results file is readable');
        console.log('✅ Extraction data is valid');
      } else {
        console.log('\n⚠️  Results file issue may persist');
        if (!resultsFileCreated) {
          console.log('❌ Results file was not created');
        }
        if (!resultsFileReadable) {
          console.log('❌ Results file is not readable or contains invalid data');
        }
      }
      
      resolve({
        success,
        duration,
        extractedJobsCount: extractedJobs.length,
        resultsFileCreated,
        resultsFileReadable,
        hasErrors: errorOutput.length > 0
      });
    });
    
    // Set overall timeout for the entire process (3 minutes)
    setTimeout(() => {
      extractionProcess.kill('SIGTERM');
      reject(new Error('Results file test timed out after 3 minutes'));
    }, 180000);
  });
}

// Run the results file test
if (require.main === module) {
  testResultsFileFix()
    .then(result => {
      console.log('\n✅ Results file test finished');
      if (result.success) {
        console.log('🎉 RESULTS FILE ISSUE RESOLVED!');
        process.exit(0);
      } else {
        console.log('❌ Results file issue persists');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Results file test failed:', error);
      process.exit(1);
    });
}

module.exports = { testResultsFileFix }; 
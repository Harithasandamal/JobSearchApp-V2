const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Test configurations with different timeout values
const testConfigs = [
  {
    name: 'Fast (10s navigation, 15s total)',
    navigationTimeout: 10000,
    browserLaunchTimeout: 15000,
    contentWaitTimeout: 500
  },
  {
    name: 'Balanced (15s navigation, 20s total)',
    navigationTimeout: 15000,
    browserLaunchTimeout: 20000,
    contentWaitTimeout: 1000
  },
  {
    name: 'Reliable (20s navigation, 25s total)',
    navigationTimeout: 20000,
    browserLaunchTimeout: 25000,
    contentWaitTimeout: 2000
  },
  {
    name: 'Conservative (25s navigation, 30s total)',
    navigationTimeout: 25000,
    browserLaunchTimeout: 30000,
    contentWaitTimeout: 3000
  }
];

// Sample job URLs for testing (using real SEEK URLs)
const testJobUrls = [
  'https://www.seek.com.au/job/59745689',
  'https://www.seek.com.au/job/59745690',
  'https://www.seek.com.au/job/59745691',
  'https://www.seek.com.au/job/59745692',
  'https://www.seek.com.au/job/59745693'
];

// Test job data
const testJobs = testJobUrls.map((url, index) => ({
  id: `test-job-${index + 1}`,
  title: `Test Job ${index + 1}`,
  company: `Test Company ${index + 1}`,
  location: 'Melbourne VIC',
  url: url
}));

async function runExtractionTest(config, jobIndex = 0) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Testing config: ${config.name}`);
    console.log(`📊 Timeouts: Navigation=${config.navigationTimeout}ms, Browser=${config.browserLaunchTimeout}ms, Content=${config.contentWaitTimeout}ms`);
    
    // Create test config file
    const testConfig = {
      selectedJobs: [testJobs[jobIndex]],
      timestamp: new Date().toISOString(),
      testConfig: config
    };
    
    const configPath = path.join(__dirname, `test_extraction_config_${Date.now()}.json`);
    fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));
    
    // Start extraction process
    const startTime = Date.now();
    const extractionProcess = spawn('node', [
      path.join(__dirname, '../../app/backend/JobDataExtractor.js'),
      configPath
    ], {
      cwd: path.join(__dirname, '../../app/backend'),
      env: {
        ...process.env,
        TEST_NAVIGATION_TIMEOUT: config.navigationTimeout.toString(),
        TEST_BROWSER_LAUNCH_TIMEOUT: config.browserLaunchTimeout.toString(),
        TEST_CONTENT_WAIT_TIMEOUT: config.contentWaitTimeout.toString()
      }
    });
    
    let output = '';
    let errorOutput = '';
    
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
          const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
          extractedJobs = results.extractedJobs || [];
          success = extractedJobs.length > 0 && extractedJobs[0].mandatoryRequirements?.length > 0;
          
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
      
      const result = {
        config: config.name,
        success,
        duration,
        exitCode: code,
        hasErrors: errorOutput.length > 0,
        extractedJobsCount: extractedJobs.length,
        hasRequirements: extractedJobs.length > 0 && extractedJobs[0].mandatoryRequirements?.length > 0,
        output,
        errorOutput
      };
      
      resolve(result);
    });
    
    // Set overall timeout for the entire process
    setTimeout(() => {
      extractionProcess.kill('SIGTERM');
      reject(new Error(`Test timed out after ${config.browserLaunchTimeout + 10000}ms`));
    }, config.browserLaunchTimeout + 10000);
  });
}

async function runOptimizationTests() {
  console.log('🚀 Starting Job Extraction Optimization Tests');
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const config of testConfigs) {
    try {
      const result = await runExtractionTest(config, 0);
      results.push(result);
      
      console.log(`\n📊 Test Result for ${config.name}:`);
      console.log(`   ✅ Success: ${result.success}`);
      console.log(`   ⏱️  Duration: ${result.duration}ms`);
      console.log(`   📋 Jobs Extracted: ${result.extractedJobsCount}`);
      console.log(`   📝 Has Requirements: ${result.hasRequirements}`);
      console.log(`   ❌ Has Errors: ${result.hasErrors}`);
      
      // If successful, test with more jobs
      if (result.success) {
        console.log(`\n🔄 Testing with multiple jobs...`);
        const multiJobResult = await runExtractionTest(config, 1);
        results.push(multiJobResult);
        
        console.log(`📊 Multi-job Test Result:`);
        console.log(`   ✅ Success: ${multiJobResult.success}`);
        console.log(`   ⏱️  Duration: ${multiJobResult.duration}ms`);
        console.log(`   📋 Jobs Extracted: ${multiJobResult.extractedJobsCount}`);
      }
      
    } catch (error) {
      console.error(`❌ Test failed for ${config.name}:`, error.message);
      results.push({
        config: config.name,
        success: false,
        duration: 0,
        error: error.message
      });
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Analyze results
  console.log('\n📈 OPTIMIZATION RESULTS');
  console.log('=' .repeat(60));
  
  const successfulConfigs = results.filter(r => r.success);
  const fastestConfig = successfulConfigs.reduce((fastest, current) => 
    current.duration < fastest.duration ? current : fastest, successfulConfigs[0]);
  
  if (fastestConfig) {
    console.log(`🏆 BEST CONFIGURATION: ${fastestConfig.config}`);
    console.log(`   ⏱️  Duration: ${fastestConfig.duration}ms`);
    console.log(`   📋 Jobs Extracted: ${fastestConfig.extractedJobsCount}`);
  }
  
  console.log('\n📊 ALL RESULTS:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.config}: ${result.duration}ms, ${result.extractedJobsCount} jobs`);
  });
  
  return results;
}

// Run the optimization tests
if (require.main === module) {
  runOptimizationTests()
    .then(results => {
      console.log('\n✅ Optimization tests completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Optimization tests failed:', error);
      process.exit(1);
    });
}

module.exports = { runOptimizationTests, testConfigs }; 
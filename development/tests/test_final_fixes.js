const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Test both timeout and layout fixes comprehensively
async function testFinalFixes() {
  console.log('🔧 Testing Final Comprehensive Fixes');
  console.log('=' .repeat(50));
  
  // Test 1: Extraction Timeout Fix with Multiple Jobs
  console.log('\n🧪 Test 1: Extraction Timeout Fix (Multiple Jobs)');
  console.log('-' .repeat(40));
  
  const testJobs = [
    {
      id: 'test-job-1',
      title: 'Test Job 1',
      company: 'Test Company 1',
      location: 'Melbourne VIC',
      url: 'https://www.seek.com.au/job/59745689'
    },
    {
      id: 'test-job-2',
      title: 'Test Job 2',
      company: 'Test Company 2',
      location: 'Melbourne VIC',
      url: 'https://www.seek.com.au/job/59745690'
    }
  ];
  
  const testConfig = {
    selectedJobs: testJobs,
    timestamp: new Date().toISOString()
  };
  
  const configPath = path.join(__dirname, `final_test_config_${Date.now()}.json`);
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
    let timeoutError = false;
    let contentSettingError = false;
    
    extractionProcess.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data.toString());
    });
    
    extractionProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data.toString());
      
      // Check for specific timeout errors
      if (data.toString().includes('Navigation timeout of 30000 ms exceeded')) {
        timeoutError = true;
      }
      if (data.toString().includes('Content setting timeout after 25000ms')) {
        contentSettingError = true;
      }
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
          success = extractedJobs.length === testJobs.length && 
                   extractedJobs.every(job => job.mandatoryRequirements?.length > 0);
          
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
      
      console.log('\n📊 EXTRACTION TEST RESULTS:');
      console.log('=' .repeat(30));
      console.log(`✅ Success: ${success}`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📝 Jobs Extracted: ${extractedJobs.length}/${testJobs.length}`);
      console.log(`❌ Navigation Timeout: ${timeoutError}`);
      console.log(`❌ Content Setting Timeout: ${contentSettingError}`);
      console.log(`❌ Has Errors: ${errorOutput.length > 0}`);
      
      // Test 2: Layout Optimization Verification
      console.log('\n🧪 Test 2: Layout Optimization Verification');
      console.log('-' .repeat(40));
      
      const layoutResults = testLayoutOptimization();
      
      console.log('\n📊 FINAL TEST SUMMARY:');
      console.log('=' .repeat(40));
      console.log(`🔧 Extraction Fix: ${success && !timeoutError && !contentSettingError ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`🎨 Layout Fix: ${layoutResults ? '✅ PASSED' : '❌ FAILED'}`);
      
      const overallSuccess = success && !timeoutError && !contentSettingError && layoutResults;
      
      if (overallSuccess) {
        console.log('\n🎉 ALL FINAL FIXES VERIFIED SUCCESSFULLY!');
        console.log('✅ Content setting timeouts resolved');
        console.log('✅ Table height optimized');
        console.log('✅ Layout spacing optimized');
      } else {
        console.log('\n⚠️  Some issues may need attention');
        if (!success || timeoutError || contentSettingError) {
          console.log('❌ Extraction timeout issue persists');
        }
        if (!layoutResults) {
          console.log('❌ Layout optimization issue persists');
        }
      }
      
      resolve({
        extractionSuccess: success && !timeoutError && !contentSettingError,
        layoutSuccess: layoutResults,
        overallSuccess,
        duration,
        extractedJobsCount: extractedJobs.length,
        expectedJobsCount: testJobs.length,
        hasNavigationTimeout: timeoutError,
        hasContentSettingTimeout: contentSettingError
      });
    });
    
    // Set overall timeout for the entire process (4 minutes)
    setTimeout(() => {
      extractionProcess.kill('SIGTERM');
      reject(new Error('Final test timed out after 4 minutes'));
    }, 240000);
  });
}

// Test layout optimization
function testLayoutOptimization() {
  const results = {
    tableHeightOptimized: false,
    scoredScreenHeightOptimized: false,
    cssMinHeightOptimized: false,
    gapRemoved: false
  };
  
  try {
    // Check JobTable height
    const jobTablePath = path.join(__dirname, '../../src/components/ui/JobTable.jsx');
    const jobTableContent = fs.readFileSync(jobTablePath, 'utf8');
    
    if (jobTableContent.includes('height: \'300px\'')) {
      results.tableHeightOptimized = true;
      console.log('✅ JobTable height: 300px (optimized)');
    } else {
      console.log('❌ JobTable height: not optimized');
    }
    
    // Check ScoredScreen height
    const scoredScreenPath = path.join(__dirname, '../../src/components/ScoredScreen.jsx');
    const scoredScreenContent = fs.readFileSync(scoredScreenPath, 'utf8');
    
    if (scoredScreenContent.includes('height: \'300px\'')) {
      results.scoredScreenHeightOptimized = true;
      console.log('✅ ScoredScreen height: 300px (optimized)');
    } else {
      console.log('❌ ScoredScreen height: not optimized');
    }
    
    // Check CSS min-height
    const cssPath = path.join(__dirname, '../../src/styles/components.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    if (cssContent.includes('min-height: 300px')) {
      results.cssMinHeightOptimized = true;
      console.log('✅ CSS min-height: 300px (optimized)');
    } else {
      console.log('❌ CSS min-height: not optimized');
    }
    
    // Check gap removal
    if (scoredScreenContent.includes('gap: \'0px\'')) {
      results.gapRemoved = true;
      console.log('✅ Container gap: 0px (removed)');
    } else {
      console.log('❌ Container gap: not removed');
    }
    
    const totalChecks = Object.keys(results).length;
    const passedChecks = Object.values(results).filter(Boolean).length;
    
    console.log(`\n📊 Layout Optimization: ${passedChecks}/${totalChecks} passed`);
    
    return passedChecks === totalChecks;
    
  } catch (error) {
    console.error('❌ Error testing layout optimization:', error.message);
    return false;
  }
}

// Run the final comprehensive test
if (require.main === module) {
  testFinalFixes()
    .then(result => {
      console.log('\n✅ Final test finished');
      if (result.overallSuccess) {
        console.log('🎉 ALL ISSUES RESOLVED!');
        console.log('✅ No more timeout errors');
        console.log('✅ Table height optimized for 5 rows');
        console.log('✅ Layout spacing maximized');
        process.exit(0);
      } else {
        console.log('❌ Some issues remain');
        if (result.hasContentSettingTimeout) {
          console.log('❌ Content setting timeout still occurs');
        }
        if (result.hasNavigationTimeout) {
          console.log('❌ Navigation timeout still occurs');
        }
        if (!result.layoutSuccess) {
          console.log('❌ Layout optimization incomplete');
        }
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Final test failed:', error);
      process.exit(1);
    });
}

module.exports = { testFinalFixes, testLayoutOptimization }; 
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Test both extraction and layout fixes
async function testComprehensiveFixes() {
  console.log('🔧 Testing Comprehensive Fixes');
  console.log('=' .repeat(50));
  
  // Test 1: Extraction Timeout Fix
  console.log('\n🧪 Test 1: Extraction Timeout Fix');
  console.log('-' .repeat(30));
  
  const testJob = {
    id: 'test-timeout-fix',
    title: 'Test Job for Timeout Fix',
    company: 'Test Company',
    location: 'Melbourne VIC',
    url: 'https://www.seek.com.au/job/59745689'
  };
  
  const testConfig = {
    selectedJobs: [testJob],
    timestamp: new Date().toISOString()
  };
  
  const configPath = path.join(__dirname, `comprehensive_test_config_${Date.now()}.json`);
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
    
    extractionProcess.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data.toString());
    });
    
    extractionProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data.toString());
      
      // Check for timeout errors
      if (data.toString().includes('Navigation timeout of 30000 ms exceeded')) {
        timeoutError = true;
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
      
      console.log('\n📊 EXTRACTION TEST RESULTS:');
      console.log('=' .repeat(30));
      console.log(`✅ Success: ${success}`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📝 Jobs Extracted: ${extractedJobs.length}`);
      console.log(`❌ Timeout Error: ${timeoutError}`);
      console.log(`❌ Has Errors: ${errorOutput.length > 0}`);
      
      // Test 2: Layout Fix Verification
      console.log('\n🧪 Test 2: Layout Fix Verification');
      console.log('-' .repeat(30));
      
      const layoutResults = testLayoutFixes();
      
      console.log('\n📊 COMPREHENSIVE TEST SUMMARY:');
      console.log('=' .repeat(40));
      console.log(`🔧 Extraction Fix: ${success && !timeoutError ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`🎨 Layout Fix: ${layoutResults ? '✅ PASSED' : '❌ FAILED'}`);
      
      const overallSuccess = success && !timeoutError && layoutResults;
      
      if (overallSuccess) {
        console.log('\n🎉 ALL FIXES VERIFIED SUCCESSFULLY!');
        console.log('✅ Extraction timeouts resolved');
        console.log('✅ Layout spacing optimized');
      } else {
        console.log('\n⚠️  Some fixes may need attention');
        if (!success || timeoutError) {
          console.log('❌ Extraction timeout issue persists');
        }
        if (!layoutResults) {
          console.log('❌ Layout spacing issue persists');
        }
      }
      
      resolve({
        extractionSuccess: success && !timeoutError,
        layoutSuccess: layoutResults,
        overallSuccess,
        duration,
        extractedJobsCount: extractedJobs.length,
        hasTimeoutError: timeoutError
      });
    });
    
    // Set overall timeout for the entire process (3 minutes)
    setTimeout(() => {
      extractionProcess.kill('SIGTERM');
      reject(new Error('Comprehensive test timed out after 3 minutes'));
    }, 180000);
  });
}

// Test layout fixes
function testLayoutFixes() {
  const results = {
    scoredScreenGap: false,
    analysisGridPadding: false,
    analysisGridMargin: false,
    gridMarginBottom: false
  };
  
  try {
    // Check ScoredScreen gap
    const scoredScreenPath = path.join(__dirname, '../../src/components/ScoredScreen.jsx');
    const scoredScreenContent = fs.readFileSync(scoredScreenPath, 'utf8');
    
    if (scoredScreenContent.includes('gap: \'0px\'')) {
      results.scoredScreenGap = true;
      console.log('✅ ScoredScreen gap: 0px (fixed)');
    } else {
      console.log('❌ ScoredScreen gap: not optimized');
    }
    
    // Check AnalysisGrid padding and margins
    const analysisGridPath = path.join(__dirname, '../../src/components/ui/AnalysisGrid.jsx');
    const analysisGridContent = fs.readFileSync(analysisGridPath, 'utf8');
    
    if (analysisGridContent.includes('padding: \'0px\'')) {
      results.analysisGridPadding = true;
      console.log('✅ AnalysisGrid padding: 0px (fixed)');
    } else {
      console.log('❌ AnalysisGrid padding: not optimized');
    }
    
    if (analysisGridContent.includes('margin: \'0px\'')) {
      results.analysisGridMargin = true;
      console.log('✅ AnalysisGrid margin: 0px (fixed)');
    } else {
      console.log('❌ AnalysisGrid margin: not optimized');
    }
    
    if (analysisGridContent.includes('marginBottom: \'0px\'')) {
      results.gridMarginBottom = true;
      console.log('✅ Grid marginBottom: 0px (fixed)');
    } else {
      console.log('❌ Grid marginBottom: not optimized');
    }
    
    const totalChecks = Object.keys(results).length;
    const passedChecks = Object.values(results).filter(Boolean).length;
    
    console.log(`\n📊 Layout Fixes: ${passedChecks}/${totalChecks} passed`);
    
    return passedChecks === totalChecks;
    
  } catch (error) {
    console.error('❌ Error testing layout fixes:', error.message);
    return false;
  }
}

// Run the comprehensive test
if (require.main === module) {
  testComprehensiveFixes()
    .then(result => {
      console.log('\n✅ Comprehensive test finished');
      if (result.overallSuccess) {
        console.log('🎉 ALL ISSUES RESOLVED!');
        process.exit(0);
      } else {
        console.log('❌ Some issues remain');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Comprehensive test failed:', error);
      process.exit(1);
    });
}

module.exports = { testComprehensiveFixes, testLayoutFixes }; 
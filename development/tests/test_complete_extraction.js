const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Real job URLs for comprehensive testing
const realJobUrls = [
  'https://www.seek.com.au/job/59745689',
  'https://www.seek.com.au/job/59745690',
  'https://www.seek.com.au/job/59745691',
  'https://www.seek.com.au/job/59745692',
  'https://www.seek.com.au/job/59745693'
];

// Test job data with real URLs
const testJobs = realJobUrls.map((url, index) => ({
  id: `real-job-${index + 1}`,
  title: `Real Job ${index + 1}`,
  company: `Real Company ${index + 1}`,
  location: 'Melbourne VIC',
  url: url
}));

async function testCompleteExtraction() {
  console.log('🚀 Testing Complete Job Extraction Workflow');
  console.log('=' .repeat(60));
  
  // Create test config with all 5 jobs
  const testConfig = {
    selectedJobs: testJobs,
    timestamp: new Date().toISOString()
  };
  
  const configPath = path.join(__dirname, `complete_extraction_config_${Date.now()}.json`);
  fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));
  
  console.log(`📋 Testing with ${testJobs.length} real job URLs`);
  console.log(`⏱️ Using optimized timeouts: Browser=30s, Navigation=25s, Content=3s`);
  
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
      let analysisResults = {};
      
      try {
        if (fs.existsSync(resultsPath)) {
          const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
          extractedJobs = results.extractedJobs || [];
          
          // Analyze extraction results
          analysisResults = {
            totalJobs: extractedJobs.length,
            jobsWithRequirements: extractedJobs.filter(job => 
              job.mandatoryRequirements?.length > 0 || job.preferredRequirements?.length > 0
            ).length,
            jobsWithQuestions: extractedJobs.filter(job => 
              job.employerQuestions?.length > 0
            ).length,
            jobsWithResponsibilities: extractedJobs.filter(job => 
              job.responsibilities?.length > 0
            ).length,
            jobsWithOtherDetails: extractedJobs.filter(job => 
              job.otherDetails?.length > 0
            ).length,
            averageRequirements: extractedJobs.reduce((sum, job) => 
              sum + (job.mandatoryRequirements?.length || 0) + (job.preferredRequirements?.length || 0), 0
            ) / extractedJobs.length || 0,
            averageResponsibilities: extractedJobs.reduce((sum, job) => 
              sum + (job.responsibilities?.length || 0), 0
            ) / extractedJobs.length || 0
          };
          
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
      
      console.log('\n📊 COMPLETE EXTRACTION RESULTS');
      console.log('=' .repeat(60));
      console.log(`✅ Success: ${success}`);
      console.log(`⏱️  Total Duration: ${duration}ms`);
      console.log(`📋 Jobs Processed: ${testJobs.length}`);
      console.log(`📝 Jobs Extracted: ${extractedJobs.length}`);
      console.log(`❌ Has Errors: ${errorOutput.length > 0}`);
      
      if (extractedJobs.length > 0) {
        console.log('\n📈 EXTRACTION ANALYSIS:');
        console.log(`   📋 Jobs with Requirements: ${analysisResults.jobsWithRequirements}/${extractedJobs.length}`);
        console.log(`   ❓ Jobs with Questions: ${analysisResults.jobsWithQuestions}/${extractedJobs.length}`);
        console.log(`   📝 Jobs with Responsibilities: ${analysisResults.jobsWithResponsibilities}/${extractedJobs.length}`);
        console.log(`   🔍 Jobs with Other Details: ${analysisResults.jobsWithOtherDetails}/${extractedJobs.length}`);
        console.log(`   📊 Avg Requirements per Job: ${analysisResults.averageRequirements.toFixed(1)}`);
        console.log(`   📊 Avg Responsibilities per Job: ${analysisResults.averageResponsibilities.toFixed(1)}`);
        
        // Show sample extracted data
        if (extractedJobs[0]) {
          const sampleJob = extractedJobs[0];
          console.log('\n📋 SAMPLE EXTRACTED DATA:');
          console.log(`   Job: ${sampleJob.title}`);
          console.log(`   Mandatory: ${sampleJob.mandatoryRequirements?.length || 0} items`);
          console.log(`   Preferred: ${sampleJob.preferredRequirements?.length || 0} items`);
          console.log(`   Questions: ${sampleJob.employerQuestions?.length || 0} items`);
          console.log(`   Other: ${sampleJob.otherDetails?.length || 0} items`);
          console.log(`   Responsibilities: ${sampleJob.responsibilities?.length || 0} items`);
        }
      }
      
      const result = {
        success,
        duration,
        exitCode: code,
        hasErrors: errorOutput.length > 0,
        extractedJobsCount: extractedJobs.length,
        expectedJobsCount: testJobs.length,
        analysisResults,
        output,
        errorOutput
      };
      
      resolve(result);
    });
    
    // Set overall timeout for the entire process (5 minutes)
    setTimeout(() => {
      extractionProcess.kill('SIGTERM');
      reject(new Error('Complete extraction test timed out after 5 minutes'));
    }, 300000);
  });
}

// Run the complete extraction test
if (require.main === module) {
  testCompleteExtraction()
    .then(result => {
      console.log('\n✅ Complete extraction test finished');
      if (result.success) {
        console.log('🎉 SUCCESS: All jobs extracted with data!');
        process.exit(0);
      } else {
        console.log('❌ FAILED: Some jobs failed to extract properly');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Complete extraction test failed:', error);
      process.exit(1);
    });
}

module.exports = { testCompleteExtraction }; 
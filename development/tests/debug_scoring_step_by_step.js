// Debug Scoring Step by Step
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Sample job URLs (same as your testing)
const SAMPLE_JOBS = [
  {
    id: 'job-1',
    title: 'Software Engineer',
    company: 'Tech Corp',
    location: 'Melbourne',
    url: 'https://www.seek.com.au/job/85994049'
  },
  {
    id: 'job-2', 
    title: 'Project Manager',
    company: 'Construction Ltd',
    location: 'Sydney',
    url: 'https://www.seek.com.au/job/85994050'
  },
  {
    id: 'job-3',
    title: 'Data Analyst',
    company: 'Finance Inc',
    location: 'Brisbane', 
    url: 'https://www.seek.com.au/job/85994051'
  }
];

async function debugScoringStepByStep() {
  console.log('🔍 DEBUGGING SCORING PROCESS STEP BY STEP\n');
  console.log('='.repeat(80));
  
  // Step 1: Create test config with actual resume
  console.log('\n📝 STEP 1: Creating test configuration...');
  const testConfig = {
    selectedJobs: SAMPLE_JOBS,
    resumeData: {
      content: 'Default uploaded resume content for testing',
      fileName: 'Default Resume.pdf'
    },
    timestamp: new Date().toISOString()
  };
  
  const configPath = path.join(process.cwd(), 'debug_step_config.json');
  fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));
  console.log('✅ Test config created:', configPath);
  console.log(`📊 Jobs to test: ${SAMPLE_JOBS.length}`);
  
  // Step 2: Spawn JobScorer with detailed monitoring
  console.log('\n🤖 STEP 2: Starting JobScorer process...');
  
  const scorerProcess = spawn('node', [
    path.join(process.cwd(), 'app/backend/JobScorer.js'), 
    configPath
  ], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let output = '';
  let step1Completed = false;
  let step2Completed = false;
  let step3Completed = false;
  let step4Completed = false;
  let step5Completed = false;
  let currentJobIndex = 0;
  let totalJobs = SAMPLE_JOBS.length;
  
  console.log('🔍 Monitoring process output...\n');
  
  scorerProcess.stdout.on('data', (data) => {
    const outputStr = data.toString();
    output += outputStr;
    
    // Parse each line for step detection
    const lines = outputStr.split('\n');
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Step 1: URL Access
      if (trimmedLine.includes('Step 1: Downloading job page HTML')) {
        console.log(`\n🌐 STEP 1 - Job ${currentJobIndex + 1}: Accessing URL...`);
        step1Completed = true;
      }
      
      // Step 2: Markdown Creation
      if (trimmedLine.includes('Step 2: Converting HTML to markdown')) {
        console.log(`📄 STEP 2 - Job ${currentJobIndex + 1}: Creating markdown...`);
        step2Completed = true;
      }
      
      // Step 3: ChatGPT Access
      if (trimmedLine.includes('Step 3: Extracting job requirements')) {
        console.log(`🤖 STEP 3 - Job ${currentJobIndex + 1}: ChatGPT accessing markdown...`);
        step3Completed = true;
      }
      
      // Step 4: Creating 5 Lists
      if (trimmedLine.includes('Step 4: Performing semantic matching')) {
        console.log(`📋 STEP 4 - Job ${currentJobIndex + 1}: Creating 5 distinct lists...`);
        step4Completed = true;
      }
      
      // Step 5: Gap Analysis
      if (trimmedLine.includes('Step 5: Calculating compatibility score')) {
        console.log(`🎯 STEP 5 - Job ${currentJobIndex + 1}: Gap analysis and scoring...`);
        step5Completed = true;
      }
      
      // Job completion
      if (trimmedLine.includes('Job scoring completed')) {
        console.log(`✅ JOB ${currentJobIndex + 1} COMPLETED!`);
        currentJobIndex++;
      }
      
      // Process completion
      if (trimmedLine.includes('All jobs processed successfully')) {
        console.log('\n🎉 ALL JOBS COMPLETED SUCCESSFULLY!');
      }
      
      // Error detection
      if (trimmedLine.includes('ERROR') || trimmedLine.includes('Error')) {
        console.log(`❌ ERROR DETECTED: ${trimmedLine}`);
      }
      
      // Timeout detection
      if (trimmedLine.includes('timeout') || trimmedLine.includes('Timeout')) {
        console.log(`⏰ TIMEOUT DETECTED: ${trimmedLine}`);
      }
    });
    
    console.log(`[${new Date().toLocaleTimeString()}] ${outputStr.trim()}`);
  });
  
  scorerProcess.stderr.on('data', (data) => {
    const errorStr = data.toString();
    console.error(`❌ ERROR: ${errorStr.trim()}`);
  });
  
  scorerProcess.on('close', (code) => {
    console.log(`\n🏁 Process completed with code: ${code}`);
    
    if (code === 0) {
      console.log('✅ Process completed successfully!');
      
      // Check for results file
      const resultsPath = configPath.replace('.json', '_results.json');
      if (fs.existsSync(resultsPath)) {
        console.log(`📄 Found results file: ${resultsPath}`);
        try {
          const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
          console.log(`📊 Results: ${resultsData.scoredJobs?.length || 0} jobs scored`);
          
          // Display detailed results for each job
          if (resultsData.scoredJobs && resultsData.scoredJobs.length > 0) {
            console.log('\n📋 DETAILED RESULTS:');
            console.log('='.repeat(80));
            
            resultsData.scoredJobs.forEach((job, index) => {
              console.log(`\n🎯 JOB ${index + 1}: ${job.title} at ${job.company}`);
              console.log(`📊 Compatibility Score: ${job.compatibilityScore}%`);
              
              // Display 5 lists
              console.log('\n📋 5 LISTS CREATED:');
              console.log('1️⃣ Mandatory Requirements:', job.mandatoryRequirements?.length || 0, 'items');
              console.log('2️⃣ Preferred Requirements:', job.preferredRequirements?.length || 0, 'items');
              console.log('3️⃣ Responsibilities:', job.responsibilities?.length || 0, 'items');
              console.log('4️⃣ Employer Questions:', job.employerQuestions?.length || 0, 'items');
              console.log('5️⃣ Gaps (Missing Requirements):', job.gaps?.length || 0, 'items');
              
              // Display gaps with penalty calculation
              if (job.gaps && job.gaps.length > 0) {
                console.log('\n⚠️ GAPS DETECTED:');
                job.gaps.forEach((gap, gapIndex) => {
                  console.log(`   ${gapIndex + 1}. ${gap} (-40 points)`);
                });
                const gapPenalty = job.gaps.length * 40;
                console.log(`   Total gap penalty: -${gapPenalty} points`);
              } else {
                console.log('\n✅ No gaps detected');
              }
              
              // Display sample items from each list
              console.log('\n📝 SAMPLE ITEMS:');
              if (job.mandatoryRequirements?.length > 0) {
                console.log('Mandatory:', job.mandatoryRequirements.slice(0, 2));
              }
              if (job.gaps?.length > 0) {
                console.log('Gaps:', job.gaps.slice(0, 2));
              }
              if (job.employerQuestions?.length > 0) {
                console.log('Employer Questions:', job.employerQuestions.slice(0, 2));
              }
              
              console.log('\n' + '-'.repeat(60));
            });
          }
        } catch (error) {
          console.error('❌ Error reading results:', error.message);
        }
      } else {
        console.log('⚠️ No results file found');
      }
    } else {
      console.log('❌ Process failed');
    }
    
    // Clean up
    try {
      if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
      if (fs.existsSync(resultsPath)) fs.unlinkSync(resultsPath);
    } catch (error) {
      console.error('Error cleaning up test files:', error.message);
    }
  });
  
  // Monitor for hanging - check every 30 seconds
  const monitorInterval = setInterval(() => {
    console.log(`⏰ [${new Date().toLocaleTimeString()}] Monitoring - Process still running...`);
  }, 30000);
  
  // Overall timeout - 10 minutes
  setTimeout(() => {
    console.log('⏰ Overall timeout reached, killing process...');
    scorerProcess.kill('SIGTERM');
    clearInterval(monitorInterval);
  }, 600000); // 10 minutes
}

// Run debug
debugScoringStepByStep().catch(console.error); 
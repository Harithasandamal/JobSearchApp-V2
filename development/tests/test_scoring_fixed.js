// Test Scoring with Fixed Timeout Protection
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 TESTING SCORING WITH FIXED TIMEOUT PROTECTION\n');

// Create a simple test config
const testConfig = {
  selectedJobs: [
    {
      id: 'test-job-1',
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'Melbourne',
      url: 'https://www.seek.com.au/job/85994049'
    }
  ],
  resumeData: {
    content: 'Test resume with software development experience and programming skills.',
    fileName: 'Test Resume.pdf'
  },
  timestamp: new Date().toISOString()
};

// Write test config
const configPath = path.join(process.cwd(), 'test_fixed_config.json');
fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

console.log('📝 Created test config with 1 job');
console.log('🔗 Job URL:', testConfig.selectedJobs[0].url);

// Spawn JobScorer with timeout protection
console.log('\n🤖 Starting JobScorer with timeout protection...');

const scorerProcess = spawn('node', [
  path.join(process.cwd(), 'app/backend/JobScorer.js'), 
  configPath
], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let hasCompleted = false;

// Overall timeout - 2 minutes
const overallTimeout = setTimeout(() => {
  if (!hasCompleted) {
    console.log('⏰ Overall timeout reached (2 minutes), killing process...');
    scorerProcess.kill('SIGTERM');
  }
}, 120000);

scorerProcess.stdout.on('data', (data) => {
  const outputStr = data.toString();
  output += outputStr;
  console.log(`[${new Date().toLocaleTimeString()}] ${outputStr.trim()}`);
});

scorerProcess.stderr.on('data', (data) => {
  const errorStr = data.toString();
  console.error(`❌ ERROR: ${errorStr.trim()}`);
});

scorerProcess.on('close', (code) => {
  clearTimeout(overallTimeout);
  hasCompleted = true;
  
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
        
        if (resultsData.scoredJobs && resultsData.scoredJobs.length > 0) {
          const job = resultsData.scoredJobs[0];
          console.log('\n📋 JOB RESULTS:');
          console.log(`Title: ${job.title}`);
          console.log(`Company: ${job.company}`);
          console.log(`Score: ${job.compatibilityScore}%`);
          console.log(`Mandatory Requirements: ${job.mandatoryRequirements?.length || 0}`);
          console.log(`Preferred Requirements: ${job.preferredRequirements?.length || 0}`);
          console.log(`Responsibilities: ${job.responsibilities?.length || 0}`);
          console.log(`Employer Questions: ${job.employerQuestions?.length || 0}`);
          console.log(`Gaps: ${job.gaps?.length || 0}`);
          
          if (job.gaps && job.gaps.length > 0) {
            console.log('\n⚠️ GAPS DETECTED:');
            job.gaps.forEach((gap, index) => {
              console.log(`   ${index + 1}. ${gap} (-40 points)`);
            });
          }
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

console.log('⏰ Process started with 2-minute timeout protection...'); 
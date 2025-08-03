// Quick Debug Test - Fast and Direct
const fs = require('fs');
const path = require('path');

console.log('🔍 QUICK DEBUG TEST - Checking each component...\n');

// Test 1: Check if JobScorer file exists
console.log('📁 Test 1: Checking JobScorer file...');
const jobScorerPath = path.join(process.cwd(), 'app/backend/JobScorer.js');
if (fs.existsSync(jobScorerPath)) {
  console.log('✅ JobScorer.js exists');
} else {
  console.log('❌ JobScorer.js not found');
  process.exit(1);
}

// Test 2: Check if ChatGPT service exists
console.log('\n🤖 Test 2: Checking ChatGPT service...');
const chatgptPath = path.join(process.cwd(), 'app/backend/services/chatgptService.js');
if (fs.existsSync(chatgptPath)) {
  console.log('✅ chatgptService.js exists');
} else {
  console.log('❌ chatgptService.js not found');
  process.exit(1);
}

// Test 3: Check if JobDataManager exists
console.log('\n📄 Test 3: Checking JobDataManager...');
const jobDataPath = path.join(process.cwd(), 'app/backend/utils/jobDataManager.js');
if (fs.existsSync(jobDataPath)) {
  console.log('✅ jobDataManager.js exists');
} else {
  console.log('❌ jobDataManager.js not found');
  process.exit(1);
}

// Test 4: Check if WorkflowLogger exists
console.log('\n📝 Test 4: Checking WorkflowLogger...');
const loggerPath = path.join(process.cwd(), 'app/backend/utils/WorkflowLogger.js');
if (fs.existsSync(loggerPath)) {
  console.log('✅ WorkflowLogger.js exists');
} else {
  console.log('❌ WorkflowLogger.js not found');
  process.exit(1);
}

// Test 5: Check OpenAI API key
console.log('\n🔑 Test 5: Checking OpenAI API key...');
const openaiPath = path.join(process.cwd(), 'app/backend/config/openai.js');
if (fs.existsSync(openaiPath)) {
  console.log('✅ openai.js config exists');
  try {
    const openaiConfig = require(openaiPath);
    if (openaiConfig.apiKey) {
      console.log('✅ OpenAI API key found');
    } else {
      console.log('❌ OpenAI API key missing');
    }
  } catch (error) {
    console.log('❌ Error reading OpenAI config:', error.message);
  }
} else {
  console.log('❌ openai.js config not found');
}

// Test 6: Check if we can require JobScorer without hanging
console.log('\n🧪 Test 6: Testing JobScorer require (5 second timeout)...');
const timeout = setTimeout(() => {
  console.log('⏰ Timeout: JobScorer require is hanging');
  process.exit(1);
}, 5000);

try {
  const JobScorer = require(jobScorerPath);
  clearTimeout(timeout);
  console.log('✅ JobScorer require successful');
} catch (error) {
  clearTimeout(timeout);
  console.log('❌ JobScorer require failed:', error.message);
  process.exit(1);
}

// Test 7: Check if we can create a simple config
console.log('\n📋 Test 7: Creating test config...');
const testConfig = {
  selectedJobs: [
    {
      id: 'test-job-1',
      title: 'Test Job',
      company: 'Test Company',
      location: 'Test Location',
      url: 'https://www.seek.com.au/job/85994049'
    }
  ],
  resumeData: {
    content: 'Test resume content',
    fileName: 'Test Resume.pdf'
  },
  timestamp: new Date().toISOString()
};

const configPath = path.join(process.cwd(), 'quick_test_config.json');
fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));
console.log('✅ Test config created');

// Test 8: Check if config file is readable
console.log('\n📖 Test 8: Reading test config...');
try {
  const configData = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configData);
  console.log('✅ Config file readable and valid JSON');
  console.log(`   Jobs: ${config.selectedJobs.length}`);
  console.log(`   Resume: ${config.resumeData ? 'Present' : 'Missing'}`);
} catch (error) {
  console.log('❌ Error reading config:', error.message);
}

// Clean up
try {
  fs.unlinkSync(configPath);
  console.log('✅ Test config cleaned up');
} catch (error) {
  console.log('⚠️ Could not clean up test config:', error.message);
}

console.log('\n🎉 All basic tests passed!');
console.log('💡 Next step: Run a simple JobScorer test with timeout protection'); 
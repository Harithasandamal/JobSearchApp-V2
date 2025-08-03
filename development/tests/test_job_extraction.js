// Test script for job extraction with real job URL
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Import the required modules
const JobDataManager = require('../../app/backend/utils/jobDataManager');
const ChatGPTService = require('../../app/backend/services/chatgptService');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Initialize services
const jobDataManager = new JobDataManager();
const chatgptService = new ChatGPTService();

async function testJobExtraction() {
  console.log('🧪 Job Extraction Test Script');
  console.log('=============================\n');
  
  try {
    // Get job URL from user
    const jobUrl = await new Promise((resolve) => {
      rl.question('Please enter a SEEK job URL: ', (url) => {
        resolve(url.trim());
      });
    });
    
    if (!jobUrl) {
      console.log('❌ No URL provided. Exiting...');
      rl.close();
      return;
    }
    
    console.log(`\n🔗 Testing extraction for: ${jobUrl}`);
    console.log('⏳ Starting extraction process...\n');
    
    // Generate a unique job ID for testing
    const jobId = `test-job-${Date.now()}`;
    const jobTitle = 'Test Job';
    const jobCompany = 'Test Company';
    
    // Step 1: Download job page HTML
    console.log('📥 Step 1: Downloading job page HTML...');
    const htmlFilePath = await jobDataManager.downloadJobHTML(jobUrl, jobId);
    console.log(`✅ HTML downloaded to: ${htmlFilePath}\n`);
    
    // Step 2: Extract job details and save as markdown
    console.log('📄 Step 2: Converting to markdown...');
    const { markdownPath, jobDescription } = await jobDataManager.extractJobDetailsToMarkdown(
      htmlFilePath, 
      jobId, 
      jobTitle, 
      jobCompany
    );
    console.log(`✅ Markdown created at: ${markdownPath}\n`);
    
    // Step 3: Use ChatGPT to extract 5 lists
    console.log('🤖 Step 3: Extracting data using ChatGPT...');
    const extractedData = await chatgptService.extractJobDataLists(jobDescription);
    console.log('✅ Data extraction completed!\n');
    
         // Display the extracted lists
     console.log('📋 EXTRACTED DATA LISTS');
     console.log('========================\n');
     
     // List 1: Mandatory Requirements (max 3, 20 points each)
     console.log('📋 LIST 1: MANDATORY REQUIREMENTS (max 3, 20 points each)');
     console.log('-----------------------------------------------------------');
     if (extractedData.mandatoryRequirements && extractedData.mandatoryRequirements.length > 0) {
       extractedData.mandatoryRequirements.forEach((item, index) => {
         console.log(`${index + 1}. ${item}`);
       });
     } else {
       console.log('No mandatory requirements found');
     }
     console.log('');
     
     // List 2: Preferred Requirements (max 5, 10 points each)
     console.log('📋 LIST 2: PREFERRED REQUIREMENTS (max 5, 10 points each)');
     console.log('-----------------------------------------------------------');
     if (extractedData.preferredRequirements && extractedData.preferredRequirements.length > 0) {
       extractedData.preferredRequirements.forEach((item, index) => {
         console.log(`${index + 1}. ${item}`);
       });
     } else {
       console.log('No preferred requirements found');
     }
     console.log('');
     
     // List 3: Employer Questions (max 5, 20 points each)
     console.log('📋 LIST 3: EMPLOYER QUESTIONS (max 5, 20 points each)');
     console.log('-----------------------------------------------------------');
     if (extractedData.employerQuestions && extractedData.employerQuestions.length > 0) {
       extractedData.employerQuestions.forEach((item, index) => {
         console.log(`${index + 1}. ${item}`);
       });
     } else {
       console.log('No employer questions found');
     }
     console.log('');
     
     // List 4: Other Details (max 3, 10 points each)
     console.log('📋 LIST 4: OTHER DETAILS (max 3, 10 points each)');
     console.log('-----------------------------------------------------------');
     if (extractedData.otherDetails && extractedData.otherDetails.length > 0) {
       extractedData.otherDetails.forEach((item, index) => {
         console.log(`${index + 1}. ${item}`);
       });
     } else {
       console.log('No other details found');
     }
     console.log('');
     
     // List 5: Job Responsibilities (max 8, display only)
     console.log('📋 LIST 5: JOB RESPONSIBILITIES (max 8, display only)');
     console.log('-----------------------------------------------------------');
     if (extractedData.responsibilities && extractedData.responsibilities.length > 0) {
       extractedData.responsibilities.forEach((item, index) => {
         console.log(`${index + 1}. ${item}`);
       });
     } else {
       console.log('No responsibilities found');
     }
     console.log('');
     
     // Check for distinctness
     console.log('🔍 DISTINCTNESS CHECK');
     console.log('=====================');
     const allItems = [
       ...(extractedData.mandatoryRequirements || []),
       ...(extractedData.preferredRequirements || []),
       ...(extractedData.employerQuestions || []),
       ...(extractedData.otherDetails || []),
       ...(extractedData.responsibilities || [])
     ];
     
     const duplicates = allItems.filter((item, index) => allItems.indexOf(item) !== index);
     if (duplicates.length > 0) {
       console.log('❌ DUPLICATES FOUND:');
       duplicates.forEach(dup => console.log(`   - "${dup}"`));
     } else {
       console.log('✅ All items are distinct - no duplicates found');
     }
     console.log('');
     
     // Summary
     console.log('📊 EXTRACTION SUMMARY');
     console.log('=====================');
     console.log(`Mandatory Requirements: ${extractedData.mandatoryRequirements?.length || 0} items`);
     console.log(`Preferred Requirements: ${extractedData.preferredRequirements?.length || 0} items`);
     console.log(`Employer Questions: ${extractedData.employerQuestions?.length || 0} items`);
     console.log(`Other Details: ${extractedData.otherDetails?.length || 0} items`);
     console.log(`Responsibilities: ${extractedData.responsibilities?.length || 0} items`);
     console.log('');
     
     // Calculate max possible score
     const maxPossibleScore = 
       (extractedData.mandatoryRequirements?.length || 0) * 20 +
       (extractedData.preferredRequirements?.length || 0) * 10 +
       (extractedData.employerQuestions?.length || 0) * 20 +
       (extractedData.otherDetails?.length || 0) * 10;
     
     console.log(`Maximum possible score: ${maxPossibleScore} points`);
     console.log('');
     
     console.log('✅ Job extraction test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during job extraction test:', error.message);
    console.error('Error details:', error);
  } finally {
    rl.close();
  }
}

// Run the test
testJobExtraction(); 
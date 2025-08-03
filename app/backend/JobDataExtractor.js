// JobDataExtractor.js - ChatGPT-based data extraction without resume comparison
const fs = require('fs');
const path = require('path');
const JobDataManager = require('./utils/jobDataManager');
const ChatGPTService = require('./services/chatgptService');
const workflowLogger = require('./utils/WorkflowLogger');

// Get config from command line argument or use default
let config;
if (process.argv[2]) {
  try {
    const configPath = process.argv[2];
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
  } catch (error) {
    console.error('Error reading config file:', error.message);
    process.exit(1);
  }
} else {
  config = {
    selectedJobs: [],
    timestamp: new Date().toISOString()
  };
}

// Initialize services
const jobDataManager = new JobDataManager();
const chatgptService = new ChatGPTService();

// Use unified workflow logger
const log = (msg, type = 'info') => {
  workflowLogger.log(msg, type);
};

/**
 * Extract job data using ChatGPT without resume comparison
 */
const extractJobData = async () => {
  workflowLogger.logScoring('🚀 Starting ChatGPT-based job data extraction workflow...');
  workflowLogger.logScoring(`📋 Processing ${config.selectedJobs.length} selected jobs`);
  
  // Clean job-data directory at session start
  jobDataManager.cleanJobDataDirectory();
  
  try {
    const allResults = [];
    
    for (let i = 0; i < config.selectedJobs.length; i++) {
      const job = config.selectedJobs[i];
      
      try {
        console.log(`📝 Processing job ${i + 1}/${config.selectedJobs.length}: ${job.title}`);
        workflowLogger.logScoring(`📝 Processing job ${i + 1}/${config.selectedJobs.length}: ${job.title}`);
        console.log(`🔗 Job URL: ${job.url}`);
        workflowLogger.logScoring(`🔗 Job URL: ${job.url}`);
        
        // Step 1: Download job page HTML and save locally
        console.log('📥 Step 1: Downloading job page HTML...');
        workflowLogger.logScoring('📥 Step 1: Downloading job page HTML...');
        const htmlFilePath = await jobDataManager.downloadJobHTML(job.url, job.id);
        
        // Step 2: Extract job details and save as markdown
        console.log('📄 Step 2: Converting to markdown...');
        workflowLogger.logScoring('📄 Step 2: Converting to markdown...');
        const { markdownPath, jobDescription } = await jobDataManager.extractJobDetailsToMarkdown(
          htmlFilePath, 
          job.id, 
          job.title, 
          job.company
        );
        
        // Debug: Check if job description was extracted properly
        if (!jobDescription || jobDescription.trim().length < 100) {
          console.error('❌ Job description extraction failed or too short:', jobDescription?.substring(0, 200));
          throw new Error('Job description extraction failed - content too short');
        }
        
        // Step 3: Use ChatGPT to extract 5 lists according to order of importance
        console.log('🤖 Step 3: Extracting data using ChatGPT...');
        workflowLogger.logChatGPT('🤖 Step 3: Extracting data using ChatGPT...');
        
        // Debug: Check if job description is valid
        if (!jobDescription || jobDescription.trim().length < 50) {
          console.error('❌ Job description is too short or empty:', jobDescription?.substring(0, 100));
          throw new Error('Job description is too short or empty for extraction');
        }
        
        const extractedData = await chatgptService.extractJobDataLists(jobDescription);
        
        // Debug: Check if extraction was successful
        if (!extractedData || !extractedData.mandatoryRequirements || extractedData.mandatoryRequirements.length === 0) {
          console.error('❌ ChatGPT extraction returned empty results:', extractedData);
          throw new Error('ChatGPT extraction returned empty results');
        }
        
        // Step 4: Compile extraction results
        console.log('📊 Step 4: Compiling extraction results...');
        workflowLogger.logScoring('📊 Step 4: Compiling extraction results...');
        
                            // Calculate maximum possible score
                    const maxPossibleScore = 
                      (extractedData.mandatoryRequirements?.length || 0) * 20 +
                      (extractedData.preferredRequirements?.length || 0) * 10 +
                      (extractedData.employerQuestions?.length || 0) * 20 +
                      (extractedData.otherDetails?.length || 0) * 10;

                    // Compile final result
                    const result = {
                      // Basic job info
                      id: job.id,
                      title: job.title,
                      company: job.company,
                      location: job.location,
                      url: job.url,
                      postedAgo: job.postedAgo || 'N/A',

                      // Extracted lists (max 3, 5, 5, 3, 8 respectively)
                      mandatoryRequirements: extractedData.mandatoryRequirements || [],
                      preferredRequirements: extractedData.preferredRequirements || [],
                      responsibilities: extractedData.responsibilities || [],
                      employerQuestions: extractedData.employerQuestions || [],
                      otherDetails: extractedData.otherDetails || [],

                      // User interaction data (initialized as empty)
                      checkedMandatory: [],
                      checkedPreferred: [],
                      checkedEmployerQuestions: [],
                      checkedOtherDetails: [],

                      // Compatibility score (starts at 0)
                      compatibilityScore: 0,
                      maxPossibleScore: maxPossibleScore,
                      score: 0, // For backwards compatibility

                      // File paths for reference
                      htmlFilePath,
                      markdownPath,

                      // Metadata
                      timestamp: new Date().toISOString(),
                      extractionMethod: 'chatgpt-data-extraction'
                    };
        
        console.log(`✅ Job ${i + 1} extracted: ${extractedData.mandatoryRequirements.length} mandatory, ${extractedData.preferredRequirements.length} preferred, ${extractedData.responsibilities.length} responsibilities`);
        workflowLogger.logScoring(`✅ Job ${i + 1} extracted successfully`);
        
        allResults.push(result);
        
        // Save intermediate results after each job (improved reliability)
        try {
          const configPath = process.argv[2] || 'default_config.json';
          const resultsPath = configPath.replace('.json', '_results.json');
          const resultsData = { extractedJobs: allResults };
          
          // Ensure directory exists
          const dir = path.dirname(resultsPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          // Write file with atomic operation
          const tempPath = `${resultsPath}.tmp`;
          fs.writeFileSync(tempPath, JSON.stringify(resultsData, null, 2), 'utf8');
          fs.renameSync(tempPath, resultsPath);
          
          // Also save with process ID for better tracking
          const processId = path.basename(configPath, '.json').replace('extraction_config_', '');
          const backupPath = path.join(process.cwd(), `extraction_results_${processId}.json`);
          
          const backupTempPath = `${backupPath}.tmp`;
          fs.writeFileSync(backupTempPath, JSON.stringify(resultsData, null, 2), 'utf8');
          fs.renameSync(backupTempPath, backupPath);
          
        } catch (saveError) {
          console.error('Error saving intermediate results:', saveError);
          workflowLogger.logError('Error saving intermediate results', saveError.message);
        }
        
      } catch (error) {
        workflowLogger.logError(`Error processing job ${i + 1}: ${error.message}`, 'scoring');
        console.error('Error details:', error);
        
                            // Add error result to maintain job order
                    allResults.push({
                      id: job.id,
                      title: job.title,
                      company: job.company,
                      location: job.location,
                      url: job.url,
                      postedAgo: job.postedAgo || 'N/A',
                      error: error.message,
                      compatibilityScore: 0,
                      maxPossibleScore: 0,
                      score: 0,
                      mandatoryRequirements: [],
                      preferredRequirements: [],
                      responsibilities: [],
                      employerQuestions: [],
                      otherDetails: [],
                      checkedMandatory: [],
                      checkedPreferred: [],
                      checkedEmployerQuestions: [],
                      checkedOtherDetails: [],
                      timestamp: new Date().toISOString(),
                      extractionMethod: 'error'
                    });
        
        // Save error results as well
        try {
          const configPath = process.argv[2] || 'default_config.json';
          const resultsPath = configPath.replace('.json', '_results.json');
          const resultsData = { extractedJobs: allResults };
          
          // Ensure directory exists
          const dir = path.dirname(resultsPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          // Write file with atomic operation
          const tempPath = `${resultsPath}.tmp`;
          fs.writeFileSync(tempPath, JSON.stringify(resultsData, null, 2), 'utf8');
          fs.renameSync(tempPath, resultsPath);
          
          
        } catch (saveError) {
          // Silent error handling for error results save
        }
      }
    }
    
    // Save final results with multiple fallbacks
    const configPath = process.argv[2] || 'default_config.json';
    const resultsPath = configPath.replace('.json', '_results.json');
    const resultsData = { extractedJobs: allResults };
    
    // Try multiple save locations for reliability
    const saveLocations = [
      resultsPath,
      path.join(process.cwd(), `extraction_results_${Date.now()}.json`),
      path.join(__dirname, `extraction_results_${Date.now()}.json`)
    ];
    
    let savedSuccessfully = false;
    
    for (const savePath of saveLocations) {
      try {
        // Ensure directory exists
        const dir = path.dirname(savePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write file with atomic operation
        const tempPath = `${savePath}.tmp`;
        fs.writeFileSync(tempPath, JSON.stringify(resultsData, null, 2), 'utf8');
        fs.renameSync(tempPath, savePath);
        
        savedSuccessfully = true;
        break;
        
      } catch (saveError) {
        // Silent error handling for final save
      }
    }
    
    if (!savedSuccessfully) {
      console.error('❌ Failed to save results to any location');
      workflowLogger.logError('Failed to save results to any location', 'All save attempts failed');
    }
    
    console.log('✅ Data extraction workflow completed successfully');
    workflowLogger.logScoring('✅ Data extraction workflow completed successfully');
    
    return allResults;
    
  } catch (error) {
    console.error('❌ Fatal error in data extraction workflow:', error);
    workflowLogger.logError('Fatal error in data extraction workflow', error.message);
    process.exit(1);
  }
};

// Run the extraction if this file is executed directly
if (require.main === module) {
  extractJobData()
    .then(() => {
      console.log('🏁 Job data extraction completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Job data extraction failed:', error);
      process.exit(1);
    });
}

module.exports = { extractJobData }; 
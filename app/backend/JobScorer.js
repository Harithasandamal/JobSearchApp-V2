// Enhanced ChatGPT-based JobScorer.js with improved reliability
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
    resumeData: null,
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
 * Enhanced scoring function with improved reliability
 */
const scoreJobs = async () => {
  workflowLogger.logScoring('🚀 Starting enhanced ChatGPT-based job scoring workflow...');
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
        
        // Step 3: Use ChatGPT to extract 3 lists according to order of importance
        console.log('🤖 Step 3: Extracting requirements using ChatGPT...');
        workflowLogger.logChatGPT('🤖 Step 3: Extracting requirements using ChatGPT...');
        const jobRequirements = await chatgptService.extractJobRequirements(jobDescription);
        
        // Step 4: ChatGPT semantic search for each item in lists a and b against resume
        console.log('🔍 Step 4: Performing semantic matching against resume...');
        workflowLogger.logChatGPT('🔍 Step 4: Performing semantic matching against resume...');
        const resumeContent = config.resumeData?.content || '';
        const matchingResult = await chatgptService.performSemanticMatching(
          jobRequirements.mandatoryRequirements,
          jobRequirements.preferredRequirements,
          resumeContent
        );
        
        // Step 5: Calculate compatibility score with gap penalty
        console.log('📊 Step 5: Calculating compatibility score with gap penalty...');
        workflowLogger.logScoring('📊 Step 5: Calculating compatibility score with gap penalty...');
        const scoreResult = chatgptService.calculateCompatibilityScore(
          matchingResult.mandatoryMatches,
          matchingResult.preferredMatches,
          matchingResult.gaps
        );
        
        // Compile final result
        const result = {
          // Basic job info
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.url,
          postedAgo: job.postedAgo || 'N/A',
          
          // Filtered lists - only show requirements that are found in resume
          mandatoryRequirements: [...new Set(jobRequirements.mandatoryRequirements.filter((_, index) => 
            matchingResult.mandatoryMatches[index] === true
          ))],
          preferredRequirements: [...new Set(jobRequirements.preferredRequirements.filter((_, index) => 
            matchingResult.preferredMatches[index] === true
          ))],
          responsibilities: [...new Set(jobRequirements.responsibilities)],
          employerQuestions: [...new Set(jobRequirements.employerQuestions)],
          
          // Gaps - only mandatory requirements that are missing
          gaps: [...new Set(matchingResult.gaps)],
          
          // Matching results (for debugging)
          mandatoryMatches: matchingResult.mandatoryMatches,
          preferredMatches: matchingResult.preferredMatches,
          matchingDetails: matchingResult.matchingDetails,
          
          // Compatibility score
          compatibilityScore: scoreResult.totalScore,
          score: scoreResult.totalScore, // For backwards compatibility
          scoreBreakdown: {
            mandatoryScore: scoreResult.mandatoryScore,
            preferredScore: scoreResult.preferredScore,
            gapPenalty: scoreResult.gapPenalty,
            gapCount: scoreResult.gapCount,
            mandatoryCount: scoreResult.mandatoryCount,
            preferredCount: scoreResult.preferredCount
          },
          
          // File paths for reference
          htmlFilePath,
          markdownPath,
          
          // Metadata
          timestamp: new Date().toISOString(),
          scoringMethod: 'chatgpt-semantic'
        };
        
        console.log(`✅ Job ${i + 1} scored: ${scoreResult.totalScore} points`);
        workflowLogger.logScoring(`✅ Job ${i + 1} scored: ${scoreResult.totalScore} points`);
        console.log(`   - Mandatory: ${scoreResult.mandatoryCount}/${jobRequirements.mandatoryRequirements.length} (${scoreResult.mandatoryScore} pts)`);
        workflowLogger.logScoring(`   - Mandatory: ${scoreResult.mandatoryCount}/${jobRequirements.mandatoryRequirements.length} (${scoreResult.mandatoryScore} pts)`);
        console.log(`   - Preferred: ${scoreResult.preferredCount}/${jobRequirements.preferredRequirements.length} (${scoreResult.preferredScore} pts)`);
        workflowLogger.logScoring(`   - Preferred: ${scoreResult.preferredCount}/${jobRequirements.preferredRequirements.length} (${scoreResult.preferredScore} pts)`);
        
        allResults.push(result);
        
        // Save intermediate results after each job (improved reliability)
        try {
          const configPath = process.argv[2] || 'default_config.json';
          const resultsPath = configPath.replace('.json', '_results.json');
          const resultsData = { scoredJobs: allResults };
          
          fs.writeFileSync(resultsPath, JSON.stringify(resultsData, null, 2));
          console.log(`💾 Saved intermediate results to ${resultsPath}`);
          workflowLogger.logScoring(`💾 Saved intermediate results to ${resultsPath}`);
          
          // Also save with process ID for better tracking
          const processId = path.basename(configPath, '.json').replace('scoring_config_', '');
          const backupPath = path.join(process.cwd(), `scoring_results_${processId}.json`);
          fs.writeFileSync(backupPath, JSON.stringify(resultsData, null, 2));
          console.log(`💾 Saved backup results to ${backupPath}`);
          
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
          score: 0,
          mandatoryRequirements: [],
          preferredRequirements: [],
          responsibilities: [],
          timestamp: new Date().toISOString(),
          scoringMethod: 'error'
        });
        
        // Save error results as well
        try {
          const configPath = process.argv[2] || 'default_config.json';
          const resultsPath = configPath.replace('.json', '_results.json');
          const resultsData = { scoredJobs: allResults };
          fs.writeFileSync(resultsPath, JSON.stringify(resultsData, null, 2));
        } catch (saveError) {
          console.error('Error saving error results:', saveError);
        }
      }
    }
    
    console.log(`🎉 Scoring workflow completed successfully!`);
    workflowLogger.logScoring(`🎉 Scoring workflow completed successfully!`);
    console.log(`📊 Processed ${allResults.length} jobs total`);
    workflowLogger.logScoring(`📊 Processed ${allResults.length} jobs total`);
    console.log(`✅ Success: ${allResults.filter(job => !job.error).length} jobs`);
    workflowLogger.logScoring(`✅ Success: ${allResults.filter(job => !job.error).length} jobs`);
    console.log(`❌ Errors: ${allResults.filter(job => job.error).length} jobs`);
    workflowLogger.logScoring(`❌ Errors: ${allResults.filter(job => job.error).length} jobs`);
    
    // Final save with all results
    try {
      const configPath = process.argv[2] || 'default_config.json';
      const resultsPath = configPath.replace('.json', '_results.json');
      const finalResultsData = { scoredJobs: allResults };
      
      fs.writeFileSync(resultsPath, JSON.stringify(finalResultsData, null, 2));
      console.log(`💾 Saved final results to ${resultsPath}`);
      workflowLogger.logScoring(`💾 Saved final results to ${resultsPath}`);
      
      // Also save with process ID
      const processId = path.basename(configPath, '.json').replace('scoring_config_', '');
      const backupPath = path.join(process.cwd(), `scoring_results_${processId}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(finalResultsData, null, 2));
      console.log(`💾 Saved final backup results to ${backupPath}`);
      
    } catch (saveError) {
      console.error('Error saving final results:', saveError);
      workflowLogger.logError('Error saving final results', saveError.message);
    }
    
    return allResults;
    
  } catch (error) {
    workflowLogger.logError(`Fatal error in scoring workflow: ${error.message}`, 'scoring');
    console.error('Fatal error details:', error);
    
    // Save error state
    try {
      const configPath = process.argv[2] || 'default_config.json';
      const resultsPath = configPath.replace('.json', '_results.json');
      const errorResultsData = { 
        scoredJobs: [],
        error: error.message,
        timestamp: new Date().toISOString()
      };
      fs.writeFileSync(resultsPath, JSON.stringify(errorResultsData, null, 2));
    } catch (saveError) {
      console.error('Error saving error state:', saveError);
    }
    
    throw error;
  }
};

// Run the scorer if called directly
if (require.main === module) {
  scoreJobs()
    .then(() => {
      console.log('\n🎉 Job scoring completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Job scoring failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  scoreJobs
}; 
// Enhanced ChatGPT-based JobScorer.js with proven techniques
const fs = require('fs');
const path = require('path');
const JobDataManager = require('./utils/jobDataManager');
const EnhancedChatGPTService = require('./services/enhancedChatgptService');
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
const enhancedChatgptService = new EnhancedChatGPTService();

// Use unified workflow logger
const log = (msg, type = 'info') => {
  workflowLogger.log(msg, type);
};

/**
 * Enhanced scoring function with proven techniques from open-source repositories
 */
const scoreJobsEnhanced = async () => {
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
        
        // Step 3: Enhanced job requirements extraction with categorization
        console.log('🤖 Step 3: Enhanced job requirements extraction...');
        workflowLogger.logChatGPT('🤖 Step 3: Enhanced job requirements extraction...');
        const enhancedJobRequirements = await enhancedChatgptService.extractJobRequirements(jobDescription);
        
        // Step 4: Enhanced semantic matching with detailed analysis
        console.log('🔍 Step 4: Enhanced semantic matching against resume...');
        workflowLogger.logChatGPT('🔍 Step 4: Enhanced semantic matching against resume...');
        const resumeContent = config.resumeData?.content || '';
        const enhancedMatchingResult = await enhancedChatgptService.performEnhancedSemanticMatching(
          enhancedJobRequirements.mandatoryRequirements,
          enhancedJobRequirements.preferredRequirements,
          resumeContent
        );
        
        // Step 5: Enhanced compatibility score calculation
        console.log('📊 Step 5: Enhanced compatibility score calculation...');
        workflowLogger.logScoring('📊 Step 5: Enhanced compatibility score calculation...');
        const enhancedScoreResult = enhancedChatgptService.calculateEnhancedCompatibilityScore(
          enhancedMatchingResult.mandatoryMatches,
          enhancedMatchingResult.preferredMatches,
          enhancedMatchingResult.overallAnalysis
        );
        
        // Step 6: Generate personalized recommendations
        console.log('💡 Step 6: Generating personalized recommendations...');
        workflowLogger.logChatGPT('💡 Step 6: Generating personalized recommendations...');
        const recommendations = await enhancedChatgptService.generateRecommendations(
          enhancedJobRequirements,
          enhancedMatchingResult,
          resumeContent
        );
        
        // Compile enhanced final result
        const result = {
          // Basic job info
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.url,
          postedAgo: job.postedAgo || 'N/A',
          
          // Enhanced extracted requirements
          mandatoryRequirements: enhancedJobRequirements.mandatoryRequirements,
          preferredRequirements: enhancedJobRequirements.preferredRequirements,
          responsibilities: enhancedJobRequirements.responsibilities,
          industryContext: enhancedJobRequirements.industryContext,
          seniorityLevel: enhancedJobRequirements.seniorityLevel,
          
          // Enhanced matching results
          mandatoryMatches: enhancedMatchingResult.mandatoryMatches,
          preferredMatches: enhancedMatchingResult.preferredMatches,
          overallAnalysis: enhancedMatchingResult.overallAnalysis,
          
          // Enhanced compatibility score
          compatibilityScore: enhancedScoreResult.totalScore,
          score: enhancedScoreResult.totalScore, // For backwards compatibility
          scoreBreakdown: {
            mandatoryScore: enhancedScoreResult.mandatoryScore,
            preferredScore: enhancedScoreResult.preferredScore,
            mandatoryCount: enhancedScoreResult.mandatoryCount,
            preferredCount: enhancedScoreResult.preferredCount
          },
          detailedScores: enhancedScoreResult.detailedScores,
          
          // Personalized recommendations
          recommendations: recommendations,
          
          // File paths for reference
          htmlFilePath,
          markdownPath,
          
          // Metadata
          timestamp: new Date().toISOString(),
          scoringMethod: 'enhanced-chatgpt-semantic',
          version: '2.0'
        };
        
        console.log(`✅ Job ${i + 1} scored: ${enhancedScoreResult.totalScore}%`);
        workflowLogger.logScoring(`✅ Job ${i + 1} scored: ${enhancedScoreResult.totalScore}%`);
        console.log(`   - Mandatory: ${enhancedScoreResult.mandatoryCount}/${enhancedJobRequirements.mandatoryRequirements.length} (${enhancedScoreResult.mandatoryScore}%)`);
        workflowLogger.logScoring(`   - Mandatory: ${enhancedScoreResult.mandatoryCount}/${enhancedJobRequirements.mandatoryRequirements.length} (${enhancedScoreResult.mandatoryScore}%)`);
        console.log(`   - Preferred: ${enhancedScoreResult.preferredCount}/${enhancedJobRequirements.preferredRequirements.length} (${enhancedScoreResult.preferredScore}%)`);
        workflowLogger.logScoring(`   - Preferred: ${enhancedScoreResult.preferredCount}/${enhancedJobRequirements.preferredRequirements.length} (${enhancedScoreResult.preferredScore}%)`);
        console.log(`   - Industry: ${enhancedJobRequirements.industryContext}`);
        workflowLogger.logScoring(`   - Industry: ${enhancedJobRequirements.industryContext}`);
        console.log(`   - Seniority: ${enhancedJobRequirements.seniorityLevel}`);
        workflowLogger.logScoring(`   - Seniority: ${enhancedJobRequirements.seniorityLevel}`);
        
        allResults.push(result);
        
        // Save intermediate results after each job
        const configPath = process.argv[2] || 'default_config.json';
        const resultsPath = configPath.replace('.json', '_enhanced_results.json');
        fs.writeFileSync(resultsPath, JSON.stringify({ scoredJobs: allResults }, null, 2));
        console.log(`💾 Saved enhanced intermediate results to ${resultsPath}`);
        workflowLogger.logScoring(`💾 Saved enhanced intermediate results to ${resultsPath}`);
        
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
          recommendations: {
            immediateActions: ['Review the error and try again'],
            skillGaps: [],
            resumeImprovements: ['Ensure resume is properly formatted'],
            careerAdvice: ['Consider updating your resume']
          },
          timestamp: new Date().toISOString(),
          scoringMethod: 'error',
          version: '2.0'
        });
      }
    }
    
    console.log(`🎉 Enhanced scoring workflow completed successfully!`);
    workflowLogger.logScoring(`🎉 Enhanced scoring workflow completed successfully!`);
    console.log(`📊 Processed ${allResults.length} jobs total`);
    workflowLogger.logScoring(`📊 Processed ${allResults.length} jobs total`);
    console.log(`✅ Success: ${allResults.filter(job => !job.error).length} jobs`);
    workflowLogger.logScoring(`✅ Success: ${allResults.filter(job => !job.error).length} jobs`);
    console.log(`❌ Errors: ${allResults.filter(job => job.error).length} jobs`);
    workflowLogger.logScoring(`❌ Errors: ${allResults.filter(job => job.error).length} jobs`);
    
    return allResults;
    
  } catch (error) {
    workflowLogger.logError(`Fatal error in enhanced scoring workflow: ${error.message}`, 'scoring');
    console.error('Fatal error details:', error);
    throw error;
  }
};

// Run the enhanced scorer if called directly
if (require.main === module) {
  scoreJobsEnhanced()
    .then(() => {
      console.log('\n🎉 Enhanced job scoring completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Enhanced job scoring failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  scoreJobsEnhanced
}; 
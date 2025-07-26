const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getResultsPath } = require('../utils/urlUtils');
const { flattenJobAnalysis, readFromFile } = require('../utils/dataUtils');

/**
 * Store active scoring processes
 */
const activeScoringProcesses = new Map();

/**
 * Start job scoring process
 * @param {Object} req - Express request object
 * @param {Object} res - Express request object
 */
const startJobScoring = (req, res) => {
      console.log('🤖 ===== SIMPLIFIED SCORING REQUEST RECEIVED =====');
  console.log('🤖 Server received request body:', JSON.stringify(req.body, null, 2));
  
  const { selectedJobs, resumeData } = req.body;
  
  console.log('🤖 Server extracted selectedJobs:', selectedJobs?.length || 0);
  console.log('🤖 Server extracted resumeData:', resumeData ? 'Present' : 'Not provided');

  // Generate unique process ID
  const processId = Date.now().toString();
  
  // Create temporary config file for the scorer
  const config = {
    selectedJobs: selectedJobs,
    resumeData: resumeData || {
      content: 'Default resume content for analysis',
      fileName: 'Default Resume.pdf'
    },
    timestamp: new Date().toISOString()
  };

  console.log('🤖 Server config:', config);

  // Write config to temporary file
  const configPath = path.join(process.cwd(), `scoring_config_${processId}.json`);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  // Spawn the Simplified JobScorer process
  const scorerProcess = spawn('node', [path.join(__dirname, '..', 'SimplifiedJobScorer.js'), configPath], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Store process reference
  activeScoringProcesses.set(processId, {
    process: scorerProcess,
    configPath: configPath,
    status: 'running',
    progress: 0,
    scoredJobs: []
  });

  // Handle process output
  let output = '';

  scorerProcess.stdout.on('data', (data) => {
    const outputStr = data.toString();
    output += outputStr;
    
    console.log(`🤖 Simplified Scorer output: ${outputStr.substring(0, 100)}...`);
    
    // Update progress based on output
    if (outputStr.includes('Processing Job')) {
      const match = outputStr.match(/Processing Job (\d+)\/(\d+)/);
      if (match) {
        const currentJob = parseInt(match[1]);
        const totalJobs = parseInt(match[2]);
        const processInfo = activeScoringProcesses.get(processId);
        if (processInfo) {
          processInfo.progress = Math.round((currentJob / totalJobs) * 100);
        }
      }
    }
    
    // Mark as completed when scoring is done
    if (outputStr.includes('Simplified job scoring completed successfully') || outputStr.includes('Simplified results saved')) {
      const processInfo = activeScoringProcesses.get(processId);
      if (processInfo) {
        processInfo.progress = 100;
        console.log('✅ Simplified scoring completed, marking as finished');
      }
    }
  });

  scorerProcess.stderr.on('data', (data) => {
    console.error(`Resume-Based Scorer Error: ${data}`);
  });

  scorerProcess.on('close', (code) => {
    const processInfo = activeScoringProcesses.get(processId);
    if (processInfo) {
      processInfo.status = code === 0 ? 'completed' : 'failed';
      
      // If completed successfully, try to read results file
      if (code === 0) {
        try {
          const resultsPath = getResultsPath(processId).replace('_results.json', '_simplified_results.json');
          console.log(`📄 Looking for simplified scoring results file: ${resultsPath}`);
          
          if (fs.existsSync(resultsPath)) {
            console.log('📄 Found simplified scoring results file, reading...');
            const resultsData = readFromFile(resultsPath);
            console.log('📄 Simplified scoring results data:', JSON.stringify(resultsData, null, 2).substring(0, 500));
            
            if (resultsData.jobs && Array.isArray(resultsData.jobs)) {
              // Flatten the analysis structure for frontend compatibility
              const flattenedJobs = resultsData.jobs.map(job => flattenSimplifiedJobAnalysis(job));
              processInfo.scoredJobs = flattenedJobs;
              console.log(`✅ Loaded ${flattenedJobs.length} scored jobs from simplified results file`);
              
              // Debug: Log first job's analysis structure
              if (flattenedJobs.length > 0) {
                const firstJob = flattenedJobs[0];
                console.log('🔍 First simplified scored job structure:', {
                  id: firstJob.id,
                  title: firstJob.title,
                  score: firstJob.score,
                  hasEducationAndExperience: !!firstJob.educationAndExperience,
                  hasToolsAndSkills: !!firstJob.toolsAndSkills,
                  hasResponsibilities: !!firstJob.responsibilities,
                  hasDetailedScores: !!firstJob.detailedScores
                });
              }
            } else {
              console.log('⚠️ No jobs array found in simplified scoring results file');
            }
            
            // Clean up results file
            fs.unlinkSync(resultsPath);
            console.log('🗑️ Cleaned up simplified scoring results file');
          } else {
            console.log('⚠️ Simplified scoring results file not found');
          }
        } catch (error) {
          console.error('Error reading simplified scoring results file:', error);
        }
      }
      
      // Clean up config file
      try {
        if (fs.existsSync(processInfo.configPath)) {
          fs.unlinkSync(processInfo.configPath);
          console.log('🗑️ Cleaned up scoring config file');
        }
      } catch (cleanupError) {
        console.error('Error cleaning up scoring config file:', cleanupError);
      }
    }
  });

  // Return process ID immediately
  res.json({ 
    processId: processId,
    message: 'Simplified job scoring process started',
    status: 'running'
  });
};

/**
 * Get scoring process status
 * @param {Object} req - Express request object
 * @param {Object} res - Express request object
 */
const getScoringStatus = (req, res) => {
  const { processId } = req.params;
  
  const processInfo = activeScoringProcesses.get(processId);
  if (!processInfo) {
    return res.status(404).json({ error: 'Scoring process not found' });
  }
  
  res.json({
    processId: processId,
    status: processInfo.status,
    progress: processInfo.progress,
    scoredJobs: processInfo.scoredJobs,
    jobCount: processInfo.scoredJobs.length
  });
};

/**
 * Flatten resume-based job analysis data structure
 * @param {Object} job - Job object with resume-based analysis data
 * @returns {Object} - Flattened job object
 */
const flattenResumeBasedJobAnalysis = (job) => {
  const flattenedJob = {
    ...job,
    score: job.finalScore || 0
  };
  
  // If job has compatibility scores, extract category scores
  if (job.compatibilityScores) {
    const categoryScores = {};
    Object.entries(job.compatibilityScores).forEach(([category, data]) => {
      categoryScores[category] = data.score || 0;
    });
    
    return {
      ...flattenedJob,
      categoryScores,
      resumeAnalysis: job.resumeAnalysis || {},
      jobRequirements: job.jobRequirements || {},
      compatibilityScores: job.compatibilityScores || {},
      // Legacy compatibility - map to old structure
      requiredSkills: job.jobRequirements?.requiredSkills || [],
      preferredExperience: job.jobRequirements?.requiredExperience || [],
      technicalRequirements: job.jobRequirements?.requiredSkills || [],
      softSkills: job.compatibilityScores?.transferrableSkills?.matches || [],
      responsibilities: job.jobRequirements?.otherRequirements || []
    };
  }
  
  return flattenedJob;
};

/**
 * Flatten simplified job analysis data structure
 * @param {Object} job - Job object with simplified analysis data
 * @returns {Object} - Flattened job object
 */
const flattenSimplifiedJobAnalysis = (job) => {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    url: job.url,
    mandatory: job.mandatory || [],
    preferred: job.preferred || [],
    responsibilities: job.responsibilities || [],
    compatibilityScore: job.compatibilityScore || 0,
    mandatoryMatches: job.mandatoryMatches || [],
    preferredMatches: job.preferredMatches || [],
    score: job.compatibilityScore || 0,
    timestamp: job.timestamp
  };
};

/**
 * Flatten advanced job analysis data structure (legacy support)
 * @param {Object} job - Job object with advanced analysis data
 * @returns {Object} - Flattened job object
 */
const flattenAdvancedJobAnalysis = (job) => {
  const flattenedJob = {
    ...job,
    score: job.compatibilityScore || 0
  };
  
  // If job has analysis data, flatten it to top level
  if (job.analysis) {
    return {
      ...flattenedJob,
      requiredSkills: job.analysis.requiredSkills || [],
      preferredExperience: job.analysis.preferredExperience || [],
      technicalRequirements: job.analysis.technicalRequirements || [],
      softSkills: job.analysis.softSkills || [],
      responsibilities: job.analysis.responsibilities || [],
      detailedScores: job.detailedScores || {}
    };
  }
  
  return flattenedJob;
};

module.exports = {
  startJobScoring,
  getScoringStatus,
  activeScoringProcesses
}; 
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getResultsPath } = require('../utils/urlUtils');
const { flattenJobAnalysis, readFromFile } = require('../utils/dataUtils');
const workflowLogger = require('../utils/WorkflowLogger');

/**
 * Store active data extraction processes
 */
const activeExtractionProcesses = new Map();

/**
 * Start job data extraction process
 * @param {Object} req - Express request object
 * @param {Object} res - Express request object
 */
const startJobDataExtraction = (req, res) => {
  console.log('🤖 ===== DATA EXTRACTION REQUEST RECEIVED =====');
  console.log('🤖 Server received request body:', JSON.stringify(req.body, null, 2));
  
  const { selectedJobs } = req.body;
  
  console.log('🤖 Server extracted selectedJobs:', selectedJobs?.length || 0);

  // Generate unique process ID
  const processId = Date.now().toString();
  
  // Create temporary config file for the extractor
  const config = {
    selectedJobs: selectedJobs,
    timestamp: new Date().toISOString()
  };

  console.log('🤖 Server config:', config);

  // Write config to temporary file
  const configPath = path.join(process.cwd(), `extraction_config_${processId}.json`);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  // Spawn the JobDataExtractor process
  const extractorProcess = spawn('node', [path.join(__dirname, '..', 'JobDataExtractor.js'), configPath], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Store process reference
  activeExtractionProcesses.set(processId, {
    process: extractorProcess,
    configPath: configPath,
    status: 'running',
    progress: 0,
    extractedJobs: [],
    startTime: Date.now(),
    lastUpdate: Date.now()
  });

  // Handle process output
  let output = '';
  let currentJobIndex = 0;
  let totalJobs = selectedJobs.length;
  let loadingId = null;

  extractorProcess.stdout.on('data', (data) => {
    const outputStr = data.toString();
    output += outputStr;
    
    const processInfo = activeExtractionProcesses.get(processId);
    if (!processInfo) return;
    
    // Update progress based on specific output patterns
    if (outputStr.includes('Processing job')) {
      const match = outputStr.match(/Processing job (\d+)\/(\d+)/);
      if (match) {
        currentJobIndex = parseInt(match[1]);
        totalJobs = parseInt(match[2]);
        // Calculate progress: each job is equal percentage
        const jobProgress = ((currentJobIndex - 1) * (100 / totalJobs));
        processInfo.progress = Math.min(jobProgress, 100);
        processInfo.lastUpdate = Date.now();
        
        // Start loading effect for first job
        if (currentJobIndex === 1 && !loadingId) {
          loadingId = workflowLogger.startLoading('Job Data Extraction', 'Starting job data extraction...');
        }
        
        // Update loading progress
        if (loadingId) {
          workflowLogger.updateLoading(loadingId, processInfo.progress, `Processing job ${currentJobIndex} of ${totalJobs}`);
        }
      }
    }
    
    // Update progress for individual job steps
    if (outputStr.includes('Step 1: Downloading job page HTML')) {
      const stepProgress = ((currentJobIndex - 1) * (100 / totalJobs)) + (100 / totalJobs / 4);
      processInfo.progress = Math.min(stepProgress, 100);
      processInfo.lastUpdate = Date.now();
      console.log(`📊 Step 1 progress: ${stepProgress}%`);
    }
    
    if (outputStr.includes('Step 2: Converting to markdown')) {
      const stepProgress = ((currentJobIndex - 1) * (100 / totalJobs)) + (100 / totalJobs / 4 * 2);
      processInfo.progress = Math.min(stepProgress, 100);
      processInfo.lastUpdate = Date.now();
      console.log(`📊 Step 2 progress: ${stepProgress}%`);
    }
    
    if (outputStr.includes('Step 3: Extracting data using ChatGPT')) {
      const stepProgress = ((currentJobIndex - 1) * (100 / totalJobs)) + (100 / totalJobs / 4 * 3);
      processInfo.progress = Math.min(stepProgress, 100);
      processInfo.lastUpdate = Date.now();
      console.log(`📊 Step 3 progress: ${stepProgress}%`);
    }
    
    if (outputStr.includes('Step 4: Compiling extraction results')) {
      const stepProgress = ((currentJobIndex - 1) * (100 / totalJobs)) + (100 / totalJobs / 4 * 4);
      processInfo.progress = Math.min(stepProgress, 100);
      processInfo.lastUpdate = Date.now();
      console.log(`📊 Step 4 progress: ${stepProgress}%`);
    }
    
    // Check for job completion
    if (outputStr.includes('✅ Job') && outputStr.includes('extracted:')) {
      const jobProgress = (currentJobIndex * (100 / totalJobs));
      processInfo.progress = Math.min(jobProgress, 100);
      processInfo.lastUpdate = Date.now();
      console.log(`📊 Job ${currentJobIndex} completed: ${jobProgress}%`);
    }
    
    // Mark as completed when extraction is done
    if (outputStr.includes('Data extraction workflow completed successfully')) {
      processInfo.progress = 100;
      processInfo.status = 'completed';
      processInfo.lastUpdate = Date.now();
      
      // End loading with success
      if (loadingId) {
        workflowLogger.endLoading(loadingId, true, 'Job data extraction completed successfully');
      }
    }
    
    // Log only critical errors
    if (outputStr.includes('❌') || outputStr.includes('Error:')) {
      workflowLogger.logError(`Process ${processId} error: ${outputStr.trim()}`);
    }
  });

  extractorProcess.stderr.on('data', (data) => {
    console.error(`Data Extractor Error: ${data}`);
    const processInfo = activeExtractionProcesses.get(processId);
    if (processInfo) {
      processInfo.lastUpdate = Date.now();
    }
  });

  // Add timeout to prevent hanging processes
  const processTimeout = setTimeout(() => {
    const processInfo = activeExtractionProcesses.get(processId);
    if (processInfo && processInfo.status === 'running') {
      console.log(`⚠️ Process ${processId} timed out after 10 minutes, killing...`);
      processInfo.status = 'failed';
      processInfo.progress = 0;
      extractorProcess.kill('SIGTERM');
    }
  }, 600000); // 10 minutes

  extractorProcess.on('close', (code) => {
    clearTimeout(processTimeout); // Clear timeout
    const processInfo = activeExtractionProcesses.get(processId);
    if (processInfo) {
      processInfo.status = code === 0 ? 'completed' : 'failed';
      processInfo.lastUpdate = Date.now();
      
      console.log(`🏁 Process ${processId} completed with code: ${code}`);
      
      // If completed successfully, try to read results file
      if (code === 0) {
        try {
          // Try multiple possible results file paths
          const possiblePaths = [
            getResultsPath(processId),
            path.join(process.cwd(), `extraction_config_${processId}_results.json`),
            path.join(process.cwd(), `extraction_config_${processId.replace('.json', '_results.json')}`)
          ];
          
          let resultsData = null;
          let resultsPath = null;
          
          for (const testPath of possiblePaths) {
            console.log(`📄 Checking for results file: ${testPath}`);
            if (fs.existsSync(testPath)) {
              resultsPath = testPath;
              console.log(`📄 Found extraction results file: ${resultsPath}`);
              resultsData = readFromFile(resultsPath);
              break;
            }
          }
          
          if (resultsData && resultsData.extractedJobs && Array.isArray(resultsData.extractedJobs)) {
            // Flatten the extraction structure for frontend compatibility
            const flattenedJobs = resultsData.extractedJobs.map(job => flattenJobExtraction(job));
            processInfo.extractedJobs = flattenedJobs;
            console.log(`✅ Loaded ${flattenedJobs.length} extracted jobs from results file`);
            
            // Debug: Log first job's extraction structure
            if (flattenedJobs.length > 0) {
              const firstJob = flattenedJobs[0];
              console.log('🔍 First extracted job structure:', {
                id: firstJob.id,
                title: firstJob.title,
                hasMandatoryRequirements: !!firstJob.mandatoryRequirements,
                hasPreferredRequirements: !!firstJob.preferredRequirements,
                hasResponsibilities: !!firstJob.responsibilities,
                hasEmployerQuestions: !!firstJob.employerQuestions,
                hasOtherDetails: !!firstJob.otherDetails
              });
            }
          } else if (resultsData && resultsData.jobs && Array.isArray(resultsData.jobs)) {
            // Fallback for different structure
            const flattenedJobs = resultsData.jobs.map(job => flattenJobExtraction(job));
            processInfo.extractedJobs = flattenedJobs;
            console.log(`✅ Loaded ${flattenedJobs.length} extracted jobs from results file (fallback)`);
          } else {
            console.log('⚠️ No extractedJobs or jobs array found in results file');
            if (resultsData) {
              console.log('📄 Available keys in results file:', Object.keys(resultsData));
            }
          }
          
          // Clean up results file
          if (resultsPath && fs.existsSync(resultsPath)) {
            try {
              fs.unlinkSync(resultsPath);
              console.log('🗑️ Cleaned up extraction results file');
            } catch (cleanupError) {
              console.error('Error cleaning up results file:', cleanupError);
            }
          }
        } catch (error) {
          console.error('Error reading extraction results file:', error);
        }
      } else {
        console.log(`❌ Process ${processId} failed with code: ${code}`);
      }
      
      // Clean up config file
      try {
        if (fs.existsSync(processInfo.configPath)) {
          fs.unlinkSync(processInfo.configPath);
          console.log('🗑️ Cleaned up extraction config file');
        }
      } catch (cleanupError) {
        console.error('Error cleaning up extraction config file:', cleanupError);
      }
    }
  });

  // Return process ID immediately
  res.json({ 
    processId: processId,
    message: 'Job data extraction process started',
    status: 'running'
  });
};

/**
 * Get extraction process status
 * @param {Object} req - Express request object
 * @param {Object} res - Express request object
 */
const getExtractionStatus = (req, res) => {
  const { processId } = req.params;
  
  const processInfo = activeExtractionProcesses.get(processId);
  if (!processInfo) {
    return res.status(404).json({ error: 'Extraction process not found' });
  }
  
  // Check if process has been running too long (timeout after 10 minutes)
  const now = Date.now();
  const timeSinceStart = now - processInfo.startTime;
  const timeSinceLastUpdate = now - processInfo.lastUpdate;
  
  // If process has been running for more than 10 minutes or no update for 5 minutes, mark as failed
  if (timeSinceStart > 600000 || timeSinceLastUpdate > 300000) {
    processInfo.status = 'failed';
    processInfo.progress = 0;
    console.log(`⚠️ Process ${processId} timed out or stalled`);
  }
  
  const response = {
    processId: processId,
    status: processInfo.status,
    progress: processInfo.progress,
    extractedJobs: processInfo.extractedJobs,
    jobCount: processInfo.extractedJobs.length,
    timeSinceStart: Math.round(timeSinceStart / 1000), // seconds
    timeSinceLastUpdate: Math.round(timeSinceLastUpdate / 1000) // seconds
  };
  
  // Only log status changes or errors, not every poll
  if (processInfo.status === 'failed') {
    console.log(`❌ Extraction failed for process ${processId}`);
  } else if (processInfo.status === 'completed') {
    console.log(`✅ Extraction completed for process ${processId} - ${processInfo.extractedJobs.length} jobs`);
  }
  
  res.json(response);
};

/**
 * Flatten job extraction data structure
 * @param {Object} job - Job object with extraction data
 * @returns {Object} - Flattened job object
 */
const flattenJobExtraction = (job) => {
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    url: job.url,
    postedAgo: job.postedAgo || 'N/A',
    
    // Extracted lists
    mandatoryRequirements: job.mandatoryRequirements || [],
    preferredRequirements: job.preferredRequirements || [],
    responsibilities: job.responsibilities || [],
    employerQuestions: job.employerQuestions || [],
    otherDetails: job.otherDetails || [],
    
    // User interaction data (initialized as empty)
    checkedMandatory: job.checkedMandatory || [],
    checkedPreferred: job.checkedPreferred || [],
    checkedEmployerQuestions: job.checkedEmployerQuestions || [],
    checkedOtherDetails: job.checkedOtherDetails || [],
    
            // Compatibility score (starts at 0)
        compatibilityScore: job.compatibilityScore || 0,
        maxPossibleScore: job.maxPossibleScore || 0,
        score: job.compatibilityScore || 0, // For backwards compatibility
    
    // Metadata
    timestamp: job.timestamp || new Date().toISOString(),
    extractionMethod: 'chatgpt-data-extraction'
  };
};

// Legacy compatibility - keep old function names but redirect to new ones
const startJobScoring = startJobDataExtraction;
const getScoringStatus = getExtractionStatus;
const activeScoringProcesses = activeExtractionProcesses;

module.exports = {
  startJobScoring,
  getScoringStatus,
  activeScoringProcesses,
  startJobDataExtraction,
  getExtractionStatus,
  activeExtractionProcesses
}; 
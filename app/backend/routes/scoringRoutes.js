const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Store active scoring processes
const activeScoringProcesses = new Map();

// API endpoint to start job scoring
router.post('/score-jobs', multer().single('resumeFile'), async (req, res) => {
  let selectedJobs, resumeData;
  if (req.is('multipart/form-data')) {
    selectedJobs = JSON.parse(req.body.selectedJobs || '[]');
  } else {
    selectedJobs = req.body.selectedJobs;
    resumeData = req.body.resumeData;
  }

  if (!selectedJobs || !Array.isArray(selectedJobs) || selectedJobs.length === 0) {
    return res.status(400).json({ error: 'No jobs selected for scoring' });
  }
  if (selectedJobs.length > 5) {
    return res.status(400).json({ error: 'You can only score up to 5 jobs at a time.' });
  }

  // Extract resume text if file is uploaded
  if (req.file) {
    const file = req.file;
    let content = '';
    try {
      if (file.mimetype === 'application/pdf') {
        const data = await pdfParse(file.buffer);
        content = data.text;
      } else if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.originalname.endsWith('.docx')
      ) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        content = result.value;
      } else {
        return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or DOCX.' });
      }
    } catch (err) {
      return res.status(500).json({ error: 'Failed to extract resume text.' });
    }
    resumeData = { content, fileName: file.originalname };
  }

  // Generate unique process ID
  const processId = Date.now().toString();
  
  // Create scoring config
  const config = {
    selectedJobs: selectedJobs,
    resumeData: resumeData || null,
    timestamp: new Date().toISOString()
  };
  
  // Write config to temporary file
  const configPath = path.join(__dirname, '../', `scoring_config_${processId}.json`);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  // Spawn the job data extraction process
  const scoringProcess = spawn('node', [path.join(__dirname, '../', 'JobDataExtractor.js'), configPath], {
    cwd: path.join(__dirname, '../'),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Store process reference
  activeScoringProcesses.set(processId, {
    process: scoringProcess,
    configPath: configPath,
    status: 'running',
    progress: 0,
    results: [],
    loggedCompletion: false
  });

  // Handle process output
  let output = '';
  let currentJobIndex = 0;

  scoringProcess.stdout.on('data', (data) => {
    const outputStr = data.toString();
    output += outputStr;
    
    // Parse progress from output (silently)
    if (outputStr.includes('Processing job')) {
      const processInfo = activeScoringProcesses.get(processId);
      if (processInfo) {
        const match = outputStr.match(/Processing job (\d+)\/(\d+)/);
        if (match) {
          currentJobIndex = parseInt(match[1]);
          const totalJobs = parseInt(match[2]);
          // Calculate progress: each job is 25% (4 steps per job)
          const jobProgress = ((currentJobIndex - 1) * 25);
          processInfo.progress = Math.min(100, jobProgress);
        }
      }
    }
    
         // Track individual steps for smoother progress (silently)
     if (outputStr.includes('Step 1: Downloading job page HTML')) {
       const processInfo = activeScoringProcesses.get(processId);
       if (processInfo) {
         const stepProgress = ((currentJobIndex - 1) * 25) + 5; // 5% for step 1
         processInfo.progress = Math.min(100, stepProgress);
       }
     }
     
     if (outputStr.includes('Step 2: Converting to markdown')) {
       const processInfo = activeScoringProcesses.get(processId);
       if (processInfo) {
         const stepProgress = ((currentJobIndex - 1) * 25) + 10; // 10% for step 2
         processInfo.progress = Math.min(100, stepProgress);
       }
     }
     
     if (outputStr.includes('Step 3: Extracting data using ChatGPT')) {
       const processInfo = activeScoringProcesses.get(processId);
       if (processInfo) {
         const stepProgress = ((currentJobIndex - 1) * 25) + 15; // 15% for step 3
         processInfo.progress = Math.min(100, stepProgress);
       }
     }
     
     if (outputStr.includes('Step 4: Compiling extraction results')) {
       const processInfo = activeScoringProcesses.get(processId);
       if (processInfo) {
         const stepProgress = ((currentJobIndex - 1) * 25) + 20; // 20% for step 4
         processInfo.progress = Math.min(100, stepProgress);
       }
     }
     
     // Check for job completion (silently)
     if (outputStr.includes('✅ Job') && outputStr.includes('extracted:')) {
       const processInfo = activeScoringProcesses.get(processId);
       if (processInfo) {
         const jobProgress = (currentJobIndex * 25); // 25% per job
         processInfo.progress = Math.min(100, jobProgress);
       }
     }
     
          // Check for completion
     if (outputStr.includes('Data extraction workflow completed successfully')) {
       const processInfo = activeScoringProcesses.get(processId);
       if (processInfo) {
         processInfo.status = 'completed';
         processInfo.progress = 100;
         
        // Try to read results file immediately first, then with retry mechanism
        const tryReadResults = () => {
          try {
            // Try multiple possible results file locations
            const possiblePaths = [
              processInfo.configPath.replace('.json', '_results.json'),
              path.join(process.cwd(), `extraction_results_${processId}.json`),
              path.join(__dirname, '../', `extraction_results_${processId}.json`),
              path.join(process.cwd(), `extraction_results_${Date.now()}.json`),
              path.join(__dirname, '../', `extraction_results_${Date.now()}.json`)
            ];
            
            let resultsPath = null;
            for (const path of possiblePaths) {
              if (fs.existsSync(path)) {
                resultsPath = path;
                break;
              }
            }
            
            if (resultsPath) {
              const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
              processInfo.results = resultsData;
              // Clean up results file
              try {
                fs.unlinkSync(resultsPath);
              } catch (cleanupError) {
                console.log(`Warning: Could not delete results file ${resultsPath}:`, cleanupError.message);
              }
              console.log(`✅ Results file found and loaded for process ${processId} from ${resultsPath}`);
              return true;
            } else {
              return false;
            }
          } catch (error) {
            console.error('Error reading extraction results:', error);
            return false;
          }
        };
        
        // Try immediate read first
        let resultsFound = tryReadResults();
        
        // If not found immediately, start retry mechanism
        if (!resultsFound) {
          let retryCount = 0;
          const maxRetries = 3; // Reduced retries to avoid excessive logging
          
          const retryReadResults = () => {
            retryCount++;
            if (retryCount <= maxRetries) {
              console.log(`⏳ Results file not found, retrying... (${retryCount}/${maxRetries})`);
              setTimeout(() => {
                if (tryReadResults()) {
                  console.log(`✅ Results file found on retry ${retryCount}`);
                } else if (retryCount < maxRetries) {
                  retryReadResults();
                } else {
                  console.log('❌ Results file not found after all retries');
                }
              }, 1000); // Wait 1 second before retry
            }
          };
          
          retryReadResults();
        }
      }
    }
  });

  scoringProcess.stderr.on('data', (data) => {
    console.error(`Scoring Error: ${data}`);
  });

  scoringProcess.on('close', (code) => {
    const processInfo = activeScoringProcesses.get(processId);
    if (processInfo) {
      processInfo.status = code === 0 ? 'completed' : 'failed';
      
             // If process completed successfully but no results were loaded, try one more time (silently)
       if (code === 0 && !processInfo.results) {
         try {
           // Try multiple possible results file locations
           const possiblePaths = [
             processInfo.configPath.replace('.json', '_results.json'),
             path.join(process.cwd(), `extraction_results_${processId}.json`),
             path.join(__dirname, '../', `extraction_results_${processId}.json`),
             path.join(process.cwd(), `extraction_results_${Date.now()}.json`),
             path.join(__dirname, '../', `extraction_results_${Date.now()}.json`)
           ];
           
           let resultsPath = null;
           for (const path of possiblePaths) {
             if (fs.existsSync(path)) {
               resultsPath = path;
               break;
             }
           }
           
           if (resultsPath) {
             const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
             processInfo.results = resultsData;
             // Clean up results file
             try {
               fs.unlinkSync(resultsPath);
             } catch (cleanupError) {
               // Silent cleanup error
             }
           }
         } catch (error) {
           // Silent error handling in close handler
         }
       }
      
      // Clean up config file
      try {
        fs.unlinkSync(processInfo.configPath);
      } catch (err) {
        console.error('Error deleting scoring config file:', err);
      }
    }
    
    // Remove from active processes after a delay
    setTimeout(() => {
      activeScoringProcesses.delete(processId);
    }, 60000); // Keep for 1 minute
  });

  // Return process ID immediately
  res.json({ 
    processId, 
    message: 'Job data extraction started',
    status: 'running'
  });
});

// API endpoint to get scoring progress and results
router.get('/scoring-status/:processId', (req, res) => {
  const { processId } = req.params;
  const processInfo = activeScoringProcesses.get(processId);
  
  if (!processInfo) {
    return res.status(404).json({ error: 'Scoring process not found' });
  }
  
     // Only log status changes or errors, not every poll
   if (processInfo.status === 'failed') {
     console.log(`❌ Extraction failed for process ${processId}`);
   } else if (processInfo.status === 'completed' && !processInfo.loggedCompletion) {
     console.log(`✅ Extraction completed - ${processInfo.results?.extractedJobs?.length || 0} jobs extracted`);
     processInfo.loggedCompletion = true;
   }
  
  res.json({
    processId,
    status: processInfo.status,
    progress: processInfo.progress,
    extractedJobs: processInfo.results?.extractedJobs || [],
    results: processInfo.results
  });
});

module.exports = router; 
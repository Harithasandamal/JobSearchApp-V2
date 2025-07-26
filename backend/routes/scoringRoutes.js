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

  // Spawn the job scoring process
  const scoringProcess = spawn('node', [path.join(__dirname, '../', 'JobScorer.js'), configPath], {
    cwd: path.join(__dirname, '../'),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Store process reference
  activeScoringProcesses.set(processId, {
    process: scoringProcess,
    configPath: configPath,
    status: 'running',
    progress: 0,
    results: []
  });

  // Handle process output
  let output = '';
  let currentJobIndex = 0;

  scoringProcess.stdout.on('data', (data) => {
    const outputStr = data.toString();
    output += outputStr;
    
    // Parse progress from output
    if (outputStr.includes('Job URL:')) {
      const processInfo = activeScoringProcesses.get(processId);
      if (processInfo) {
        processInfo.progress = Math.min(100, (currentJobIndex / selectedJobs.length) * 100);
        currentJobIndex++;
      }
    }
    
    // Check for completion
    if (outputStr.includes('🎉 Job scoring completed successfully!')) {
      const processInfo = activeScoringProcesses.get(processId);
      if (processInfo) {
        processInfo.status = 'completed';
        processInfo.progress = 100;
        
        // Try to read results file
        try {
          const resultsPath = processInfo.configPath.replace('.json', '_results.json');
          console.log(`🔍 Looking for results file: ${resultsPath}`);
          if (fs.existsSync(resultsPath)) {
            console.log('✅ Found results file, reading...');
            const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
            console.log('📄 Results data structure:', JSON.stringify(resultsData, null, 2).substring(0, 500));
            processInfo.results = resultsData;
            // Clean up results file
            fs.unlinkSync(resultsPath);
            console.log('🗑️ Cleaned up results file');
          } else {
            console.log('❌ Results file not found');
          }
        } catch (error) {
          console.error('Error reading scoring results:', error);
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
    message: 'Job scoring started',
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
  
  // Debug: Log what we're sending back
  console.log(`📤 Sending scoring status for process ${processId}:`, {
    status: processInfo.status,
    progress: processInfo.progress,
    hasResults: !!processInfo.results,
    resultsKeys: processInfo.results ? Object.keys(processInfo.results) : []
  });
  
  res.json({
    processId,
    status: processInfo.status,
    progress: processInfo.progress,
    results: processInfo.results
  });
});

module.exports = router; 
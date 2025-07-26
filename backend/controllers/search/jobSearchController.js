const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const JobUtils = require('../../utils/jobUtils');
const { validateJobUrl } = require('../../utils/urlUtils');
const { createDemoJobs, readFromFile } = require('../../utils/dataUtils');
const { activeProcesses, activeJobDetails } = require('./sharedData');

/**
 * Start job search process
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const startJobSearch = async (req, res) => {
  console.log('🔍 ===== SEARCH REQUEST RECEIVED =====');
  console.log('🔍 Server received request body:', JSON.stringify(req.body, null, 2));
  
  const { keyword, location, distance, postedAgo, testMode } = req.body;
  
  console.log('🔍 Server extracted parameters:');
  console.log('  - keyword:', keyword);
  console.log('  - location:', location);
  console.log('  - distance:', distance);
  console.log('  - postedAgo:', postedAgo);
  console.log('  - testMode:', testMode);

  if (testMode) {
    console.log('🧪 TEST MODE - Simulating search process');
    
    // Generate unique process ID for test mode
    const processId = 'test-mode-' + Date.now();
    activeProcesses.set(processId, {
      status: 'running',
      progress: 0,
      jobs: [],
      configPath: null
    });

    // Simulate async job creation with realistic timing
    setTimeout(async () => {
      try {
        console.log('🧪 TEST MODE - Creating sample jobs...');
        const sampleJobs = createDemoJobs(15, { location: 'Various Locations', keyword });
        
        // Update process with completed jobs
        const processInfo = activeProcesses.get(processId);
        if (processInfo) {
          processInfo.status = 'completed';
          processInfo.progress = 100;
          processInfo.jobs = sampleJobs;
          console.log(`🧪 TEST MODE - Completed with ${sampleJobs.length} sample jobs`);
        }
      } catch (error) {
        console.error('🧪 TEST MODE ERROR:', error);
        const processInfo = activeProcesses.get(processId);
        if (processInfo) {
          processInfo.status = 'failed';
          processInfo.progress = 100;
        }
      }
    }, 6000); // 6 seconds to allow progress simulation to complete

    return res.json({ 
      processId: processId, 
      message: 'Test mode search started', 
      status: 'running' 
    });
  }

  // Generate unique process ID
  const processId = Date.now().toString();
  
  console.log(`🚀 Starting real search process with ID: ${processId}`);
  console.log(`🔍 Search parameters:`, { keyword, location, distance, postedAgo });
  
  // Create temporary config file for the scraper
  const config = {
    site: 'SEEK',
    distance: distance,
    location: location,
    postedAgo: postedAgo,
    keyword: keyword || '',
    maxResults: 20
  };
  
  console.log('🔍 Search config created:', JSON.stringify(config, null, 2));

  // Write config to temporary file in backend directory
  const configPath = path.join(__dirname, '../../', `config_${processId}.json`);
  console.log(`📝 Writing config to: ${configPath}`);
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Config file written successfully`);
  } catch (error) {
    console.error(`❌ Failed to write config file: ${error.message}`);
    return res.status(500).json({ error: `Failed to write config file: ${error.message}` });
  }

  // Check if SeekSearch.cjs exists
  const seekSearchPath = path.join(__dirname, '../../', 'SeekSearch.cjs');
  if (!fs.existsSync(seekSearchPath)) {
    console.error(`❌ SeekSearch.cjs not found at: ${seekSearchPath}`);
    return res.status(500).json({ error: 'SeekSearch.cjs not found' });
  }
  console.log(`✅ SeekSearch.cjs found at: ${seekSearchPath}`);

  // Spawn the SEEK scraper process
  console.log(`🌙 Spawning scraper process...`);
  const scraperProcess = spawn('node', [seekSearchPath, configPath], {
    cwd: path.join(__dirname, '../../'),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  console.log(`🔄 Scraper process spawned with PID: ${scraperProcess.pid}`);

  // Store process reference
  activeProcesses.set(processId, {
    process: scraperProcess,
    configPath: configPath,
    status: 'running',
    progress: 0,
    jobs: []
  });

  // Handle process output
  let output = '';

  scraperProcess.stdout.on('data', (data) => {
    const outputStr = data.toString();
    output += outputStr;
    
    console.log(`🔍 Scraper stdout: ${outputStr.substring(0, 200)}...`);
    
    // Update progress based on output
    if (outputStr.includes('Progress:')) {
      const match = outputStr.match(/Progress:\s*(\d+)%/);
      if (match) {
        const processInfo = activeProcesses.get(processId);
        if (processInfo) {
          processInfo.progress = parseInt(match[1]);
          console.log(`📊 Progress updated to: ${processInfo.progress}%`);
        }
      }
    }

    // Mark as completed when jobs are found
    if (outputStr.includes('Found') && outputStr.includes('jobs')) {
      const match = outputStr.match(/Found (\d+) jobs/);
      if (match) {
        const processInfo = activeProcesses.get(processId);
        if (processInfo) {
          processInfo.progress = 100;
          console.log(`✅ Found ${match[1]} jobs, marking as completed`);
        }
      }
    }
  });

  // Handle stderr output
  scraperProcess.stderr.on('data', (data) => {
    const errorStr = data.toString();
    console.error(`❌ Scraper stderr: ${errorStr}`);
    
    // Update process status on critical errors
    const processInfo = activeProcesses.get(processId);
    if (processInfo && errorStr.includes('Error')) {
      processInfo.status = 'failed';
      processInfo.progress = 100;
    }
  });

  // Handle process errors
  scraperProcess.on('error', (error) => {
    console.error(`❌ Scraper process error: ${error.message}`);
    const processInfo = activeProcesses.get(processId);
    if (processInfo) {
      processInfo.status = 'failed';
      processInfo.progress = 100;
    }
  });

  scraperProcess.on('close', (code) => {
    const processInfo = activeProcesses.get(processId);
    if (processInfo) {
      processInfo.status = code === 0 ? 'completed' : 'failed';
      
      // If completed successfully, try to read results file
      if (code === 0) {
        try {
          const resultsPath = processInfo.configPath.replace('.json', '_results.json');
          console.log(`📄 Looking for results file: ${resultsPath}`);
          
          if (fs.existsSync(resultsPath)) {
            console.log('📄 Found results file, reading...');
            const resultsData = readFromFile(resultsPath);
            console.log('📄 Results data:', JSON.stringify(resultsData, null, 2).substring(0, 500));
            
            if (resultsData.jobs && Array.isArray(resultsData.jobs)) {
              processInfo.jobs = resultsData.jobs;
              activeJobDetails[processId] = resultsData.jobs;
              console.log(`✅ Loaded ${resultsData.jobs.length} jobs from results file`);
              
              // Apply location cleaning to all job results
              processInfo.jobs = processInfo.jobs.map(job => {
                if (job.location && job.location !== 'N/A' && job.location !== 'Unknown Location') {
                  const originalLocation = job.location;
                  // Clean the extracted location using simple rule
                  let cleanedLocation = originalLocation;
                  
                  // Simple rule: Take everything before the comma (if comma exists)
                  if (cleanedLocation.includes(',')) {
                    cleanedLocation = cleanedLocation.split(',')[0].trim();
                  } else if (cleanedLocation.match(/^Melbourne(\s+VIC)?(\s+\d+)?$/i)) {
                    // Only if the entire location is just "Melbourne VIC" or "Melbourne" with no comma
                    cleanedLocation = 'Melbourne';
                  }
                  
                  console.log(`🏘️ Location cleaned: "${originalLocation}" → "${cleanedLocation}"`);
                  
                  return { ...job, location: cleanedLocation };
                }
                return job;
              });
              
              // Update activeJobDetails with cleaned locations too
              activeJobDetails[processId] = processInfo.jobs;
              
              // Debug: Log first few job URLs
              resultsData.jobs.slice(0, 3).forEach((job, index) => {
                console.log(`🔗 Server Job ${index + 1} URL: ${job.url || 'NO URL'}`);
                console.log(`🔗 Server Job ${index + 1} Title: ${job.title || 'NO TITLE'}`);
              });
              
              // Validate and fix URLs if needed
              processInfo.jobs.forEach(job => {
                job.url = validateJobUrl(job.url, job.title);
              });
            } else {
              console.log('⚠️ No jobs array found in results file');
            }
            
            // Clean up results file
            fs.unlinkSync(resultsPath);
            console.log('🗑️ Cleaned up results file');
          } else {
            console.log('⚠️ Results file not found, trying console output parsing...');
            // Fallback to console output parsing if file doesn't exist
            try {
              const lines = output.split('\n');
              let inTable = false;
              let jobIndex = 0;
              
              for (const line of lines) {
                if (line.includes('Job Title') && line.includes('Company') && line.includes('Location')) {
                  inTable = true;
                  continue;
                }
                
                if (inTable && line.trim() && line.includes('│') && 
                    !line.includes('═') && !line.includes('─') && 
                    !line.includes('Job Title') && !line.includes('Company')) {
                  
                  const parts = line.split('│').map(p => p.trim()).filter(p => p);
                  
                  if (parts.length >= 4) {
                    const rawLocation = parts[2] || 'N/A';
                    
                    processInfo.jobs.push({
                      id: jobIndex + 1,
                      title: parts[0] || 'N/A',
                      company: parts[1] || 'N/A', 
                      location: rawLocation,
                      postedAgo: parts[3] || 'N/A'
                    });
                    jobIndex++;
                  }
                }
              }
              console.log(`📋 Parsed ${processInfo.jobs.length} jobs from console output`);
            } catch (parseError) {
              console.error('Error parsing console output:', parseError);
            }
          }
        } catch (error) {
          console.error('Error reading results file:', error);
          
          // SIMPLIFIED: Process any jobs we have with unified utilities
          if (processInfo.jobs.length > 0) {
            processInfo.jobs = JobUtils.processJobs(processInfo.jobs);
          }
        }
        
        // SIMPLIFIED: Process all jobs with unified utilities
        if (processInfo.jobs.length > 0) {
          console.log(`🔄 Processing ${processInfo.jobs.length} jobs with unified JobUtils...`);
          processInfo.jobs = JobUtils.processJobs(processInfo.jobs);
        }
      }
      
      // Clean up config file
      try {
        if (fs.existsSync(processInfo.configPath)) {
          fs.unlinkSync(processInfo.configPath);
          console.log('🗑️ Cleaned up config file');
        }
      } catch (cleanupError) {
        console.error('Error cleaning up config file:', cleanupError);
      }
    }
  });

  // Return process ID immediately
  res.json({ 
    processId: processId,
    message: 'Job search process started',
    status: 'running'
  });
};

module.exports = {
  startJobSearch
}; 
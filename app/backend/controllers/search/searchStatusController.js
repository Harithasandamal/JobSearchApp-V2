const { activeProcesses, activeJobDetails } = require('./sharedData');

/**
 * Get search process status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSearchStatus = (req, res) => {
  const { processId } = req.params;
  
  const processInfo = activeProcesses.get(processId);
  if (!processInfo) {
    return res.status(404).json({ error: 'Process not found' });
  }
  
  // In test mode, if jobs are ready, return completed
  if (processId.startsWith('test-mode-')) {
    if (processInfo.jobs && processInfo.jobs.length > 0) {
      return res.json({
        processId: processId,
        status: 'completed',
        progress: 100,
        jobs: processInfo.jobs,
        jobCount: processInfo.jobs.length
      });
    } else {
      // Realistic step-by-step progress simulation for test mode
      const elapsedTime = Date.now() - parseInt(processId.replace('test-mode-', ''));
      let progress = 0;
      
      // Simulate realistic search stages over 6 seconds
      if (elapsedTime < 500) {
        progress = 5; // Browser initialization
      } else if (elapsedTime < 1000) {
        progress = 15; // Launching browser
      } else if (elapsedTime < 1500) {
        progress = 25; // Navigating to SEEK
      } else if (elapsedTime < 2500) {
        progress = 40; // Page loaded
      } else if (elapsedTime < 4000) {
        progress = 60; // Starting job extraction
      } else if (elapsedTime < 5000) {
        progress = 80; // Job extraction completed
      } else if (elapsedTime < 5500) {
        progress = 90; // Processing results
      } else {
        progress = 95; // Almost done, waiting for completion
      }
      
      return res.json({
        processId: processId,
        status: 'running',
        progress: progress,
        jobs: [],
        jobCount: 0
      });
    }
  }

  res.json({
    processId: processId,
    status: processInfo.status,
    progress: processInfo.progress,
    jobs: processInfo.jobs,
    jobCount: processInfo.jobs.length
  });
};

/**
 * Get job details for a specific process ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getJobDetails = (req, res) => {
  const { processId } = req.params;
  if (!activeJobDetails[processId]) {
    return res.status(404).json({ error: 'No job details found for this processId' });
  }
  res.json({ jobs: activeJobDetails[processId] });
};

module.exports = {
  getSearchStatus,
  getJobDetails
}; 
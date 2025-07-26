const express = require('express');
const searchController = require('../controllers/search');
const fs = require('fs');

const router = express.Router();

// API endpoint to start SEEK job search
router.post('/search-jobs', searchController.startJobSearch);

// API endpoint to get search progress and results
router.get('/search-status/:processId', searchController.getSearchStatus);

// API endpoint to stop a search
router.delete('/search-stop/:processId', (req, res) => {
  const { processId } = req.params;
  const processInfo = searchController.activeProcesses.get(processId);
  
  if (!processInfo) {
    return res.status(404).json({ error: 'Process not found' });
  }

  // Kill the process
  processInfo.process.kill('SIGTERM');
  processInfo.status = 'stopped';
  
  // Clean up
  try {
    fs.unlinkSync(processInfo.configPath);
  } catch (err) {
    console.error('Error deleting config file:', err);
  }
  
  searchController.activeProcesses.delete(processId);
  
  res.json({ message: 'Search stopped' });
});

// API endpoint for test jobs with real metadata
router.get('/test-jobs', searchController.getTestJobs);

// API endpoint to get job details for a specific process ID
router.get('/job-details/:processId', searchController.getJobDetails);

module.exports = router; 
const express = require('express');
const searchController = require('../controllers/search');
const UrlBuilder = require('../scrapers/UrlBuilder');

const router = express.Router();

// URL building endpoint for frontend comparison
router.post('/build-url', (req, res) => {
  try {
    const { keyword, location, distance, postedAgo } = req.body;
    
    console.log('🔗 Building URL for external comparison:', req.body);
    
    const url = UrlBuilder.buildSeekUrl(
      keyword || '',
      location,
      distance,
      postedAgo
    );
    
    console.log('✅ Built URL for comparison:', url);
    res.json({ url });
  } catch (error) {
    console.error('❌ Error building URL:', error);
    res.status(500).json({ error: 'Failed to build URL' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeProcesses: searchController.activeProcesses.size
  });
});

// Legacy health endpoint (keeping for compatibility)
router.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    activeProcesses: searchController.activeProcesses.size
  });
});

// Graceful shutdown endpoint
router.post('/shutdown', (req, res) => {
  res.json({ message: 'Server shutting down...' });
  console.log('Received shutdown request from frontend. Exiting...');
  setTimeout(() => process.exit(0), 500); // Give response time to send
});

module.exports = router; 
/**
 * Enhanced Fast Search Routes - Different approaches for light/dark modes
 */
const express = require('express');
const router = express.Router();
const enhancedFastSearchController = require('../controllers/search/enhancedFastSearchController');

// Start enhanced fast search
router.post('/enhanced-fast-search', async (req, res) => {
  try {
    const { keyword, location, distance, postedAgo, mode = 'dark' } = req.body;
    
    // Validate required parameters
    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }
    
    // Start enhanced fast search
    const result = await enhancedFastSearchController.startEnhancedFastSearch({
      keyword: keyword || '',
      location,
      distance: distance || '25km',
      postedAgo: postedAgo || '7 days',
      mode
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Enhanced fast search route error:', error.message);
    res.status(500).json({ error: 'Failed to start enhanced fast search' });
  }
});

// Get enhanced fast search status
router.get('/enhanced-fast-search-status/:processId', async (req, res) => {
  try {
    const { processId } = req.params;
    const status = enhancedFastSearchController.getSearchStatus(processId);
    res.json(status);
    
  } catch (error) {
    console.error('❌ Enhanced fast search status error:', error.message);
    res.status(500).json({ error: 'Failed to get search status' });
  }
});

// Stop enhanced fast search
router.post('/enhanced-fast-search-stop/:processId', async (req, res) => {
  try {
    const { processId } = req.params;
    enhancedFastSearchController.stopSearch(processId);
    res.json({ message: 'Enhanced fast search stopped' });
    
  } catch (error) {
    console.error('❌ Enhanced fast search stop error:', error.message);
    res.status(500).json({ error: 'Failed to stop enhanced fast search' });
  }
});

// Open search URL externally
router.post('/open-search-url', async (req, res) => {
  try {
    const { keyword, location, distance, postedAgo } = req.body;
    
    // Build the SEEK URL
    const UrlBuilder = require('../../scrapers/UrlBuilder');
    const searchUrl = UrlBuilder.buildSeekUrl(keyword, location, distance, postedAgo);
    
    // Open URL externally
    const { exec } = require('child_process');
    const platform = require('os').platform;
    
    let command;
    if (platform === 'win32') {
      const escapedUrl = searchUrl.replace(/"/g, '\\"');
      command = `start "" "${escapedUrl}"`;
    } else if (platform === 'darwin') {
      command = `open "${searchUrl}"`;
    } else {
      command = `xdg-open "${searchUrl}"`;
    }
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`⚠️ Could not open URL externally: ${error.message}`);
        console.log(`🔗 Search URL: ${searchUrl}`);
      } else {
        console.log(`✅ Opened search URL externally: ${searchUrl}`);
      }
    });
    
    res.json({ success: true, url: searchUrl });
    
  } catch (error) {
    console.error('❌ URL opening error:', error.message);
    res.status(500).json({ error: 'Failed to open URL' });
  }
});

module.exports = router; 
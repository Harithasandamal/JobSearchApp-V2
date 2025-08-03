/**
 * Centralized Sample URLs for Light Mode Testing
 * Loads URLs from config file for easy updates
 */

const fs = require('fs');
const path = require('path');

let SAMPLE_URLS = [];

// Load URLs from config file
const loadSampleUrls = () => {
  try {
    const configPath = path.join(__dirname, '../config/testUrls.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      SAMPLE_URLS = config.sampleUrls || [];
      console.log(`📋 Loaded ${SAMPLE_URLS.length} test URLs from config`);
    } else {
      // Fallback to hardcoded URLs if config doesn't exist
      SAMPLE_URLS = [
        'https://www.seek.com.au/job/85981995?ref=recom-homepage&pos=4&sp=3&origin=jobTitle#sol=941dd2919d55ebc790f6017d3e00d197d7ce28a0',
        'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=f5c442d9c765b69183c0a9f36e76c3773779cff4',
        'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=ac705abd43f8e7aa11c57e26bdd7ef8de3e67313'
      ];
      console.log(`📋 Using fallback test URLs (${SAMPLE_URLS.length})`);
    }
  } catch (error) {
    console.error('❌ Error loading test URLs from config:', error.message);
    // Use fallback URLs
    SAMPLE_URLS = [
      'https://www.seek.com.au/job/85981995?ref=recom-homepage&pos=4&sp=3&origin=jobTitle#sol=941dd2919d55ebc790f6017d3e00d197d7ce28a0',
      'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=f5c442d9c765b69183c0a9f36e76c3773779cff4',
      'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=ac705abd43f8e7aa11c57e26bdd7ef8de3e67313'
    ];
  }
};

// Load URLs on module load
loadSampleUrls();

module.exports = {
  SAMPLE_URLS,
  loadSampleUrls // Export for manual reloading
};
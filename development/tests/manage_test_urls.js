/**
 * Test URL Management Script
 * Helps add, remove, and manage test URLs for light mode
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../app/backend/config/testUrls.json');

/**
 * Load current configuration
 */
const loadConfig = () => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('❌ Error loading config:', error.message);
  }
  
  // Default configuration
  return {
    sampleUrls: [],
    lastUpdated: new Date().toISOString(),
    description: "Test URLs for light mode. Update when URLs expire. No limit on number of URLs.",
    maxUrls: 10,
    recommendedUpdateFrequency: "weekly",
    lightModeConfig: {
      maxJobs: 10,
      enableUnlimitedJobs: true,
      defaultJobLimit: 5
    }
  };
};

/**
 * Save configuration
 */
const saveConfig = (config) => {
  try {
    config.lastUpdated = new Date().toISOString();
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log('✅ Configuration saved successfully');
    return true;
  } catch (error) {
    console.error('❌ Error saving config:', error.message);
    return false;
  }
};

/**
 * Add new test URLs
 */
const addUrls = (urls) => {
  const config = loadConfig();
  
  if (!Array.isArray(urls)) {
    urls = [urls];
  }
  
  // Add new URLs
  urls.forEach(url => {
    if (!config.sampleUrls.includes(url)) {
      config.sampleUrls.push(url);
      console.log(`➕ Added: ${url}`);
    } else {
      console.log(`⚠️ URL already exists: ${url}`);
    }
  });
  
  console.log(`📊 Total URLs: ${config.sampleUrls.length}`);
  return saveConfig(config);
};

/**
 * Remove test URLs
 */
const removeUrls = (urls) => {
  const config = loadConfig();
  
  if (!Array.isArray(urls)) {
    urls = [urls];
  }
  
  // Remove URLs
  urls.forEach(url => {
    const index = config.sampleUrls.indexOf(url);
    if (index > -1) {
      config.sampleUrls.splice(index, 1);
      console.log(`➖ Removed: ${url}`);
    } else {
      console.log(`⚠️ URL not found: ${url}`);
    }
  });
  
  console.log(`📊 Total URLs: ${config.sampleUrls.length}`);
  return saveConfig(config);
};

/**
 * List all test URLs
 */
const listUrls = () => {
  const config = loadConfig();
  
  console.log('\n📋 Current Test URLs:');
  console.log('=' .repeat(50));
  
  config.sampleUrls.forEach((url, index) => {
    console.log(`${index + 1}. ${url}`);
  });
  
  console.log(`\n📊 Total URLs: ${config.sampleUrls.length}`);
  console.log(`⚙️ Light Mode Config:`);
  console.log(`   - Max Jobs: ${config.lightModeConfig?.maxJobs || 'N/A'}`);
  console.log(`   - Unlimited Jobs: ${config.lightModeConfig?.enableUnlimitedJobs || 'N/A'}`);
  console.log(`   - Default Limit: ${config.lightModeConfig?.defaultJobLimit || 'N/A'}`);
  console.log(`📅 Last Updated: ${config.lastUpdated}`);
};

/**
 * Update light mode configuration
 */
const updateLightModeConfig = (maxJobs, enableUnlimitedJobs, defaultJobLimit) => {
  const config = loadConfig();
  
  config.lightModeConfig = {
    maxJobs: maxJobs || config.lightModeConfig?.maxJobs || 10,
    enableUnlimitedJobs: enableUnlimitedJobs !== undefined ? enableUnlimitedJobs : (config.lightModeConfig?.enableUnlimitedJobs || true),
    defaultJobLimit: defaultJobLimit || config.lightModeConfig?.defaultJobLimit || 5
  };
  
  console.log('⚙️ Updated Light Mode Configuration:');
  console.log(`   - Max Jobs: ${config.lightModeConfig.maxJobs}`);
  console.log(`   - Unlimited Jobs: ${config.lightModeConfig.enableUnlimitedJobs}`);
  console.log(`   - Default Limit: ${config.lightModeConfig.defaultJobLimit}`);
  
  return saveConfig(config);
};

/**
 * Clear all test URLs
 */
const clearUrls = () => {
  const config = loadConfig();
  config.sampleUrls = [];
  
  console.log('🗑️ Cleared all test URLs');
  return saveConfig(config);
};

/**
 * Validate URLs
 */
const validateUrls = () => {
  const config = loadConfig();
  
  console.log('\n🔍 Validating Test URLs:');
  console.log('=' .repeat(50));
  
  config.sampleUrls.forEach((url, index) => {
    const isValid = url.includes('seek.com.au/job/') && url.includes('http');
    const status = isValid ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${url}`);
  });
  
  const validCount = config.sampleUrls.filter(url => 
    url.includes('seek.com.au/job/') && url.includes('http')
  ).length;
  
  console.log(`\n📊 Validation Results:`);
  console.log(`   - Valid URLs: ${validCount}/${config.sampleUrls.length}`);
  console.log(`   - Invalid URLs: ${config.sampleUrls.length - validCount}`);
};

// Command line interface
const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'add':
    if (args.length === 0) {
      console.log('❌ Please provide URLs to add');
      console.log('Usage: node manage_test_urls.js add <url1> [url2] [url3]...');
    } else {
      addUrls(args);
    }
    break;
    
  case 'remove':
    if (args.length === 0) {
      console.log('❌ Please provide URLs to remove');
      console.log('Usage: node manage_test_urls.js remove <url1> [url2] [url3]...');
    } else {
      removeUrls(args);
    }
    break;
    
  case 'list':
    listUrls();
    break;
    
  case 'clear':
    clearUrls();
    break;
    
  case 'validate':
    validateUrls();
    break;
    
  case 'config':
    const [maxJobs, unlimited, defaultLimit] = args;
    updateLightModeConfig(
      maxJobs ? parseInt(maxJobs) : undefined,
      unlimited === 'true' ? true : unlimited === 'false' ? false : undefined,
      defaultLimit ? parseInt(defaultLimit) : undefined
    );
    break;
    
  default:
    console.log('🔧 Test URL Management Script');
    console.log('=' .repeat(40));
    console.log('Usage:');
    console.log('  node manage_test_urls.js add <url1> [url2]...     - Add new URLs');
    console.log('  node manage_test_urls.js remove <url1> [url2]...  - Remove URLs');
    console.log('  node manage_test_urls.js list                     - List all URLs');
    console.log('  node manage_test_urls.js clear                    - Clear all URLs');
    console.log('  node manage_test_urls.js validate                 - Validate URLs');
    console.log('  node manage_test_urls.js config [maxJobs] [unlimited] [defaultLimit] - Update config');
    console.log('');
    console.log('Examples:');
    console.log('  node manage_test_urls.js add "https://www.seek.com.au/job/123456"');
    console.log('  node manage_test_urls.js config 15 true 8');
    console.log('  node manage_test_urls.js list');
} 
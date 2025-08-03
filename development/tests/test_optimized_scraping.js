/**
 * Test Script for Optimized Scraping
 * Validates speed, reliability, and provides rollback capability
 */

const fs = require('fs');
const path = require('path');

// Import the optimized scraping controller
const { handleOptimizedSearch } = require('../../app/backend/controllers/search/optimizedScrapingController');

// Test configuration
const TEST_CONFIG = {
  lightMode: {
    keyword: '',
    location: 'Dandenong',
    distance: '5 km',
    postedAgo: '3 days'
  },
  darkMode: {
    keyword: 'administrator',
    location: 'Melbourne',
    distance: '10 km',
    postedAgo: '7 days'
  },
  timeout: 60000, // 60 seconds timeout
  maxJobs: 10,
  lightModeConfig: {
    maxJobs: 10,
    enableUnlimitedJobs: true,
    defaultJobLimit: 5
  }
};

/**
 * Test optimized scraping functionality
 */
const testOptimizedScraping = async () => {
  console.log('🧪 Testing Optimized Scraping Functionality');
  console.log('=' .repeat(50));
  
  const results = {
    lightMode: null,
    darkMode: null,
    errors: [],
    performance: {}
  };
  
  try {
    // Test Light Mode
    console.log('\n🌞 Testing Light Mode...');
    const lightStart = Date.now();
    
    try {
      const lightResult = await testMode('light', TEST_CONFIG.lightMode);
      results.lightMode = lightResult;
      results.performance.lightMode = Date.now() - lightStart;
      
      console.log(`✅ Light Mode: ${lightResult.jobs?.length || 0} jobs found in ${results.performance.lightMode}ms`);
    } catch (error) {
      results.errors.push(`Light Mode: ${error.message}`);
      console.log(`❌ Light Mode failed: ${error.message}`);
    }
    
    // Test Dark Mode
    console.log('\n🌙 Testing Dark Mode...');
    const darkStart = Date.now();
    
    try {
      const darkResult = await testMode('dark', TEST_CONFIG.darkMode);
      results.darkMode = darkResult;
      results.performance.darkMode = Date.now() - darkStart;
      
      console.log(`✅ Dark Mode: ${darkResult.jobs?.length || 0} jobs found in ${results.performance.darkMode}ms`);
    } catch (error) {
      results.errors.push(`Dark Mode: ${error.message}`);
      console.log(`❌ Dark Mode failed: ${error.message}`);
    }
    
    // Generate test report
    generateTestReport(results);
    
    // Check if rollback is needed
    if (results.errors.length > 0) {
      console.log('\n⚠️ Errors detected. Consider rollback if needed.');
      console.log('Run: npm run test:rollback to restore previous version');
    } else {
      console.log('\n✅ All tests passed! Optimized scraping is working correctly.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    results.errors.push(`Test Setup: ${error.message}`);
    generateTestReport(results);
  }
};

/**
 * Test a specific mode
 */
const testMode = async (mode, searchParams) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${mode} mode test timed out after ${TEST_CONFIG.timeout}ms`));
    }, TEST_CONFIG.timeout);
    
    // Start the optimized search
    const { processId } = handleOptimizedSearch(searchParams, mode);
    
    // Poll for results
    const pollInterval = setInterval(async () => {
      try {
        const { activeProcesses } = require('../../app/backend/controllers/search/sharedData');
        const processInfo = activeProcesses.get(processId);
        
        if (!processInfo) {
          clearInterval(pollInterval);
          clearTimeout(timeout);
          reject(new Error(`${mode} mode process not found`));
          return;
        }
        
        if (processInfo.status === 'completed') {
          clearInterval(pollInterval);
          clearTimeout(timeout);
          
          const result = {
            jobs: processInfo.jobs || [],
            processId,
            status: processInfo.status,
            progress: processInfo.progress
          };
          
          resolve(result);
        } else if (processInfo.status === 'failed') {
          clearInterval(pollInterval);
          clearTimeout(timeout);
          reject(new Error(`${mode} mode search failed`));
        }
      } catch (error) {
        clearInterval(pollInterval);
        clearTimeout(timeout);
        reject(error);
      }
    }, 1000); // Poll every second
  });
};

/**
 * Generate test report
 */
const generateTestReport = (results) => {
  const report = {
    timestamp: new Date().toISOString(),
    testConfig: TEST_CONFIG,
    results: {
      lightMode: {
        success: results.lightMode !== null,
        jobCount: results.lightMode?.jobs?.length || 0,
        performance: results.performance.lightMode || 0
      },
      darkMode: {
        success: results.darkMode !== null,
        jobCount: results.darkMode?.jobs?.length || 0,
        performance: results.performance.darkMode || 0
      },
      errors: results.errors
    },
    summary: {
      totalTests: 2,
      passedTests: (results.lightMode !== null ? 1 : 0) + (results.darkMode !== null ? 1 : 0),
      failedTests: results.errors.length,
      averagePerformance: results.performance.lightMode && results.performance.darkMode 
        ? Math.round((results.performance.lightMode + results.performance.darkMode) / 2)
        : 'N/A'
    }
  };
  
  // Save report to file
  const reportPath = path.join(__dirname, 'optimized_scraping_test_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 Test Report Generated:');
  console.log(`   📄 Report saved to: ${reportPath}`);
  console.log(`   ✅ Tests passed: ${report.summary.passedTests}/${report.summary.totalTests}`);
  console.log(`   ❌ Tests failed: ${report.summary.failedTests}`);
  console.log(`   ⏱️ Average performance: ${report.summary.averagePerformance}ms`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`   - ${error}`));
  }
};

/**
 * Rollback function to restore previous version
 */
const rollbackToPreviousVersion = () => {
  console.log('🔄 Rolling back to previous version...');
  
  try {
    // Check if git is available
    const { execSync } = require('child_process');
    
    // Get the previous commit
    const previousCommit = execSync('git log --oneline -2 | tail -1 | cut -d" " -f1', { encoding: 'utf8' }).trim();
    
    console.log(`📋 Rolling back to commit: ${previousCommit}`);
    
    // Stash current changes
    execSync('git stash', { stdio: 'inherit' });
    
    // Reset to previous commit
    execSync(`git reset --hard ${previousCommit}`, { stdio: 'inherit' });
    
    console.log('✅ Rollback completed successfully');
    console.log('📝 Current changes have been stashed');
    console.log('💡 Run "git stash pop" to restore your changes if needed');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    console.log('💡 Manual rollback required. Check git status and reset manually.');
  }
};

/**
 * Update test URLs in config
 */
const updateTestUrls = () => {
  console.log('🔄 Updating test URLs in config...');
  
  try {
    const configPath = path.join(__dirname, '../../app/backend/config/testUrls.json');
    
    if (!fs.existsSync(configPath)) {
      console.log('❌ Config file not found. Creating new one...');
      const config = {
        sampleUrls: [
          'https://www.seek.com.au/job/85981995?ref=recom-homepage&pos=4&sp=3&origin=jobTitle#sol=941dd2919d55ebc790f6017d3e00d197d7ce28a0',
          'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=f5c442d9c765b69183c0a9f36e76c3773779cff4',
          'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=ac705abd43f8e7aa11c57e26bdd7ef8de3e67313'
        ],
        lastUpdated: new Date().toISOString(),
        description: 'Test URLs for light mode. Update when URLs expire.',
        maxUrls: 5,
        recommendedUpdateFrequency: 'weekly'
      };
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log('✅ New config file created');
    } else {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config.lastUpdated = new Date().toISOString();
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log('✅ Config file updated');
    }
    
  } catch (error) {
    console.error('❌ Failed to update config:', error.message);
  }
};

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'test':
    testOptimizedScraping();
    break;
  case 'rollback':
    rollbackToPreviousVersion();
    break;
  case 'update-urls':
    updateTestUrls();
    break;
  default:
    console.log('🧪 Optimized Scraping Test Script');
    console.log('=' .repeat(40));
    console.log('Usage:');
    console.log('  node test_optimized_scraping.js test        - Run tests');
    console.log('  node test_optimized_scraping.js rollback    - Rollback to previous version');
    console.log('  node test_optimized_scraping.js update-urls - Update test URLs in config');
    console.log('');
    console.log('Examples:');
    console.log('  node test_optimized_scraping.js test');
    console.log('  node test_optimized_scraping.js rollback');
} 
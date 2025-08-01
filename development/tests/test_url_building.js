/**
 * URL BUILDING VALIDATION TEST
 * Tests SEEK URL construction for different scenarios
 * Ensures location enrichment and parameters work correctly
 */

const UrlBuilder = require('../../app/backend/scrapers/UrlBuilder');

// Test cases for URL building
const TEST_CASES = [
  {
    name: 'No Keyword - Dandenong',
    keyword: '',
    location: 'Dandenong',
    distance: '25 km',
    postedAgo: '7 days',
    expected: {
      contains: ['dandenong', 'vic', '3175', 'daterange=7', 'distance=25'],
      format: 'https://www.seek.com.au/jobs/in-'
    }
  },
  {
    name: 'With Keyword - Analyst',
    keyword: 'analyst',
    location: 'Dandenong', 
    distance: '25 km',
    postedAgo: '7 days',
    expected: {
      contains: ['analyst-jobs', 'dandenong', 'vic', '3175', 'daterange=7', 'distance=25'],
      format: 'https://www.seek.com.au/Analyst-jobs/in-'
    }
  },
  {
    name: 'Melbourne CBD',
    keyword: 'developer',
    location: 'Melbourne',
    distance: '10 km',
    postedAgo: '3 days',
    expected: {
      contains: ['developer-jobs', 'melbourne', 'daterange=3', 'distance=10'],
      format: 'https://www.seek.com.au/Developer-jobs/in-'
    }
  }
];

function validateUrl(url, expected, testName) {
  const issues = [];
  
  // Check format
  if (!url.startsWith(expected.format)) {
    issues.push(`Format: Expected to start with "${expected.format}"`);
  }
  
  // Check required components
  const urlLower = url.toLowerCase();
  expected.contains.forEach(component => {
    if (!urlLower.includes(component.toLowerCase())) {
      issues.push(`Missing: "${component}"`);
    }
  });
  
  // Check basic URL structure
  if (!url.includes('?')) {
    issues.push('Missing query parameters');
  }
  
  if (!url.includes('daterange=')) {
    issues.push('Missing daterange parameter');
  }
  
  if (!url.includes('distance=')) {
    issues.push('Missing distance parameter');
  }
  
  return {
    passed: issues.length === 0,
    issues,
    url
  };
}

async function testUrlBuilding() {
  console.log('🔗 URL BUILDING VALIDATION TEST');
  console.log('===============================');
  console.log('Testing SEEK URL construction for different scenarios\n');
  
  let overallPassed = true;
  const results = [];
  
  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    console.log(`🧪 Test ${i + 1}: ${testCase.name}`);
    console.log(`   Input: keyword="${testCase.keyword}", location="${testCase.location}", distance="${testCase.distance}", postedAgo="${testCase.postedAgo}"`);
    
    try {
      const url = UrlBuilder.buildSeekUrl(
        testCase.keyword,
        testCase.location, 
        testCase.distance,
        testCase.postedAgo
      );
      
      console.log(`   Built URL: ${url}`);
      
      const validation = validateUrl(url, testCase.expected, testCase.name);
      
      if (validation.passed) {
        console.log(`   ✅ PASSED: URL format is correct`);
      } else {
        console.log(`   ❌ FAILED: Issues found:`);
        validation.issues.forEach(issue => {
          console.log(`      - ${issue}`);
        });
        overallPassed = false;
      }
      
      results.push({
        testName: testCase.name,
        passed: validation.passed,
        url,
        issues: validation.issues
      });
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      overallPassed = false;
      results.push({
        testName: testCase.name,
        passed: false,
        error: error.message
      });
    }
    
    console.log(''); // Empty line
  }
  
  // Summary
  console.log('📊 URL BUILDING TEST SUMMARY');
  console.log('============================');
  
  const passedTests = results.filter(r => r.passed).length;
  console.log(`Tests passed: ${passedTests}/${results.length}`);
  
  if (overallPassed) {
    console.log('🎯 RESULT: ✅ ALL URL BUILDING TESTS PASSED');
    console.log('URL construction is working correctly for all scenarios');
  } else {
    console.log('🎯 RESULT: ❌ SOME URL BUILDING TESTS FAILED');
    console.log('URL construction needs to be fixed');
  }
  
  return {
    allPassed: overallPassed,
    results,
    passedCount: passedTests,
    totalCount: results.length
  };
}

// Export for use in other tests
module.exports = {
  testUrlBuilding,
  TEST_CASES,
  validateUrl
};

// Run test if executed directly
if (require.main === module) {
  testUrlBuilding()
    .then(result => {
      console.log(`\n👋 URL building test ${result.allPassed ? 'PASSED' : 'FAILED'}`);
      process.exit(result.allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed to run:', error.message);
      process.exit(1);
    });
}
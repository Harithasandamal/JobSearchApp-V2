/**
 * Test URL Opening Functionality
 * Verifies that the search URL is properly generated and returned by the backend
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3002/api';

async function testUrlOpening() {
  console.log('🧪 Testing URL Opening Functionality...\n');
  
  try {
    // Test 1: Check if backend is running
    console.log('1️⃣ Checking backend health...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Backend is running:', healthData.status);
    
    // Test 2: Test enhanced fast search with dark mode
    console.log('\n2️⃣ Testing enhanced fast search (dark mode)...');
    const searchParams = {
      keyword: 'software engineer',
      location: 'Melbourne VIC',
      distance: '25km',
      postedAgo: '7 days',
      mode: 'dark'
    };
    
    const searchResponse = await fetch(`${API_BASE_URL}/enhanced-fast-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchParams),
    });
    
    if (!searchResponse.ok) {
      throw new Error(`HTTP error! status: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    console.log('✅ Search started successfully');
    console.log('📋 Process ID:', searchData.processId);
    console.log('🔗 Search URL:', searchData.searchUrl);
    
    if (searchData.searchUrl) {
      console.log('✅ Search URL is properly returned!');
      console.log('🌐 URL to open:', searchData.searchUrl);
    } else {
      console.log('❌ Search URL is missing from response');
    }
    
    // Test 3: Check search status
    console.log('\n3️⃣ Checking search status...');
    const statusResponse = await fetch(`${API_BASE_URL}/enhanced-fast-search-status/${searchData.processId}`);
    const statusData = await statusResponse.json();
    console.log('📊 Search status:', statusData.status);
    console.log('📈 Progress:', statusData.progress + '%');
    
    // Test 4: Wait for completion and check final status
    console.log('\n4️⃣ Waiting for search completion...');
    let attempts = 0;
    const maxAttempts = 30; // Wait up to 60 seconds
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      
      const finalStatusResponse = await fetch(`${API_BASE_URL}/enhanced-fast-search-status/${searchData.processId}`);
      const finalStatusData = await finalStatusResponse.json();
      
      console.log(`⏳ Attempt ${attempts + 1}/${maxAttempts}: ${finalStatusData.status} (${finalStatusData.progress}%)`);
      
      if (finalStatusData.status === 'completed' || finalStatusData.status === 'failed') {
        console.log('✅ Search completed with status:', finalStatusData.status);
        if (finalStatusData.jobs && finalStatusData.jobs.length > 0) {
          console.log(`📋 Found ${finalStatusData.jobs.length} jobs`);
        }
        break;
      }
      
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      console.log('⚠️ Search did not complete within expected time');
    }
    
    // Test 5: Test light mode (should not return searchUrl)
    console.log('\n5️⃣ Testing light mode (should not return searchUrl)...');
    const lightSearchParams = {
      keyword: 'developer',
      location: 'Sydney NSW',
      distance: '10km',
      postedAgo: '3 days',
      mode: 'light'
    };
    
    const lightSearchResponse = await fetch(`${API_BASE_URL}/enhanced-fast-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lightSearchParams),
    });
    
    if (!lightSearchResponse.ok) {
      throw new Error(`HTTP error! status: ${lightSearchResponse.status}`);
    }
    
    const lightSearchData = await lightSearchResponse.json();
    console.log('✅ Light mode search started successfully');
    console.log('📋 Process ID:', lightSearchData.processId);
    console.log('🔗 Search URL:', lightSearchData.searchUrl);
    
    if (lightSearchData.searchUrl === null || lightSearchData.searchUrl === undefined) {
      console.log('✅ Light mode correctly returns null/undefined searchUrl');
    } else {
      console.log('⚠️ Light mode unexpectedly returned searchUrl:', lightSearchData.searchUrl);
    }
    
    console.log('\n🎉 URL Opening Test Completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testUrlOpening();
}

module.exports = { testUrlOpening }; 
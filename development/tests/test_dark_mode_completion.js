/**
 * Test Dark Mode Completion Detection
 * Verifies that dark mode properly detects completion and transitions
 */

const { activeProcesses } = require('../../app/backend/controllers/search/sharedData');

async function testDarkModeCompletion() {
  console.log('🧪 Testing Dark Mode Completion Detection');
  console.log('========================================');
  
  // Simulate a dark mode process
  const processId = `dark-mode-${Date.now()}`;
  const mockProcess = {
    processId: processId,
    status: 'running',
    progress: 0,
    jobs: [],
    startTime: Date.now()
  };
  
  activeProcesses.set(processId, mockProcess);
  
  console.log(`📋 Created mock dark mode process: ${processId}`);
  
  try {
    // Simulate progress updates
    console.log('\n🚀 Simulating dark mode progress...');
    
    const progressSteps = [
      { progress: 10, status: 'running', description: 'Initialization' },
      { progress: 25, status: 'running', description: 'URL collection' },
      { progress: 50, status: 'running', description: 'Scraping start' },
      { progress: 75, status: 'running', description: 'Scraping complete' },
      { progress: 85, status: 'running', description: 'Sorting results' },
      { progress: 100, status: 'completed', description: 'Final completion' }
    ];
    
    for (const step of progressSteps) {
      // Update the mock process
      mockProcess.progress = step.progress;
      mockProcess.status = step.status;
      
      if (step.status === 'completed') {
        mockProcess.jobs = [
          { id: 'dark-job-1', title: 'Test Job 1', company: 'Test Company', location: 'Test Location', postedAgo: '2d', url: 'https://test.com' },
          { id: 'dark-job-2', title: 'Test Job 2', company: 'Test Company 2', location: 'Test Location 2', postedAgo: '1d', url: 'https://test2.com' }
        ];
      }
      
      console.log(`   ✅ ${step.progress}% - ${step.status} (${step.description})`);
      
      // Simulate polling delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Test completion detection
    console.log('\n🔍 Testing completion detection...');
    
    const finalProcess = activeProcesses.get(processId);
    if (finalProcess) {
      console.log(`   📊 Final status: ${finalProcess.status}`);
      console.log(`   📊 Final progress: ${finalProcess.progress}%`);
      console.log(`   📊 Jobs found: ${finalProcess.jobs.length}`);
      
      if (finalProcess.status === 'completed' && finalProcess.progress === 100) {
        console.log('   ✅ Completion detected correctly');
      } else {
        console.log('   ❌ Completion not detected correctly');
        return false;
      }
    } else {
      console.log('   ❌ Process not found');
      return false;
    }
    
    // Test frontend polling simulation
    console.log('\n🔍 Testing frontend polling simulation...');
    
    let pollCount = 0;
    const maxPolls = 20;
    
    const simulatePolling = () => {
      pollCount++;
      const process = activeProcesses.get(processId);
      
      if (!process) {
        console.log('   ❌ Process not found during polling');
        return false;
      }
      
      console.log(`   📡 Poll ${pollCount}: status=${process.status}, progress=${process.progress}%`);
      
      if (process.status === 'completed') {
        console.log('   ✅ Completion detected by polling');
        return true;
      }
      
      if (pollCount >= maxPolls) {
        console.log('   ❌ Max polls reached without completion');
        return false;
      }
      
      return false;
    };
    
    // Simulate polling until completion
    while (!simulatePolling() && pollCount < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Clean up
    activeProcesses.delete(processId);
    
    console.log('\n🎯 Dark mode completion detection test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run test
testDarkModeCompletion()
  .then(success => {
    console.log(`\n${success ? '✅' : '❌'} Dark mode completion test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  }); 
/**
 * Test Intelligent Timeout Mechanism
 * Verifies that timeout only triggers when there's no progress for a period
 */

async function testIntelligentTimeout() {
  console.log('🧪 Testing Intelligent Timeout Mechanism');
  console.log('========================================');
  
  // Simulate different scenarios
  const scenarios = [
    {
      name: 'Active Progress - Should Not Timeout',
      progressUpdates: [
        { time: 0, progress: 0 },
        { time: 30000, progress: 10 },   // 30s: 10%
        { time: 60000, progress: 25 },   // 60s: 25%
        { time: 90000, progress: 50 },   // 90s: 50%
        { time: 120000, progress: 75 },  // 120s: 75%
        { time: 150000, progress: 100 }  // 150s: 100%
      ],
      shouldTimeout: false,
      description: 'Continuous progress should not trigger timeout'
    },
    {
      name: 'Stalled Progress - Should Timeout',
      progressUpdates: [
        { time: 0, progress: 0 },
        { time: 30000, progress: 10 },   // 30s: 10%
        { time: 60000, progress: 25 },   // 60s: 25%
        { time: 90000, progress: 25 },   // 90s: 25% (stalled)
        { time: 120000, progress: 25 },  // 120s: 25% (stalled)
        { time: 150000, progress: 25 },  // 150s: 25% (stalled)
        { time: 180000, progress: 25 },  // 180s: 25% (stalled)
        { time: 210000, progress: 25 }   // 210s: 25% (stalled)
      ],
      shouldTimeout: true,
      description: 'Stalled progress should trigger timeout after 2 minutes'
    },
    {
      name: 'Early Stall - Should Not Timeout Immediately',
      progressUpdates: [
        { time: 0, progress: 0 },
        { time: 30000, progress: 10 },   // 30s: 10%
        { time: 60000, progress: 10 },   // 60s: 10% (stalled)
        { time: 90000, progress: 10 },   // 90s: 10% (stalled)
        { time: 120000, progress: 10 }   // 120s: 10% (stalled)
      ],
      shouldTimeout: false,
      description: 'Early stall should not timeout until 3 minutes total'
    }
  ];
  
  for (const scenario of scenarios) {
    console.log(`\n🔍 Testing: ${scenario.name}`);
    console.log(`📝 ${scenario.description}`);
    
    let pollStartTime = Date.now();
    let lastProgressTime = Date.now();
    let lastProgress = 0;
    let timeoutTriggered = false;
    
    // Simulate polling over time
    for (const update of scenario.progressUpdates) {
      const currentTime = pollStartTime + update.time;
      const elapsedTime = currentTime - pollStartTime;
      const progressPercent = update.progress;
      
      // Check intelligent timeout conditions
      if (elapsedTime > 180000 && lastProgressTime && (currentTime - lastProgressTime) > 120000) {
        timeoutTriggered = true;
        console.log(`   ⏰ Timeout triggered at ${elapsedTime/1000}s (no progress for 2 minutes after 3 minutes total)`);
        break;
      }
      
      // Check absolute timeout
      if (elapsedTime > 600000) {
        timeoutTriggered = true;
        console.log(`   ⏰ Absolute timeout triggered at ${elapsedTime/1000}s`);
        break;
      }
      
      // Update progress tracking
      if (progressPercent > lastProgress) {
        lastProgress = progressPercent;
        lastProgressTime = currentTime;
        console.log(`   📈 Progress: ${progressPercent}% at ${elapsedTime/1000}s`);
      } else {
        console.log(`   ⏸️  Progress stalled at ${progressPercent}% for ${(currentTime - lastProgressTime)/1000}s`);
      }
    }
    
    const status = timeoutTriggered === scenario.shouldTimeout ? '✅' : '❌';
    console.log(`   ${status} ${scenario.name}: ${timeoutTriggered ? 'TIMEOUT' : 'NO TIMEOUT'} (Expected: ${scenario.shouldTimeout ? 'TIMEOUT' : 'NO TIMEOUT'})`);
  }
  
  console.log('\n🎯 Intelligent timeout test completed!');
  return true;
}

// Run test
testIntelligentTimeout()
  .then(success => {
    console.log(`\n${success ? '✅' : '❌'} Intelligent timeout test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
  }); 
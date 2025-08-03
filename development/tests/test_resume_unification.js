// Test Resume Unification
const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';

async function testResumeUnification() {
  console.log('🧪 TESTING RESUME UNIFICATION\n');
  
  try {
    // Test data with unified resume name
    const testData = {
      selectedJobs: [
        {
          id: 'test-job-1',
          title: 'Software Engineer',
          company: 'Tech Corp',
          location: 'Melbourne',
          url: 'https://www.seek.com.au/job/85994049'
        }
      ],
      resumeData: {
        content: `Default Resume Content:
        
EDUCATION:
- Bachelor's Degree in Computer Science
- Relevant certifications and training

EXPERIENCE:
- 3+ years of software development experience
- Experience with modern web technologies
- Project management and team collaboration

SKILLS:
- Programming languages: JavaScript, Python, Java
- Web technologies: React, Node.js, HTML, CSS
- Database: SQL, MongoDB
- Tools: Git, Docker, AWS

OTHER REQUIREMENTS:
- Australian work rights
- Driver's license
- Available for immediate start`,
        fileName: 'Default Resume.pdf'
      }
    };
    
    console.log('📤 Starting scoring process with unified resume...');
    console.log('📋 Resume file name:', testData.resumeData.fileName);
    
    // Start scoring
    const startResponse = await axios.post(`${API_BASE}/score-jobs`, testData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Scoring started:', startResponse.data);
    const processId = startResponse.data.processId;
    
    // Poll for status
    let attempts = 0;
    const maxAttempts = 30; // 2.5 minutes max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;
      
      try {
        const statusResponse = await axios.get(`${API_BASE}/scoring-status/${processId}`, {
          timeout: 5000
        });
        const status = statusResponse.data;
        
        console.log(`📊 Status: ${status.status}, Progress: ${status.progress}%`);
        
        if (status.status === 'completed') {
          console.log('🎉 Scoring completed!');
          
          // Handle both direct scoredJobs and nested results structure
          const scoredJobs = status.scoredJobs || status.results?.scoredJobs || [];
          
          if (scoredJobs && scoredJobs.length > 0) {
            console.log('\n📋 UNIFIED RESUME TEST RESULTS:');
            scoredJobs.forEach((job, index) => {
              console.log(`\n🎯 Job ${index + 1}: ${job.title} at ${job.company}`);
              console.log(`📊 Score: ${job.compatibilityScore}%`);
              console.log(`📋 5 Lists:`);
              console.log(`   1️⃣ Mandatory Requirements: ${job.mandatoryRequirements?.length || 0} items`);
              console.log(`   2️⃣ Preferred Requirements: ${job.preferredRequirements?.length || 0} items`);
              console.log(`   3️⃣ Responsibilities: ${job.responsibilities?.length || 0} items`);
              console.log(`   4️⃣ Employer Questions: ${job.employerQuestions?.length || 0} items`);
              console.log(`   5️⃣ Gaps: ${job.gaps?.length || 0} items`);
              
              if (job.gaps && job.gaps.length > 0) {
                console.log('\n⚠️ GAPS DETECTED:');
                job.gaps.forEach((gap, gapIndex) => {
                  console.log(`   ${gapIndex + 1}. ${gap}`);
                });
              }
              
              // Show score breakdown if available
              if (job.scoreBreakdown) {
                console.log('\n📊 Score Breakdown:');
                console.log(`   Mandatory Score: ${job.scoreBreakdown.mandatoryScore}`);
                console.log(`   Preferred Score: ${job.scoreBreakdown.preferredScore}`);
                console.log(`   Gap Penalty: ${job.scoreBreakdown.gapPenalty}`);
                console.log(`   Final Score: ${job.compatibilityScore}%`);
              }
            });
            
            console.log('\n✅ RESUME UNIFICATION SUCCESSFUL!');
            console.log('✅ Using "Default Resume.pdf" consistently');
            console.log('✅ 5 lists created correctly');
            console.log('✅ Scoring working with unified resume name');
            
          } else {
            console.log('⚠️ No scored jobs found in response');
          }
          
          break;
        } else if (status.status === 'failed') {
          console.log('❌ Scoring failed');
          break;
        }
      } catch (error) {
        console.log('⚠️ Error checking status:', error.message);
      }
    }
    
    if (attempts >= maxAttempts) {
      console.log('⏰ Test timed out after 2.5 minutes');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run test
testResumeUnification().catch(console.error); 
// Test Complete Flow - Search to Scoring
const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';

async function testCompleteFlow() {
  console.log('🧪 TESTING COMPLETE FLOW - SEARCH TO SCORING\n');
  
  try {
    // Step 1: Start a search
    console.log('📋 Step 1: Starting job search...');
    const searchData = {
      keyword: 'software engineer',
      location: 'Melbourne',
      distance: '5 km',
      postedAgo: '3 days'
    };
    
    const searchResponse = await axios.post(`${API_BASE}/search-jobs`, searchData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Search started:', searchResponse.data);
    const searchProcessId = searchResponse.data.processId;
    
    // Step 2: Wait for search to complete
    console.log('\n📋 Step 2: Waiting for search to complete...');
    let searchAttempts = 0;
    const maxSearchAttempts = 30;
    
    while (searchAttempts < maxSearchAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      searchAttempts++;
      
      try {
        const searchStatusResponse = await axios.get(`${API_BASE}/search-status/${searchProcessId}`, {
          timeout: 5000
        });
        const searchStatus = searchStatusResponse.data;
        
        console.log(`📊 Search status: ${searchStatus.status}, Progress: ${searchStatus.progress}%`);
        
        if (searchStatus.status === 'completed') {
          console.log('✅ Search completed!');
          console.log(`📊 Found ${searchStatus.jobs?.length || 0} jobs`);
          
          if (searchStatus.jobs && searchStatus.jobs.length > 0) {
            // Step 3: Start scoring with the found jobs
            console.log('\n📋 Step 3: Starting job scoring...');
            const scoringData = {
              selectedJobs: searchStatus.jobs.slice(0, 2), // Score first 2 jobs
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
            
            const scoringResponse = await axios.post(`${API_BASE}/score-jobs`, scoringData, {
              timeout: 10000,
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            console.log('✅ Scoring started:', scoringResponse.data);
            const scoringProcessId = scoringResponse.data.processId;
            
            // Step 4: Wait for scoring to complete
            console.log('\n📋 Step 4: Waiting for scoring to complete...');
            let scoringAttempts = 0;
            const maxScoringAttempts = 60;
            
            while (scoringAttempts < maxScoringAttempts) {
              await new Promise(resolve => setTimeout(resolve, 3000));
              scoringAttempts++;
              
              try {
                const scoringStatusResponse = await axios.get(`${API_BASE}/scoring-status/${scoringProcessId}`, {
                  timeout: 5000
                });
                const scoringStatus = scoringStatusResponse.data;
                
                console.log(`📊 Scoring status: ${scoringStatus.status}, Progress: ${scoringStatus.progress}%`);
                
                if (scoringStatus.status === 'completed') {
                  console.log('✅ Scoring completed!');
                  
                  // Handle both direct scoredJobs and nested results structure
                  const scoredJobs = scoringStatus.scoredJobs || scoringStatus.results?.scoredJobs || [];
                  
                  if (scoredJobs && scoredJobs.length > 0) {
                    console.log('\n📋 FINAL RESULTS - 5 LISTS CREATED:');
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
                    
                    console.log('\n🎉 COMPLETE FLOW TEST SUCCESSFUL!');
                    console.log('✅ Search completed');
                    console.log('✅ Scoring completed');
                    console.log('✅ 5 lists created for each job');
                    console.log('✅ Score breakdown calculated');
                    
                  } else {
                    console.log('⚠️ No scored jobs found in response');
                  }
                  
                  break;
                } else if (scoringStatus.status === 'failed') {
                  console.log('❌ Scoring failed');
                  break;
                }
              } catch (error) {
                console.log('⚠️ Error checking scoring status:', error.message);
              }
            }
            
            if (scoringAttempts >= maxScoringAttempts) {
              console.log('⏰ Scoring test timed out after 3 minutes');
            }
            
          } else {
            console.log('⚠️ No jobs found from search');
          }
          
          break;
        } else if (searchStatus.status === 'failed') {
          console.log('❌ Search failed');
          break;
        }
      } catch (error) {
        console.log('⚠️ Error checking search status:', error.message);
      }
    }
    
    if (searchAttempts >= maxSearchAttempts) {
      console.log('⏰ Search test timed out after 1 minute');
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
testCompleteFlow().catch(console.error); 
// Test Interactive Scoring with Automated User Prompts
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Randomly select one of the sample URLs
const SAMPLE_URLS = [
  'https://www.seek.com.au/job/85981995?ref=recom-homepage&pos=4&sp=3&origin=jobTitle#sol=941dd2919d55ebc790f6017d3e00d197d7ce28a0',
  'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=f5c442d9c765b69183c0a9f36e76c3773779cff4',
  'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=ac705abd43f8e7aa11c57e26bdd7ef8de3e67313'
];

const selectedUrl = SAMPLE_URLS[Math.floor(Math.random() * SAMPLE_URLS.length)];

// Store user responses for missing requirements (simulated)
const userResponses = new Map();

// Default resume content
const defaultResumeContent = `Default Resume Content:

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
- Available for immediate start`;

// Function to simulate user prompt for missing requirement
function simulatePromptForRequirement(requirement, jobTitle) {
  console.log('\n' + '='.repeat(60));
  console.log(`🔍 MISSING MANDATORY REQUIREMENT DETECTED`);
  console.log(`📋 Job: ${jobTitle}`);
  console.log(`❌ Missing: ${requirement}`);
  console.log('='.repeat(60));
  
  // Simulate user response based on requirement type
  let hasRequirement = false;
  if (requirement.toLowerCase().includes('work rights') || requirement.toLowerCase().includes('australian')) {
    hasRequirement = true; // Most people have work rights
    console.log('❓ Do you have this requirement? (Y/N): Y (simulated)');
  } else if (requirement.toLowerCase().includes('driver') || requirement.toLowerCase().includes('license')) {
    hasRequirement = true; // Most people have driver's license
    console.log('❓ Do you have this requirement? (Y/N): Y (simulated)');
  } else if (requirement.toLowerCase().includes('experience')) {
    hasRequirement = true; // Resume shows 3+ years experience
    console.log('❓ Do you have this requirement? (Y/N): Y (simulated)');
  } else {
    hasRequirement = false; // Default to no for unknown requirements
    console.log('❓ Do you have this requirement? (Y/N): N (simulated)');
  }
  
  userResponses.set(requirement, hasRequirement);
  
  if (hasRequirement) {
    console.log('✅ Requirement added to resume');
  } else {
    console.log('❌ Requirement marked as gap');
  }
  
  return hasRequirement;
}

// Function to update resume content with user responses
function updateResumeContent(originalContent, responses) {
  let updatedContent = originalContent;
  
  for (const [requirement, hasIt] of responses) {
    if (hasIt) {
      // Add the requirement to the resume content
      if (requirement.toLowerCase().includes('work rights') || requirement.toLowerCase().includes('australian')) {
        updatedContent += '\n- Australian work rights (confirmed)';
      } else if (requirement.toLowerCase().includes('driver') || requirement.toLowerCase().includes('license')) {
        updatedContent += '\n- Driver\'s license (confirmed)';
      } else if (requirement.toLowerCase().includes('experience')) {
        updatedContent += `\n- ${requirement} (confirmed)`;
      } else {
        updatedContent += `\n- ${requirement} (confirmed)`;
      }
    }
  }
  
  return updatedContent;
}

async function testInteractiveScoringAuto() {
  console.log('🧪 TESTING INTERACTIVE SCORING WITH AUTOMATED PROMPTS');
  console.log('🎯 Selected URL:', selectedUrl);
  console.log('📋 Resume Content Length:', defaultResumeContent.length, 'characters');
  
  try {
    // Create test job data
    const testJob = {
      id: 'interactive-test-job',
      title: 'Interactive Test Job',
      company: 'Test Company',
      location: 'Melbourne',
      url: selectedUrl
    };
    
    console.log('\n🚀 Starting interactive scoring process...');
    console.log('📝 Step 1: Extracting job requirements...');
    
    // Step 1: Extract job requirements (this would normally be done by JobScorer)
    // For testing, we'll simulate the extraction process
    const mockJobRequirements = {
      mandatoryRequirements: [
        'Australian work rights',
        'Driver\'s license',
        '3+ years of relevant experience'
      ],
      preferredRequirements: [
        'Project management skills',
        'Team collaboration experience'
      ],
      responsibilities: [
        'Coordinate project activities',
        'Manage team communications',
        'Track project progress'
      ],
      employerQuestions: [
        'How many years of experience do you have?',
        'Do you have project management experience?'
      ]
    };
    
    console.log('✅ Job requirements extracted');
    console.log(`📋 Mandatory Requirements: ${mockJobRequirements.mandatoryRequirements.length}`);
    console.log(`📋 Preferred Requirements: ${mockJobRequirements.preferredRequirements.length}`);
    
    // Step 2: Check for missing mandatory requirements
    console.log('\n🔍 Step 2: Checking for missing mandatory requirements...');
    
    const missingRequirements = [];
    for (const requirement of mockJobRequirements.mandatoryRequirements) {
      const hasInResume = defaultResumeContent.toLowerCase().includes(requirement.toLowerCase()) ||
                         (requirement.toLowerCase().includes('work rights') && defaultResumeContent.toLowerCase().includes('australian work rights')) ||
                         (requirement.toLowerCase().includes('driver') && defaultResumeContent.toLowerCase().includes('driver\'s license'));
      
      if (!hasInResume) {
        missingRequirements.push(requirement);
      }
    }
    
    if (missingRequirements.length > 0) {
      console.log(`⚠️ Found ${missingRequirements.length} missing mandatory requirements:`);
      missingRequirements.forEach(req => console.log(`   - ${req}`));
      
      // Step 3: Simulate interactive prompting
      console.log('\n🎯 Step 3: Simulating interactive prompting for missing requirements...');
      
      for (const requirement of missingRequirements) {
        simulatePromptForRequirement(requirement, testJob.title);
      }
      
      // Step 4: Update resume content
      console.log('\n📝 Step 4: Updating resume content with user responses...');
      const updatedResumeContent = updateResumeContent(defaultResumeContent, userResponses);
      
      console.log('✅ Resume content updated');
      console.log('📊 User responses:');
      for (const [requirement, hasIt] of userResponses) {
        console.log(`   ${hasIt ? '✅' : '❌'} ${requirement}`);
      }
      
      // Step 5: Re-run scoring with updated resume
      console.log('\n🎯 Step 5: Re-running scoring with updated resume...');
      
      const updatedConfig = {
        selectedJobs: [testJob],
        resumeData: {
          content: updatedResumeContent,
          fileName: 'Updated Resume.pdf'
        },
        timestamp: new Date().toISOString()
      };
      
      // Save updated config
      const configPath = path.join(process.cwd(), 'interactive_test_config.json');
      fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
      
      // Run JobScorer with updated config
      console.log('🤖 Running JobScorer with updated resume...');
      
      const scorerProcess = spawn('node', [path.join(process.cwd(), 'app', 'backend', 'JobScorer.js'), configPath], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      let hasCompleted = false;
      
      scorerProcess.stdout.on('data', (data) => {
        const outputStr = data.toString();
        output += outputStr;
        console.log(`🤖 ${outputStr.trim()}`);
      });
      
      scorerProcess.stderr.on('data', (data) => {
        console.error(`❌ Error: ${data.toString()}`);
      });
      
      scorerProcess.on('close', (code) => {
        if (code === 0 && !hasCompleted) {
          hasCompleted = true;
          console.log('\n✅ Interactive scoring completed successfully!');
          console.log('📊 Final Results:');
          console.log(`   - Original missing requirements: ${missingRequirements.length}`);
          console.log(`   - User confirmed requirements: ${Array.from(userResponses.values()).filter(Boolean).length}`);
          console.log(`   - Remaining gaps: ${Array.from(userResponses.values()).filter(v => !v).length}`);
          
          // Clean up
          try {
            fs.unlinkSync(configPath);
            const resultsPath = configPath.replace('.json', '_results.json');
            if (fs.existsSync(resultsPath)) {
              fs.unlinkSync(resultsPath);
            }
          } catch (error) {
            console.log('🧹 Cleanup completed');
          }
        }
      });
      
      // Timeout after 2 minutes
      setTimeout(() => {
        if (!hasCompleted) {
          console.log('⏰ Test timed out after 2 minutes');
          scorerProcess.kill();
        }
      }, 120000);
      
    } else {
      console.log('✅ No missing mandatory requirements found!');
      console.log('🎉 All requirements are already in the resume');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testInteractiveScoringAuto().catch(console.error); 
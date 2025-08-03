// Test Frontend Data Processing
const testScoredJobsData = {
  "scoredJobs": [
    {
      "id": "test-job-1",
      "title": "Software Engineer",
      "company": "Tech Corp",
      "location": "Melbourne",
      "url": "https://www.seek.com.au/job/85994049",
      "postedAgo": "N/A",
      "mandatoryRequirements": [
        "Strong project coordination and communication skills",
        "Relevant tertiary and project management qualifications (e.g. PMP)"
      ],
      "preferredRequirements": [
        "Experience in cross-functional environments (automotive preferred, not essential)",
        "Commercial acumen and problem-solving ability",
        "Self-motivated with a 'can-do' attitude and collaborative style"
      ],
      "responsibilities": [
        "Coordinate project documentation, timelines, and reporting",
        "Facilitate team communication, meetings, and workshops",
        "Analyse data, track metrics and support prioritisation",
        "Support governance and adoption of project processes",
        "Drive collaboration across Product Development, Manufacturing, Marketing, and Sales"
      ],
      "employerQuestions": [
        "How many years' experience do you have as a project coordinator?",
        "How many years of project management experience do you have?",
        "Which of the following PMI certifications have you completed?",
        "Which of the following Microsoft Office products are you experienced with?",
        "How many years' experience do you have with project planning and scheduling?"
      ],
      "mandatoryMatches": [false, false],
      "preferredMatches": [false, false, false],
      "gaps": [
        "Strong project coordination and communication skills",
        "Relevant tertiary and project management qualifications (e.g. PMP)"
      ],
      "matchingDetails": {
        "mandatoryReasons": [],
        "preferredReasons": []
      },
      "compatibilityScore": 0,
      "score": 0,
      "scoreBreakdown": {
        "mandatoryScore": 0,
        "preferredScore": 0,
        "gapPenalty": 80,
        "gapCount": 2,
        "mandatoryCount": 0,
        "preferredCount": 0
      },
      "htmlFilePath": "D:\\JobSearchApp V2\\app\\job-data\\job_test-job-1.html",
      "markdownPath": "D:\\JobSearchApp V2\\app\\job-data\\job_test-job-1.md",
      "timestamp": "2025-08-02T01:57:44.030Z",
      "scoringMethod": "chatgpt-semantic"
    }
  ]
};

// Simulate the frontend data processing logic
function processScoredJobs(status) {
  let scoredJobsData = [];
  
  if (status.scoredJobs && Array.isArray(status.scoredJobs)) {
    scoredJobsData = status.scoredJobs.map(job => {
      const flattenedJob = {
        ...job,
        score: job.score || job.finalScore || 0,
        postedAgo: job.postedAgo || 'N/A'
      };
      
      // Handle new 5-list structure from JobScorer
      if (job.mandatoryRequirements || job.preferredRequirements || job.responsibilities || job.employerQuestions || job.gaps) {
        return {
          ...flattenedJob,
          // Map new structure to expected frontend structure
          requiredSkills: job.mandatoryRequirements || [],
          preferredExperience: job.preferredRequirements || [],
          technicalRequirements: job.mandatoryRequirements || [], // Map mandatory to technical
          softSkills: job.preferredRequirements || [], // Map preferred to soft skills
          responsibilities: job.responsibilities || [],
          employerQuestions: job.employerQuestions || [],
          gaps: job.gaps || [],
          mandatoryMatches: job.mandatoryMatches || [],
          preferredMatches: job.preferredMatches || [],
          scoreBreakdown: job.scoreBreakdown || {},
          matchingDetails: job.matchingDetails || {}
        };
      }
      
      return flattenedJob;
    });
  } else if (status.results && status.results.scoredJobs) {
    // Handle the actual backend response structure
    scoredJobsData = status.results.scoredJobs.map(job => {
      const flattenedJob = {
        ...job,
        score: job.compatibilityScore || job.score || 0,
        postedAgo: job.postedAgo || 'N/A'
      };
      
      // Handle new 5-list structure from JobScorer
      if (job.mandatoryRequirements || job.preferredRequirements || job.responsibilities || job.employerQuestions || job.gaps) {
        return {
          ...flattenedJob,
          // Map new structure to expected frontend structure
          requiredSkills: job.mandatoryRequirements || [],
          preferredExperience: job.preferredRequirements || [],
          technicalRequirements: job.mandatoryRequirements || [], // Map mandatory to technical
          softSkills: job.preferredRequirements || [], // Map preferred to soft skills
          responsibilities: job.responsibilities || [],
          employerQuestions: job.employerQuestions || [],
          gaps: job.gaps || [],
          mandatoryMatches: job.mandatoryMatches || [],
          preferredMatches: job.preferredMatches || [],
          scoreBreakdown: job.scoreBreakdown || {},
          matchingDetails: job.matchingDetails || {}
        };
      }
      
      return flattenedJob;
    });
  } else {
    console.warn('⚠️ No scoring results found - jobs must be properly scored');
    console.log('Available keys in status:', Object.keys(status));
    if (status.results) {
      console.log('Available keys in results:', Object.keys(status.results));
    }
    scoredJobsData = [];
  }
  
  return scoredJobsData;
}

// Test the processing
console.log('🧪 TESTING FRONTEND DATA PROCESSING\n');

// Test 1: Direct scoredJobs structure
console.log('📋 Test 1: Direct scoredJobs structure');
const testStatus1 = { scoredJobs: testScoredJobsData.scoredJobs };
const result1 = processScoredJobs(testStatus1);
console.log(`✅ Processed ${result1.length} jobs`);
if (result1.length > 0) {
  const job = result1[0];
  console.log(`📊 Job: ${job.title} at ${job.company}`);
  console.log(`📋 5 Lists:`);
  console.log(`   1️⃣ Required Skills: ${job.requiredSkills?.length || 0} items`);
  console.log(`   2️⃣ Preferred Experience: ${job.preferredExperience?.length || 0} items`);
  console.log(`   3️⃣ Responsibilities: ${job.responsibilities?.length || 0} items`);
  console.log(`   4️⃣ Employer Questions: ${job.employerQuestions?.length || 0} items`);
  console.log(`   5️⃣ Gaps: ${job.gaps?.length || 0} items`);
  console.log(`📊 Score: ${job.compatibilityScore}%`);
}

// Test 2: Nested results structure (actual backend response)
console.log('\n📋 Test 2: Nested results structure');
const testStatus2 = { results: testScoredJobsData };
const result2 = processScoredJobs(testStatus2);
console.log(`✅ Processed ${result2.length} jobs`);
if (result2.length > 0) {
  const job = result2[0];
  console.log(`📊 Job: ${job.title} at ${job.company}`);
  console.log(`📋 5 Lists:`);
  console.log(`   1️⃣ Required Skills: ${job.requiredSkills?.length || 0} items`);
  console.log(`   2️⃣ Preferred Experience: ${job.preferredExperience?.length || 0} items`);
  console.log(`   3️⃣ Responsibilities: ${job.responsibilities?.length || 0} items`);
  console.log(`   4️⃣ Employer Questions: ${job.employerQuestions?.length || 0} items`);
  console.log(`   5️⃣ Gaps: ${job.gaps?.length || 0} items`);
  console.log(`📊 Score: ${job.compatibilityScore}%`);
}

console.log('\n🎉 Frontend data processing test completed!'); 
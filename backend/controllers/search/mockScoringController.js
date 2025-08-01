/**
 * Mock Scoring Controller
 * Provides mock scored jobs data for testing ScoredScreen
 * Split from testJobsController.js to maintain <300 line limit
 */

/**
 * Get mock scored jobs for testing ScoredScreen
 */
const getMockScoredJobs = async (req, res) => {
  try {
    // Generating mock scored jobs
    
    const mockScoredJobs = [
      {
        id: 'scored-1',
        title: 'Senior Software Engineer',
        company: 'TechCorp Australia',
        location: 'Melbourne',
        postedAgo: '2 days',
        url: 'https://www.seek.com.au/job/mock-1',
        score: 92,
        scoreDetails: {
          skillsMatch: 95,
          experienceMatch: 88,
          educationMatch: 90,
          locationMatch: 100
        },
        analysis: {
          strengths: ['Strong React/Node.js experience', 'Perfect location match', 'Education requirements met'],
          weaknesses: ['Could benefit from more DevOps experience', 'Team lead experience desired'],
          recommendation: 'Highly recommended - excellent match for your profile'
        }
      },
      {
        id: 'scored-2',
        title: 'Frontend Developer',
        company: 'Digital Solutions Ltd',
        location: 'Sydney',
        postedAgo: '1 day',
        url: 'https://www.seek.com.au/job/mock-2',
        score: 85,
        scoreDetails: {
          skillsMatch: 90,
          experienceMatch: 82,
          educationMatch: 85,
          locationMatch: 70
        },
        analysis: {
          strengths: ['Excellent frontend skills match', 'Modern tech stack', 'Good company culture'],
          weaknesses: ['Location requires relocation', 'Slightly junior level'],
          recommendation: 'Good match - consider for portfolio expansion'
        }
      },
      {
        id: 'scored-3',
        title: 'Full Stack Developer',
        company: 'Innovation Hub',
        location: 'Melbourne',
        postedAgo: '3 days',
        url: 'https://www.seek.com.au/job/mock-3',
        score: 78,
        scoreDetails: {
          skillsMatch: 80,
          experienceMatch: 75,
          educationMatch: 82,
          locationMatch: 100
        },
        analysis: {
          strengths: ['Full stack opportunity', 'Great location', 'Learning opportunities'],
          weaknesses: ['Some technology gaps', 'Startup environment uncertainty'],
          recommendation: 'Moderate match - good for skill development'
        }
      }
    ];
    
    // Returning mock scored jobs
    res.json({ scoredJobs: mockScoredJobs });
    
  } catch (error) {
    console.error('❌ Error generating mock scored jobs:', error);
    res.status(500).json({ error: 'Failed to generate mock scored jobs' });
  }
};

module.exports = {
  getMockScoredJobs
};
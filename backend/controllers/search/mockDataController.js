/**
 * Mock Data Controller
 * Provides mock data for testing ScoredScreen and AnalyzedScreen
 * Split from testJobsController.js to maintain <300 line limit
 */

/**
 * Get mock scored jobs for testing ScoredScreen
 */
const getMockScoredJobs = async (req, res) => {
  try {
    console.log('🎯 Generating mock scored jobs for testing');
    
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
    
    console.log(`✅ Returning ${mockScoredJobs.length} mock scored jobs`);
    res.json({ scoredJobs: mockScoredJobs });
    
  } catch (error) {
    console.error('❌ Error generating mock scored jobs:', error);
    res.status(500).json({ error: 'Failed to generate mock scored jobs' });
  }
};

/**
 * Get mock analysis data for testing AnalyzedScreen
 */
const getMockAnalysis = async (req, res) => {
  try {
    console.log('🧠 Generating mock analysis data for testing');
    
    const mockAnalysisData = {
      jobId: 'mock-analysis-1',
      jobTitle: 'Senior Software Engineer',
      company: 'TechCorp Australia',
      url: 'https://www.seek.com.au/job/mock-1',
      overallScore: 92,
      analysis: {
        summary: 'This position represents an excellent career opportunity that aligns exceptionally well with your professional background. The role offers strong technical challenges while maintaining work-life balance.',
        
        strengths: [
          'Perfect technical stack alignment with React, Node.js, and modern JavaScript',
          'Company culture strongly emphasizes professional development and innovation',
          'Excellent location match in Melbourne CBD with flexible work arrangements',
          'Salary range 15% above current market average for similar roles',
          'Strong team collaboration environment with experienced senior developers'
        ],
        
        concerns: [
          'Role requires some DevOps experience which could be a learning curve',
          'Fast-paced startup environment may require longer hours during product launches',
          'Team lead responsibilities mentioned but not clearly defined in job description'
        ],
        
        recommendations: [
          'Highlight your React and Node.js projects prominently in application',
          'Research the company\'s recent product launches to show genuine interest',
          'Prepare examples of how you\'ve handled technical challenges in previous roles',
          'Consider taking a DevOps fundamentals course to address the skill gap',
          'Ask specific questions about team structure and leadership expectations during interview'
        ],
        
        fitScore: {
          technical: 95,
          cultural: 88,
          career: 90,
          compensation: 92,
          location: 100
        },
        
        nextSteps: [
          'Tailor resume to emphasize React/Node.js experience',
          'Prepare portfolio showcasing relevant technical projects',
          'Research company background and recent developments',
          'Schedule application submission for early morning (higher response rates)',
          'Follow up with hiring manager on LinkedIn after application'
        ]
      }
    };
    
    console.log('✅ Returning mock analysis data');
    res.json(mockAnalysisData);
    
  } catch (error) {
    console.error('❌ Error generating mock analysis:', error);
    res.status(500).json({ error: 'Failed to generate mock analysis' });
  }
};

module.exports = {
  getMockScoredJobs,
  getMockAnalysis
};
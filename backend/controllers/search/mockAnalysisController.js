/**
 * Mock Analysis Controller
 * Provides mock analysis data for testing AnalyzedScreen
 * Split from testJobsController.js to maintain <300 line limit
 */

/**
 * Get mock analysis data for testing AnalyzedScreen
 */
const getMockAnalysis = async (req, res) => {
  try {
    // Generating mock analysis data
    
    const mockAnalysisData = {
      jobTitle: 'Senior Software Engineer',
      company: 'TechCorp Australia',
      location: 'Melbourne',
      postedAgo: '2 days',
      url: 'https://www.seek.com.au/job/mock-1',
      analysis: {
        compatibility: 'Excellent match (92% compatibility). Your React and Node.js expertise aligns perfectly with their tech stack. Strong fit for senior role based on your 5+ years experience.',
        gaps: 'Minor gaps: DevOps experience (Docker/K8s) would strengthen application. Consider highlighting AWS certifications. Team leadership experience is desired but not mandatory.',
        companyInfo: 'TechCorp Australia: 200+ employees, fintech sector, strong growth (25% YoY). Excellent employee ratings (4.2/5 on Glassdoor). Known for innovation and work-life balance.',
        recruiterInfo: 'Sarah Johnson, Senior Tech Recruiter. Direct email: sarah.j@techcorp.com.au. Responds within 24-48 hours. Prefers detailed cover letter highlighting specific achievements.'
      },
      overallScore: 92,
      recommendations: [
        'Apply within 3 days - high competition expected',
        'Emphasize React/Node.js projects in application',
        'Mention willingness to learn DevOps tools',
        'Research their recent fintech products'
      ],
      nextSteps: [
        'Tailor resume to highlight relevant experience',
        'Prepare portfolio showcasing React applications',
        'Research company\'s recent product launches',
        'Draft personalized cover letter'
      ]
    };
    
    // Returning mock analysis data
    res.json(mockAnalysisData);
    
  } catch (error) {
    console.error('❌ Error generating mock analysis:', error);
    res.status(500).json({ error: 'Failed to generate mock analysis' });
  }
};

module.exports = {
  getMockAnalysis
};
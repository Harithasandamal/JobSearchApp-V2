const OpenAI = require('openai');
const workflowLogger = require('../utils/WorkflowLogger');

class EnhancedChatGPTService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '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'
    });
  }

  /**
   * Enhanced job requirements extraction with better categorization
   */
  async extractJobRequirements(jobDescription) {
    workflowLogger.logChatGPT('🤖 Enhanced job requirements extraction...');
    
    const prompt = `You are an expert HR analyst specializing in comprehensive job requirement extraction. Analyze the following job description and extract detailed requirements with enhanced categorization.

CRITICAL INSTRUCTIONS:
1. Extract specific, measurable qualifications and skills
2. Categorize requirements by importance and type
3. Identify both hard skills (technical) and soft skills (interpersonal)
4. Extract experience levels, certifications, and industry-specific requirements
5. Return a comprehensive JSON structure

ENHANCED JSON STRUCTURE:
{
  "mandatoryRequirements": [
    {
      "requirement": "Specific requirement text",
      "category": "technical|experience|certification|education",
      "priority": "critical|high|medium"
    }
  ],
  "preferredRequirements": [
    {
      "requirement": "Specific preferred requirement text",
      "category": "technical|experience|certification|education|soft_skill",
      "priority": "high|medium|low"
    }
  ],
  "responsibilities": [
    {
      "responsibility": "Specific responsibility text",
      "category": "technical|management|communication|analysis",
      "complexity": "high|medium|low"
    }
  ],
  "industryContext": "Extracted industry or domain context",
  "seniorityLevel": "junior|mid|senior|lead|executive"
}

EXTRACTION RULES:
- mandatoryRequirements: 3-5 items maximum (absolute must-haves)
- preferredRequirements: 5-8 items maximum (nice-to-haves)
- responsibilities: 8-10 items maximum (key job duties)
- Be specific about years, technologies, certifications, industries
- Include exact software names, frameworks, methodologies
- Consider transferable skills and related experience

JOB DESCRIPTION TO ANALYZE:
${jobDescription}

Return ONLY the JSON object, no additional text.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.1
      });

      const content = response.choices[0].message.content.trim();
      
      // Clean and parse JSON response
      let cleanedContent = content;
      const firstBrace = cleanedContent.indexOf('{');
      const lastBrace = cleanedContent.lastIndexOf('}');
      if (firstBrace > 0) cleanedContent = cleanedContent.substring(firstBrace);
      if (lastBrace < cleanedContent.length - 1) cleanedContent = cleanedContent.substring(0, lastBrace + 1);

      const extracted = JSON.parse(cleanedContent);
      
      // Validate and structure the result
      const result = {
        mandatoryRequirements: Array.isArray(extracted.mandatoryRequirements) 
          ? extracted.mandatoryRequirements.slice(0, 5) 
          : [],
        preferredRequirements: Array.isArray(extracted.preferredRequirements) 
          ? extracted.preferredRequirements.slice(0, 8) 
          : [],
        responsibilities: Array.isArray(extracted.responsibilities) 
          ? extracted.responsibilities.slice(0, 10) 
          : [],
        industryContext: extracted.industryContext || '',
        seniorityLevel: extracted.seniorityLevel || 'mid'
      };

      workflowLogger.logChatGPT('✅ Enhanced job requirements extracted:');
      workflowLogger.logChatGPT(`   Mandatory: ${result.mandatoryRequirements.length} items`);
      workflowLogger.logChatGPT(`   Preferred: ${result.preferredRequirements.length} items`);
      workflowLogger.logChatGPT(`   Responsibilities: ${result.responsibilities.length} items`);
      workflowLogger.logChatGPT(`   Industry: ${result.industryContext}`);
      workflowLogger.logChatGPT(`   Seniority: ${result.seniorityLevel}`);

      return result;
      
    } catch (error) {
      workflowLogger.logError('Error extracting enhanced job requirements', error.message);
      throw new Error(`Failed to extract enhanced job requirements: ${error.message}`);
    }
  }

  /**
   * Enhanced semantic matching with detailed analysis
   */
  async performEnhancedSemanticMatching(mandatoryRequirements, preferredRequirements, resumeContent) {
    workflowLogger.logChatGPT('🔍 Performing enhanced semantic matching...');
    
    const prompt = `You are an expert resume-job matching analyst with deep understanding of transferable skills and industry contexts. Perform a comprehensive analysis of resume-job compatibility.

CRITICAL INSTRUCTIONS:
1. Analyze each requirement individually against the resume
2. Consider transferable skills, related experience, and industry knowledge
3. Look for both exact matches and equivalent qualifications
4. Provide detailed reasoning for each match/no-match decision
5. Consider context, seniority level, and industry relevance

MATCHING CRITERIA:
- Experience: "3+ years" can match "4 years" or similar
- Education: "Bachelor's degree" can match "BS in Computer Science"
- Skills: "React" can match "React.js", "ReactJS", "Frontend development"
- Certifications: "PMP" can match "Project Management Professional"
- Industry: "Construction experience" can match "building", "infrastructure"
- Transferable: "Leadership" can match "team management", "supervision"

ENHANCED RETURN FORMAT:
{
  "mandatoryMatches": [
    {
      "requirement": "Original requirement text",
      "matched": true/false,
      "confidence": 0.0-1.0,
      "reasoning": "Detailed explanation of match/no-match",
      "resumeEvidence": "Specific evidence from resume",
      "category": "technical|experience|certification|education"
    }
  ],
  "preferredMatches": [
    {
      "requirement": "Original requirement text",
      "matched": true/false,
      "confidence": 0.0-1.0,
      "reasoning": "Detailed explanation of match/no-match",
      "resumeEvidence": "Specific evidence from resume",
      "category": "technical|experience|certification|education|soft_skill"
    }
  ],
  "overallAnalysis": {
    "strengths": ["List of candidate's strong areas"],
    "gaps": ["List of missing requirements"],
    "recommendations": ["Suggestions for improvement"],
    "compatibilityScore": 0-100
  }
}

MANDATORY REQUIREMENTS:
${JSON.stringify(mandatoryRequirements, null, 2)}

PREFERRED REQUIREMENTS:
${JSON.stringify(preferredRequirements, null, 2)}

RESUME CONTENT:
${resumeContent || 'No resume content provided.'}

Return ONLY the JSON object.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.1
      });

      const content = response.choices[0].message.content.trim();
      
      // Clean and parse JSON response
      let cleanedContent = content;
      const firstBrace = cleanedContent.indexOf('{');
      const lastBrace = cleanedContent.lastIndexOf('}');
      if (firstBrace > 0) cleanedContent = cleanedContent.substring(firstBrace);
      if (lastBrace < cleanedContent.length - 1) cleanedContent = cleanedContent.substring(0, lastBrace + 1);

      const matchResult = JSON.parse(cleanedContent);
      
      // Validate and structure the result
      const result = {
        mandatoryMatches: Array.isArray(matchResult.mandatoryMatches) 
          ? matchResult.mandatoryMatches.slice(0, mandatoryRequirements.length)
          : [],
        preferredMatches: Array.isArray(matchResult.preferredMatches) 
          ? matchResult.preferredMatches.slice(0, preferredRequirements.length)
          : [],
        overallAnalysis: matchResult.overallAnalysis || {
          strengths: [],
          gaps: [],
          recommendations: [],
          compatibilityScore: 0
        }
      };

      // Fill arrays to correct length if needed
      while (result.mandatoryMatches.length < mandatoryRequirements.length) {
        result.mandatoryMatches.push({
          requirement: mandatoryRequirements[result.mandatoryMatches.length]?.requirement || '',
          matched: false,
          confidence: 0,
          reasoning: 'No match found',
          resumeEvidence: 'No evidence in resume',
          category: 'unknown'
        });
      }
      
      while (result.preferredMatches.length < preferredRequirements.length) {
        result.preferredMatches.push({
          requirement: preferredRequirements[result.preferredMatches.length]?.requirement || '',
          matched: false,
          confidence: 0,
          reasoning: 'No match found',
          resumeEvidence: 'No evidence in resume',
          category: 'unknown'
        });
      }

      workflowLogger.logChatGPT('✅ Enhanced semantic matching completed:');
      workflowLogger.logChatGPT(`   Mandatory matches: ${result.mandatoryMatches.filter(m => m.matched).length} of ${mandatoryRequirements.length}`);
      workflowLogger.logChatGPT(`   Preferred matches: ${result.preferredMatches.filter(m => m.matched).length} of ${preferredRequirements.length}`);
      workflowLogger.logChatGPT(`   Overall score: ${result.overallAnalysis.compatibilityScore}%`);

      return result;
      
    } catch (error) {
      workflowLogger.logError('Error performing enhanced semantic matching', error.message);
      throw new Error(`Failed to perform enhanced semantic matching: ${error.message}`);
    }
  }

  /**
   * Enhanced compatibility score calculation with weighted scoring
   */
  calculateEnhancedCompatibilityScore(mandatoryMatches, preferredMatches, overallAnalysis) {
    // Weighted scoring based on requirement categories and confidence
    let mandatoryScore = 0;
    let preferredScore = 0;
    let totalMandatoryWeight = 0;
    let totalPreferredWeight = 0;

    // Calculate mandatory score with category weights
    mandatoryMatches.forEach(match => {
      const weight = this.getCategoryWeight(match.category);
      const score = match.matched ? match.confidence * weight : 0;
      mandatoryScore += score;
      totalMandatoryWeight += weight;
    });

    // Calculate preferred score with category weights
    preferredMatches.forEach(match => {
      const weight = this.getCategoryWeight(match.category);
      const score = match.matched ? match.confidence * weight : 0;
      preferredScore += score;
      totalPreferredWeight += weight;
    });

    // Normalize scores
    const normalizedMandatoryScore = totalMandatoryWeight > 0 ? (mandatoryScore / totalMandatoryWeight) * 100 : 0;
    const normalizedPreferredScore = totalPreferredWeight > 0 ? (preferredScore / totalPreferredWeight) * 60 : 0;
    
    // Calculate final score (mandatory 70%, preferred 30%)
    const finalScore = Math.round((normalizedMandatoryScore * 0.7) + (normalizedPreferredScore * 0.3));
    
    workflowLogger.logScoring('📊 Enhanced compatibility score calculation:');
    workflowLogger.logScoring(`   Mandatory score: ${normalizedMandatoryScore.toFixed(1)}%`);
    workflowLogger.logScoring(`   Preferred score: ${normalizedPreferredScore.toFixed(1)}%`);
    workflowLogger.logScoring(`   Final score: ${finalScore}%`);
    
    return {
      totalScore: finalScore,
      mandatoryScore: Math.round(normalizedMandatoryScore),
      preferredScore: Math.round(normalizedPreferredScore),
      mandatoryCount: mandatoryMatches.filter(m => m.matched).length,
      preferredCount: preferredMatches.filter(m => m.matched).length,
      detailedScores: {
        mandatory: mandatoryMatches.map(m => ({
          requirement: m.requirement,
          matched: m.matched,
          confidence: m.confidence,
          category: m.category
        })),
        preferred: preferredMatches.map(m => ({
          requirement: m.requirement,
          matched: m.matched,
          confidence: m.confidence,
          category: m.category
        }))
      },
      analysis: overallAnalysis
    };
  }

  /**
   * Get weight for different requirement categories
   */
  getCategoryWeight(category) {
    const weights = {
      'technical': 1.2,      // Technical skills are highly valued
      'experience': 1.0,     // Experience is standard weight
      'certification': 0.8,  // Certifications are good but not critical
      'education': 0.6,      // Education is foundational
      'soft_skill': 0.4      // Soft skills are important but less critical
    };
    return weights[category] || 1.0;
  }

  /**
   * Generate personalized recommendations based on analysis
   */
  async generateRecommendations(jobRequirements, matchingResults, resumeContent) {
    workflowLogger.logChatGPT('💡 Generating personalized recommendations...');
    
    const prompt = `You are an expert career coach. Based on the job requirements and resume analysis, provide personalized recommendations for the candidate.

ANALYSIS CONTEXT:
Job Requirements: ${JSON.stringify(jobRequirements, null, 2)}
Matching Results: ${JSON.stringify(matchingResults, null, 2)}
Resume Content: ${resumeContent.substring(0, 1000)}...

Provide recommendations in this JSON format:
{
  "immediateActions": [
    "Specific action item 1",
    "Specific action item 2",
    "Specific action item 3"
  ],
  "skillGaps": [
    {
      "skill": "Missing skill name",
      "priority": "high|medium|low",
      "suggestion": "How to acquire this skill"
    }
  ],
  "resumeImprovements": [
    "Specific resume improvement 1",
    "Specific resume improvement 2"
  ],
  "careerAdvice": [
    "Career development advice 1",
    "Career development advice 2"
  ]
}

Focus on actionable, specific recommendations that can help the candidate improve their job compatibility.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      const content = response.choices[0].message.content.trim();
      
      // Clean and parse JSON response
      let cleanedContent = content;
      const firstBrace = cleanedContent.indexOf('{');
      const lastBrace = cleanedContent.lastIndexOf('}');
      if (firstBrace > 0) cleanedContent = cleanedContent.substring(firstBrace);
      if (lastBrace < cleanedContent.length - 1) cleanedContent = cleanedContent.substring(0, lastBrace + 1);

      const recommendations = JSON.parse(cleanedContent);
      
      workflowLogger.logChatGPT('✅ Personalized recommendations generated');
      
      return recommendations;
      
    } catch (error) {
      workflowLogger.logError('Error generating recommendations', error.message);
      return {
        immediateActions: ['Review the job requirements carefully'],
        skillGaps: [],
        resumeImprovements: ['Ensure all relevant skills are clearly listed'],
        careerAdvice: ['Focus on continuous learning and skill development']
      };
    }
  }
}

module.exports = EnhancedChatGPTService; 
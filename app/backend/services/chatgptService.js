const OpenAI = require('openai');
const workflowLogger = require('../utils/WorkflowLogger');

class ChatGPTService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: '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'
    });
  }

  /**
   * Extract job requirements with enhanced structure analysis
   */
  async extractJobRequirements(jobDescription) {
    workflowLogger.logChatGPT('🤖 Extracting job requirements using enhanced analysis...');
    
    // Use gpt-3.5-turbo for cost efficiency
    const prompt = `Analyze this job description and extract requirements in this EXACT JSON format:

{
  "mandatoryRequirements": ["requirement1", "requirement2", "requirement3"],
  "preferredRequirements": ["requirement1", "requirement2", "requirement3", "requirement4", "requirement5"],
  "responsibilities": ["responsibility1", "responsibility2", "responsibility3", "responsibility4", "responsibility5"],
  "employerQuestions": ["question1", "question2", "question3", "question4", "question5"]
}

RULES:
- mandatoryRequirements: 3 MAX, only absolute must-haves (qualifications, certifications, specific experience)
- preferredRequirements: 5 MAX, nice-to-haves that give advantage
- responsibilities: 5 MAX, key job duties from "Key Responsibilities" section
- employerQuestions: 5 MAX, extract from "Employer questions" section only

EXAMPLES:
- "3+ years experience" ✓
- "Bachelor degree" ✓  
- "PMP certification" ✓
- "Microsoft Office experience" ✓
- "Good communication" ✗ (too generic)

JOB DESCRIPTION:
${jobDescription}

Return ONLY the JSON object.`;

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // More cost-effective
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 500, // Reduced for cost efficiency
        temperature: 0.1
      }, { signal: controller.signal });
      
      clearTimeout(timeoutId);

      const content = response.choices[0].message.content.trim();
      
      // Clean the response to ensure it's valid JSON
      let cleanedContent = content;
      
      // Remove any text before the first {
      const firstBrace = cleanedContent.indexOf('{');
      if (firstBrace > 0) {
        cleanedContent = cleanedContent.substring(firstBrace);
      }
      
      // Remove any text after the last }
      const lastBrace = cleanedContent.lastIndexOf('}');
      if (lastBrace < cleanedContent.length - 1) {
        cleanedContent = cleanedContent.substring(0, lastBrace + 1);
      }

      const extracted = JSON.parse(cleanedContent);
      
      // Validate structure and enforce limits
      const result = {
        mandatoryRequirements: Array.isArray(extracted.mandatoryRequirements) 
          ? extracted.mandatoryRequirements.slice(0, 3) 
          : [],
        preferredRequirements: Array.isArray(extracted.preferredRequirements) 
          ? extracted.preferredRequirements.slice(0, 5) 
          : [],
        responsibilities: Array.isArray(extracted.responsibilities) 
          ? extracted.responsibilities.slice(0, 5) 
          : [],
        employerQuestions: Array.isArray(extracted.employerQuestions) 
          ? extracted.employerQuestions.slice(0, 5) 
          : []
      };

      workflowLogger.logChatGPT('✅ Enhanced extraction completed:');
      workflowLogger.logChatGPT(`   Mandatory: ${result.mandatoryRequirements.length} items`);
      workflowLogger.logChatGPT(`   Preferred: ${result.preferredRequirements.length} items`);
      workflowLogger.logChatGPT(`   Responsibilities: ${result.responsibilities.length} items`);
      workflowLogger.logChatGPT(`   Employer Questions: ${result.employerQuestions.length} items`);

      return result;
      
    } catch (error) {
      workflowLogger.logError('Error extracting job requirements', error.message);
      
      // Handle timeout specifically
      if (error.name === 'AbortError') {
        throw new Error('ChatGPT API request timed out after 10 seconds');
      }
      
      throw new Error(`Failed to extract job requirements: ${error.message}`);
    }
  }

  /**
   * Perform semantic matching with enhanced analysis
   */
  async performSemanticMatching(mandatoryRequirements, preferredRequirements, resumeContent) {
    workflowLogger.logChatGPT('🔍 Performing enhanced semantic matching...');
    
    const prompt = `Cross-check job requirements against resume. Return ONLY this JSON:

{
  "mandatoryMatches": [true/false, true/false, true/false],
  "preferredMatches": [true/false, true/false, true/false, true/false, true/false],
  "gaps": ["gap1", "gap2", "gap3"],
  "matchingDetails": {
    "mandatoryReasons": ["reason1", "reason2", "reason3"],
    "preferredReasons": ["reason1", "reason2", "reason3", "reason4", "reason5"]
  }
}

RULES:
- Mark as true if there's reasonable evidence in resume (be generous but accurate)
- Consider transferable skills and related experience
- For "Australian work rights" - mark true if resume mentions "Australian work rights" or "right to work"
- For "Driver's license" - mark true if resume mentions "driver's license" or "driving"
- For experience requirements - mark true if resume shows similar or transferable experience
- gaps: List only mandatory requirements that are clearly missing (max 3)
- Be fair and consider context

MANDATORY REQUIREMENTS:
${JSON.stringify(mandatoryRequirements, null, 2)}

PREFERRED REQUIREMENTS:
${JSON.stringify(preferredRequirements, null, 2)}

RESUME CONTENT:
${resumeContent || 'No resume content provided.'}`;

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // More cost-effective
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 400, // Reduced for cost efficiency
        temperature: 0.1
      }, { signal: controller.signal });
      
      clearTimeout(timeoutId);

      const content = response.choices[0].message.content.trim();
      
      // Clean the response to ensure it's valid JSON
      let cleanedContent = content;
      
      // Remove any text before the first {
      const firstBrace = cleanedContent.indexOf('{');
      if (firstBrace > 0) {
        cleanedContent = cleanedContent.substring(firstBrace);
      }
      
      // Remove any text after the last }
      const lastBrace = cleanedContent.lastIndexOf('}');
      if (lastBrace < cleanedContent.length - 1) {
        cleanedContent = cleanedContent.substring(0, lastBrace + 1);
      }

      const matchResult = JSON.parse(cleanedContent);
      
      // Validate and ensure arrays have correct length
      const result = {
        mandatoryMatches: Array.isArray(matchResult.mandatoryMatches) 
          ? matchResult.mandatoryMatches.slice(0, mandatoryRequirements.length)
          : new Array(mandatoryRequirements.length).fill(false),
        preferredMatches: Array.isArray(matchResult.preferredMatches) 
          ? matchResult.preferredMatches.slice(0, preferredRequirements.length)
          : new Array(preferredRequirements.length).fill(false),
        gaps: Array.isArray(matchResult.gaps) 
          ? matchResult.gaps.slice(0, 3)
          : [],
        matchingDetails: matchResult.matchingDetails || {
          mandatoryReasons: [],
          preferredReasons: []
        }
      };

      // Fill arrays to correct length if needed
      while (result.mandatoryMatches.length < mandatoryRequirements.length) {
        result.mandatoryMatches.push(false);
      }
      while (result.preferredMatches.length < preferredRequirements.length) {
        result.preferredMatches.push(false);
      }

      workflowLogger.logChatGPT('✅ Enhanced semantic matching completed:');
      workflowLogger.logChatGPT(`   Mandatory matches: ${result.mandatoryMatches.filter(Boolean).length} of ${mandatoryRequirements.length}`);
      workflowLogger.logChatGPT(`   Preferred matches: ${result.preferredMatches.filter(Boolean).length} of ${preferredRequirements.length}`);
      workflowLogger.logChatGPT(`   Gaps identified: ${result.gaps.length}`);

      return result;
      
    } catch (error) {
      workflowLogger.logError('Error performing semantic matching', error.message);
      
      // Handle timeout specifically
      if (error.name === 'AbortError') {
        throw new Error('ChatGPT API request timed out after 10 seconds');
      }
      
      throw new Error(`Failed to perform semantic matching: ${error.message}`);
    }
  }

  /**
   * Extract job data lists for the new scoring method
   */
  async extractJobDataLists(jobDescription) {
    workflowLogger.logChatGPT('🤖 Extracting job data lists for new scoring method...');
    
        // Use gpt-3.5-turbo for cost efficiency
    const prompt = `Analyze this job description and extract data in this EXACT JSON format:

{
  "mandatoryRequirements": ["requirement1", "requirement2", "requirement3"],
  "preferredRequirements": ["requirement1", "requirement2", "requirement3", "requirement4", "requirement5"],
  "responsibilities": ["responsibility1", "responsibility2", "responsibility3", "responsibility4", "responsibility5", "responsibility6", "responsibility7", "responsibility8"],
  "employerQuestions": ["question1", "question2", "question3", "question4", "question5"],
  "otherDetails": ["detail1", "detail2", "detail3"]
}

CRITICAL RULES:
1. DISTINCTNESS: Each item must appear in ONLY ONE list. No overlap between lists.
2. SUMMARIZED: Keep items short and distinct. Break long requirements into separate points.
3. COMPREHENSIVE: Extract ALL specific details mentioned in the job description.
4. ACCURACY: Pay close attention to words like "preferred", "is preferred", "would be an advantage" - these go in preferredRequirements, NOT mandatoryRequirements.

LIST SPECIFICATIONS:
- mandatoryRequirements: 3 MAX, ONLY absolute must-haves that are explicitly required (e.g., "Unlimited Australian working rights"). If it says "preferred" or "is preferred", it goes in preferredRequirements.
- preferredRequirements: 5 MAX, requirements that say "preferred", "is preferred", or are nice-to-haves that give advantage
- responsibilities: 8 MAX, key job duties and responsibilities (what the person will do)
- employerQuestions: 5 MAX, questions asked by employer or application requirements
- otherDetails: 3 MAX, generic keyword-type skills/qualities (e.g., "Communication", "Leadership", "Problem-solving")

EXAMPLES OF DISTINCT ITEMS:
- "Unlimited Australian working rights" (mandatory - explicitly required)
- "Degree qualification in an Engineering discipline (Mechanical, Industrial or Materials Engineering) is preferred" (preferred - says "is preferred")
- "Certification in process improvement techniques and tools such as Six Sigma, LEAN or KAIZEN" (preferred - unless explicitly stated as mandatory)
- "Knowledge of Engineering" (otherDetails)
- "Strong knowledge of manufacturing production processes" (otherDetails)
- "Identify and analyse critical production processes" (responsibilities)
- "Managing and leading critical continuous improvement projects" (responsibilities)

CRITICAL RULES FOR MANDATORY vs PREFERRED:
- If the text says "is preferred", "preferred", or "would be an advantage", it goes in preferredRequirements
- Only put items in mandatoryRequirements if they are EXPLICITLY stated as required without any preference language
- Working rights are typically mandatory
- Degrees and certifications are usually preferred unless explicitly stated as mandatory

SPECIFIC EXAMPLE: "Degree qualification in an Engineering discipline (Mechanical, Industrial or Materials Engineering) is preferred" MUST go in preferredRequirements because it says "is preferred"

IMPORTANT: If a certification is mentioned as mandatory, do NOT include it in preferred requirements. Each item should appear only once across all lists.

JOB DESCRIPTION:
${jobDescription}

Extract ALL specific details and ensure NO overlap between lists. 

BREAKDOWN RULES:
- If a requirement mentions multiple things (e.g., "Six Sigma, LEAN or KAIZEN"), break them into separate items
- If a requirement is long, break it into distinct, shorter points
- Each item should be specific and actionable

Return ONLY the JSON object.`;

    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for reliability
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // More cost-effective
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 800, // Increased for more detailed extraction
        temperature: 0.1
      }, { signal: controller.signal });
      
      clearTimeout(timeoutId);

      const content = response.choices[0].message.content.trim();
      
      // Clean the response to ensure it's valid JSON
      let cleanedContent = content;
      
      // Remove any text before the first {
      const firstBrace = cleanedContent.indexOf('{');
      if (firstBrace > 0) {
        cleanedContent = cleanedContent.substring(firstBrace);
      }
      
      // Remove any text after the last }
      const lastBrace = cleanedContent.lastIndexOf('}');
      if (lastBrace < cleanedContent.length - 1) {
        cleanedContent = cleanedContent.substring(0, lastBrace + 1);
      }

      const extracted = JSON.parse(cleanedContent);
      
      // Validate structure and enforce limits
      const result = {
        mandatoryRequirements: Array.isArray(extracted.mandatoryRequirements) 
          ? extracted.mandatoryRequirements.slice(0, 3) 
          : [],
        preferredRequirements: Array.isArray(extracted.preferredRequirements) 
          ? extracted.preferredRequirements.slice(0, 5) 
          : [],
        responsibilities: Array.isArray(extracted.responsibilities) 
          ? extracted.responsibilities.slice(0, 8) 
          : [],
        employerQuestions: Array.isArray(extracted.employerQuestions) 
          ? extracted.employerQuestions.slice(0, 5) 
          : [],
        otherDetails: Array.isArray(extracted.otherDetails) 
          ? extracted.otherDetails.slice(0, 3) 
          : []
      };

      workflowLogger.logChatGPT('✅ Job data lists extraction completed');

      return result;
      
    } catch (error) {
      workflowLogger.logError('Error extracting job data lists', error.message);
      console.error('❌ ChatGPT extraction error details:', error);
      
      // Handle timeout specifically
        if (error.name === 'AbortError') {
    throw new Error('ChatGPT API request timed out after 45 seconds');
  }
      
      // Handle API errors
      if (error.response) {
        console.error('❌ ChatGPT API error:', error.response.data);
        throw new Error(`ChatGPT API error: ${error.response.data?.error?.message || error.message}`);
      }
      
      throw new Error(`Failed to extract job data lists: ${error.message}`);
    }
  }

  /**
   * Calculate compatibility score with enhanced analysis and gap penalty
   */
  calculateCompatibilityScore(mandatoryMatches, preferredMatches, gaps = []) {
    const mandatoryScore = mandatoryMatches.filter(Boolean).length * 40; // Increased from 30
    const preferredScore = preferredMatches.filter(Boolean).length * 25; // Increased from 20
    const baseScore = mandatoryScore + preferredScore;
    
    // Apply gap penalty: -20 points per gap (reduced from -40)
    const gapPenalty = gaps.length * 20;
    const totalScore = Math.max(0, baseScore - gapPenalty); // Ensure score doesn't go below 0
    
    // Convert to percentage (0-100)
    const maxPossibleScore = (mandatoryMatches.length * 40) + (preferredMatches.length * 25);
    const percentageScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
    
    workflowLogger.logScoring('📊 Enhanced compatibility score calculation:');
    workflowLogger.logScoring(`   Mandatory: ${mandatoryMatches.filter(Boolean).length} × 40 = ${mandatoryScore} points`);
    workflowLogger.logScoring(`   Preferred: ${preferredMatches.filter(Boolean).length} × 25 = ${preferredScore} points`);
    workflowLogger.logScoring(`   Base Score: ${baseScore} points`);
    workflowLogger.logScoring(`   Gaps: ${gaps.length} × (-20) = -${gapPenalty} points`);
    workflowLogger.logScoring(`   Final Score: ${totalScore} points (${percentageScore}%)`);
    
    return {
      totalScore: percentageScore, // Return percentage instead of raw score
      mandatoryScore,
      preferredScore,
      gapPenalty,
      gapCount: gaps.length,
      mandatoryCount: mandatoryMatches.filter(Boolean).length,
      preferredCount: preferredMatches.filter(Boolean).length
    };
  }
}

module.exports = ChatGPTService;
const fs = require('fs');
const JobUtils = require('./jobUtils');

/**
 * Parse ChatGPT analysis response
 * @param {string} analysisText - Raw analysis text from ChatGPT
 * @returns {Object} - Parsed analysis data
 */
const parseAnalysis = (analysisText) => {
  try {
    console.log('🔍 Parsing analysis text...');
    
    const result = {
      requiredSkills: [],
      preferredExperience: [],
      technicalRequirements: [],
      softSkills: [],
      responsibilities: [],
      compatibilityScore: 0
    };
    
    // Extract compatibility score
    const scoreMatch = analysisText.match(/Compatibility Score:\s*(\d+)/i);
    if (scoreMatch) {
      result.compatibilityScore = parseInt(scoreMatch[1]);
    }
    
    // Extract categories
    const categories = {
      'Required Skills & Qualifications': 'requiredSkills',
      'Preferred Experience & Background': 'preferredExperience',
      'Technical Requirements': 'technicalRequirements',
      'Soft Skills & Personal Qualities': 'softSkills',
      'Responsibilities & Duties': 'responsibilities'
    };
    
    let currentCategory = null;
    const lines = analysisText.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if this line starts a new category
      for (const [categoryName, categoryKey] of Object.entries(categories)) {
        if (trimmedLine.includes(categoryName)) {
          currentCategory = categoryKey;
          break;
        }
      }
      
      // If we're in a category and line starts with dash, it's a bullet point
      if (currentCategory && trimmedLine.startsWith('-')) {
        const content = trimmedLine.substring(1).trim();
        if (content && content !== '[Specific skill/qualification]' && 
            content !== '[Specific experience/background]' &&
            content !== '[Technical requirement]' &&
            content !== '[Soft skill/personal quality]' &&
            content !== '[Responsibility/duty]') {
          result[currentCategory].push(content);
        }
      }
    }
    
    // Ensure each category has exactly 5 items
    Object.keys(categories).forEach(categoryKey => {
      while (result[categoryKey].length < 5) {
        result[categoryKey].push('N/A');
      }
      // Trim to 5 items if more
      result[categoryKey] = result[categoryKey].slice(0, 5);
    });
    
    console.log('✅ Analysis parsed successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Error parsing analysis:', error.message);
    // Return default structure
    return {
      requiredSkills: ['N/A', 'N/A', 'N/A', 'N/A', 'N/A'],
      preferredExperience: ['N/A', 'N/A', 'N/A', 'N/A', 'N/A'],
      technicalRequirements: ['N/A', 'N/A', 'N/A', 'N/A', 'N/A'],
      softSkills: ['N/A', 'N/A', 'N/A', 'N/A', 'N/A'],
      responsibilities: ['N/A', 'N/A', 'N/A', 'N/A', 'N/A'],
      compatibilityScore: 50
    };
  }
};

/**
 * Flatten job analysis data structure
 * @param {Object} job - Job object with analysis data
 * @returns {Object} - Flattened job object
 */
const flattenJobAnalysis = (job) => {
  const flattenedJob = {
    ...job,
    score: job.compatibilityScore || job.analysis?.compatibilityScore || 0
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
  
  // If job has analysis data, flatten it to top level (legacy support)
  if (job.analysis) {
    // Handle both direct analysis structure (from JobScorer.js) and nested categories structure
    const analysisData = job.analysis.categories || job.analysis;
    return {
      ...flattenedJob,
      requiredSkills: analysisData.requiredSkills || [],
      preferredExperience: analysisData.preferredExperience || [],
      technicalRequirements: analysisData.technicalRequirements || [],
      softSkills: analysisData.softSkills || [],
      responsibilities: analysisData.responsibilities || []
    };
  }
  
  return flattenedJob;
};

/**
 * Validate search parameters
 * @param {Object} params - Search parameters
 * @returns {Object} - Validation result
 */
const validateSearchParams = (params) => {
  const { keyword, location, distance, postedAgo } = params;
  const errors = [];
  
  if (!location || location.trim() === '') {
    errors.push('Location is required');
  }
  
  if (!distance || distance.trim() === '') {
    errors.push('Distance is required');
  }
  
  if (!postedAgo || postedAgo.trim() === '') {
    errors.push('Posted within time is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};



/**
 * Save data to file
 * @param {string} filePath - File path
 * @param {any} data - Data to save
 * @returns {boolean} - Success status
 */
const saveToFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving to file ${filePath}:`, error.message);
    return false;
  }
};

/**
 * Read data from file
 * @param {string} filePath - File path
 * @returns {any|null} - Data or null if error
 */
const readFromFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error(`Error reading from file ${filePath}:`, error.message);
    return null;
  }
};



module.exports = {
  parseAnalysis,
  flattenJobAnalysis,
  validateSearchParams,
  saveToFile,
  readFromFile
}; 
// Unified JobScorer.js - Reconstructed
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
// Polyfill fetch for Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// OpenAI API configuration
const { OPENAI_API_KEY, OPENAI_API_URL, JOB_ANALYSIS_PROMPT } = require('./config/openai');
const OPENAI_MODEL = 'gpt-4';

// Get config from command line argument or use default
let config;
if (process.argv[2]) {
  try {
    const configPath = process.argv[2];
    const configData = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
  } catch (error) {
    console.error('Error reading config file:', error.message);
    process.exit(1);
  }
} else {
  config = {
    selectedJobs: [],
    resumeData: null,
    timestamp: new Date().toISOString()
  };
}

const logFile = 'backend/jobscorer_debug.log';
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, line);
  console.log(msg);
};

/**
 * Extract job description from SEEK page
 */
const extractJobDescription = async (page) => {
  try {
    log('Extracting job description...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    const jobDescription = await page.evaluate(() => {
      const selectors = [
        '[data-automation="jobDescription"]',
        '[data-testid="job-description"]',
        '.job-description',
        '.description',
        '.job-details',
        '[data-automation="normalJob"]',
        '.yvsb870',
        '.yvsb870 .yvsb870',
        'div[data-automation="jobDescription"]',
        'section[data-automation="jobDescription"]'
      ];
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.innerText || element.textContent || '';
          if (text.trim().length > 100) return text;
        }
      }
      // Fallback: find the largest visible text block
      let largestText = '';
      let largestLength = 0;
      const allDivs = Array.from(document.querySelectorAll('div'));
      for (const div of allDivs) {
        const style = window.getComputedStyle(div);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const text = div.innerText || div.textContent || '';
        if (text.length > largestLength && text.length > 200 && text.length < 10000) {
          largestText = text;
          largestLength = text.length;
        }
      }
      return largestText;
    });
    if (!jobDescription.trim()) {
      // Save page HTML for debugging
      const pageHTML = await page.content();
      fs.writeFileSync('backend/jobscorer_failed_page.html', pageHTML);
      log('Saved failed page HTML to backend/jobscorer_failed_page.html');
      throw new Error('Could not find job description on the page');
    }
    log('Job description extracted. Length: ' + jobDescription.length);
    return jobDescription.trim();
  } catch (error) {
    log('Error in extractJobDescription: ' + error.message);
    throw error;
  }
};

/**
 * Extract requirements and responsibilities from job description using GPT-4
 */
const extractRequirementsAndResponsibilities = async (jobDescription) => {
  log('Extracting requirements and responsibilities...');
  const prompt = JOB_ANALYSIS_PROMPT.replace('{jobDescription}', jobDescription);
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 1200,
      temperature: 0.1
    })
  });
  if (!response.ok) {
    const errorData = await response.json();
    log('OpenAI API error: ' + (errorData.error?.message || response.statusText));
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
  }
  const data = await response.json();
  let result = { mandatory: [], preferred: [], responsibilities: [] };
  try {
    result = JSON.parse(data.choices[0].message.content);
    if (!Array.isArray(result.mandatory)) result.mandatory = [];
    if (!Array.isArray(result.preferred)) result.preferred = [];
    if (!Array.isArray(result.responsibilities)) result.responsibilities = [];
    log('Extracted mandatory: ' + JSON.stringify(result.mandatory));
    log('Extracted preferred: ' + JSON.stringify(result.preferred));
    log('Extracted responsibilities: ' + JSON.stringify(result.responsibilities));
  } catch (e) {
    log('Failed to parse requirements/responsibilities: ' + e.message);
    log('RAW GPT-4 RESPONSE: ' + data.choices[0].message.content);
    throw new Error('Failed to parse requirements/responsibilities from GPT-4 response');
  }
  return result;
};

/**
 * Score resume against mandatory and preferred requirements using GPT-4
 */
const scoreResumeAgainstRequirements = async (mandatory, preferred, resumeData) => {
  log('Scoring resume against requirements...');
  const prompt = `You are an expert job matching analyst. Compare the following resume to the job requirements and provide a JSON object with the following structure:
{
  "mandatoryMatches": [true/false, ...], // For each item in the mandatory list, true if the resume covers it (even with different words), else false
  "preferredMatches": [true/false, ...], // For each item in the preferred list, true if the resume covers it (even with different words), else false
}

A requirement is considered matched if the resume clearly covers it, even if phrased differently. Be strict but fair. Only return the JSON object, no explanation.

MANDATORY REQUIREMENTS:
${JSON.stringify(mandatory, null, 2)}

PREFERRED REQUIREMENTS:
${JSON.stringify(preferred, null, 2)}

RESUME CONTENT:
${resumeData?.content || 'No resume provided.'}`;
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 600,
      temperature: 0.1
    })
  });
  if (!response.ok) {
    const errorData = await response.json();
    log('OpenAI API error (scoring): ' + (errorData.error?.message || response.statusText));
    throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
  }
  const data = await response.json();
  let result = { mandatoryMatches: [], preferredMatches: [] };
  try {
    result = JSON.parse(data.choices[0].message.content);
    log('Scoring result: ' + JSON.stringify(result));
  } catch (e) {
    log('Failed to parse compatibility score: ' + e.message);
    throw new Error('Failed to parse compatibility score from GPT-4 response');
  }
  // Calculate score
  let score = 0;
  if (Array.isArray(result.mandatoryMatches)) {
    score += result.mandatoryMatches.filter(Boolean).length * 30;
  }
  if (Array.isArray(result.preferredMatches)) {
    score += result.preferredMatches.filter(Boolean).length * 20;
  }
  return {
    compatibilityScore: score,
    mandatoryMatches: result.mandatoryMatches,
    preferredMatches: result.preferredMatches
  };
};

/**
 * Main scoring function
 */
const scoreJobs = async () => {
  log('Starting scoreJobs...');
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const allResults = [];
    for (let i = 0; i < config.selectedJobs.length; i++) {
      const job = config.selectedJobs[i];
      try {
        log(`Processing job ${i + 1}: ${job.title} (${job.url})`);
        await page.goto(job.url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        const jobDescription = await extractJobDescription(page);
        // Extract requirements and responsibilities
        const { mandatory, preferred, responsibilities } = await extractRequirementsAndResponsibilities(jobDescription);
        // Score resume against requirements only
        const scoreResult = await scoreResumeAgainstRequirements(mandatory, preferred, config.resumeData);
        const result = {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.url,
          mandatory,
          preferred,
          responsibilities,
          ...scoreResult,
          timestamp: new Date().toISOString()
        };
        log('Final job result: ' + JSON.stringify(result));
        allResults.push(result);
        // Save after each job
        const configPath = process.argv[2] || 'default_config.json';
        const resultsPath = configPath.replace('.json', '_results.json');
        fs.writeFileSync(resultsPath, JSON.stringify({ jobs: allResults }, null, 2));
        log('Wrote results to ' + resultsPath);
      } catch (error) {
        log('Error processing job: ' + error.message);
        allResults.push({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.url,
          error: error.message,
          compatibilityScore: 0,
          timestamp: new Date().toISOString()
        });
      }
    }
    await browser.close();
    log('Browser closed.');
    return allResults;
  } catch (error) {
    log('Fatal error in scoreJobs: ' + error.message);
    if (browser) await browser.close();
    throw error;
  }
};

if (require.main === module) {
  scoreJobs()
    .then(() => {
      console.log('\n🎉 Job scoring completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Job scoring failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  scoreJobs,
  extractJobDescription,
  extractRequirementsAndResponsibilities,
  scoreResumeAgainstRequirements
}; 
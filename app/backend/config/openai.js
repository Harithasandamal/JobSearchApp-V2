// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Default model configuration
const DEFAULT_MODEL_CONFIG = {
  model: 'gpt-3.5-turbo',
  max_tokens: 2000,
  temperature: 0.3
};

// Job analysis prompt template
const JOB_ANALYSIS_PROMPT = `You are an expert at analyzing Australian job ads. Given the following job description, extract three lists in order of importance:

List 1: Mandatory Requirements (max 3) - Requirements that are explicitly demanded.
List 2: Preferred Requirements (max 4) - Requirements that are preferred but not strictly required.
List 3: Responsibilities (max 7) - Main duties and responsibilities.

Return your answer as a JSON object with the following structure:
{
  "mandatory": ["item1", "item2", ...],
  "preferred": ["item1", ...],
  "responsibilities": ["item1", ...]
}

Do not include any extra text, explanation, or formatting. Only output valid JSON.

Job Description:
{jobDescription}`;

module.exports = {
  OPENAI_API_KEY,
  OPENAI_API_URL,
  DEFAULT_MODEL_CONFIG,
  JOB_ANALYSIS_PROMPT
}; 
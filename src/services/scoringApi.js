const API_BASE_URL = 'http://localhost:3002/api';

class ScoringApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Start job scoring process
  async startScoring(selectedJobs, resumeData = null) {
    try {
      let response;
      if (resumeData && resumeData.file) {
        // Send as FormData
        const formData = new FormData();
        formData.append('selectedJobs', JSON.stringify(selectedJobs));
        formData.append('resumeFile', resumeData.file, resumeData.name);
        response = await fetch(`${this.baseUrl}/score-jobs`, {
          method: 'POST',
          body: formData
        });
      } else {
        // Fallback to JSON
        response = await fetch(`${this.baseUrl}/score-jobs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            selectedJobs,
            resumeData
          }),
        });
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error starting scoring:', error);
      throw error;
    }
  }

  // Get scoring status and results
  async getScoringStatus(processId) {
    try {
      const response = await fetch(`${this.baseUrl}/scoring-status/${processId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting scoring status:', error);
      throw error;
    }
  }

  // Poll for scoring results with progress updates
  async pollScoringResults(processId, onProgress, onComplete, onError) {
    const pollInterval = 2000; // Poll every 2 seconds
    const maxAttempts = 300; // Max 10 minutes (300 * 2 seconds)
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        const status = await this.getScoringStatus(processId);

        // Call progress callback
        if (onProgress) {
          onProgress(status);
        }

        // Check if scoring is complete
        if (status.status === 'completed') {
          if (onComplete) {
            onComplete(status);
          }
          return;
        }

        // Check if scoring failed
        if (status.status === 'failed') {
          if (onError) {
            onError(new Error('Scoring failed'));
          }
          return;
        }

        // Check if we've exceeded max attempts
        if (attempts >= maxAttempts) {
          if (onError) {
            onError(new Error('Scoring timeout'));
          }
          return;
        }

        // Continue polling
        setTimeout(poll, pollInterval);
      } catch (error) {
        if (onError) {
          onError(error);
        }
      }
    };

    // Start polling
    poll();
  }
}

// Create singleton instance
const scoringApiService = new ScoringApiService();

export default scoringApiService; 
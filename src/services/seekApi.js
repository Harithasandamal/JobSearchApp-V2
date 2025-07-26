const API_BASE_URL = 'http://localhost:3002/api';

class SeekApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Start a new job search
  async startSearch(searchParams, testMode = false) {
    try {
      const params = { ...searchParams };
      if (testMode) params.testMode = true;
      console.log('🔍 API Service sending search params:', JSON.stringify(params, null, 2));
      console.log('🔍 Request body being sent:', JSON.stringify(searchParams));
      
      const response = await fetch(`${this.baseUrl}/search-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting search:', error);
      throw error;
    }
  }

  // Get search status and results
  async getSearchStatus(processId) {
    try {
      const response = await fetch(`${this.baseUrl}/search-status/${processId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting search status:', error);
      throw error;
    }
  }

  // Stop a search
  async stopSearch(processId) {
    try {
      const response = await fetch(`${this.baseUrl}/search-stop/${processId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error stopping search:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }

  // Poll for search results with progress updates
  async pollSearchResults(processId, onProgress, onComplete, onError) {
    const pollInterval = 2000; // Poll every 2 seconds
    const maxAttempts = 150; // Max 5 minutes (150 * 2 seconds)
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        const status = await this.getSearchStatus(processId);

        // Call progress callback
        if (onProgress) {
          onProgress(status);
        }

        // Check if search is complete
        if (status.status === 'completed') {
          if (onComplete) {
            onComplete(status);
          }
          return;
        }

        // Check if search failed
        if (status.status === 'failed') {
          if (onError) {
            onError(new Error('Search failed'));
          }
          return;
        }

        // Check if we've exceeded max attempts
        if (attempts >= maxAttempts) {
          if (onError) {
            onError(new Error('Search timeout'));
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

  // Fetch real test jobs from backend
  async fetchRealTestJobs() {
    try {
      const response = await fetch(`${this.baseUrl}/test-jobs`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.jobs || [];
    } catch (error) {
      console.error('Error fetching real test jobs:', error);
      throw error;
    }
  }

  // Fetch parsed job details for a given processId
  async fetchJobDetails(processId) {
    try {
      const response = await fetch(`${this.baseUrl}/job-details/${processId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.jobs || [];
    } catch (error) {
      console.error('Error fetching job details:', error);
      throw error;
    }
  }
}

// Create singleton instance
const seekApiService = new SeekApiService();

export default seekApiService; 
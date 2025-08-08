const API_BASE_URL = 'http://localhost:3002/api';

class SeekApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Start a new job search using enhanced fast search
  async startSearch(searchParams, testMode = false) {
    try {
      // Determine mode based on testMode
      const mode = testMode ? 'light' : 'dark';
      
      // Format parameters for enhanced fast search
      const enhancedParams = {
        keyword: searchParams.keyword || '',
        location: searchParams.location,
        distance: searchParams.distance,
        postedAgo: searchParams.postedAgo,
        mode: mode
      };
      
      console.log('🔍 API Service sending enhanced search params:', JSON.stringify(enhancedParams, null, 2));
      
      const response = await fetch(`${this.baseUrl}/enhanced-fast-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enhancedParams),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting enhanced search:', error);
      throw error;
    }
  }

  // Get enhanced fast search status and results
  async getSearchStatus(processId) {
    try {
      const response = await fetch(`${this.baseUrl}/enhanced-fast-search-status/${processId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting enhanced search status:', error);
      throw error;
    }
  }

  // Stop enhanced fast search
  async stopSearch(processId) {
    try {
      const response = await fetch(`${this.baseUrl}/enhanced-fast-search-stop/${processId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error stopping enhanced search:', error);
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
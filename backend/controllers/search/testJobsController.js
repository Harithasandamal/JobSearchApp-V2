/**
 * Get test jobs for light mode testing - SCRAPE REAL JOB DETAILS
 * Light mode: Visit 3 sample job URLs to collect actual job details
 */
const { scrapeJobDetails } = require('./jobScrapingUtils');

const getTestJobs = async (req, res) => {
  try {
    console.log('🌞 LIGHT MODE - Scraping real job details from sample URLs');
    
    // Updated sample job URLs as requested by user
    const sampleUrls = [
      'https://www.seek.com.au/job/85922270?ref=search-standalone&type=standard&origin=jobTitle#sol=40451a6d77ede368f079afaaa3392cf57401a2e8',
      'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=f5c442d9c765b69183c0a9f36e76c3773779cff4',
      'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=ac705abd43f8e7aa11c57e26bdd7ef8de3e67313'
    ];
    
    const jobs = [];
    
    for (let i = 0; i < sampleUrls.length; i++) {
      const url = sampleUrls[i];
      console.log(`🔍 LIGHT MODE - Scraping job ${i + 1}/3: ${url}`);
      
      try {
        // Set reasonable timeout for each job (longer than before since URLs work)
        const jobDetails = await Promise.race([
          scrapeJobDetails(url),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Scraping timeout after 20 seconds')), 20000)
          )
        ]);
        
        console.log(`✅ LIGHT MODE - Successfully scraped job ${i + 1}:`, {
          title: jobDetails.title,
          company: jobDetails.company,
          location: jobDetails.location,
          postedAgo: jobDetails.postedAgo
        });
        
        // Use the actual scraped data
        jobs.push({
          id: `light-scraped-${i + 1}`,
          title: jobDetails.title || 'Unknown Title',
          company: jobDetails.company || 'Unknown Company', 
          location: jobDetails.location || 'Unknown Location',
          postedAgo: jobDetails.postedAgo || 'Recently posted',
          url: url
        });
        
        console.log(`✅ LIGHT MODE - Job ${i + 1} added to results`);
        
      } catch (error) {
        console.error(`❌ LIGHT MODE - Failed to scrape job ${i + 1}: ${error.message}`);
        
        // Fallback with error info but realistic structure
        jobs.push({
          id: `light-error-${i + 1}`,
          title: 'Unable to load job details',
          company: 'Scraping timeout', 
          location: 'Check connection',
          postedAgo: 'Unknown',
          url: url
        });
      }
      
      // Add small delay between requests to be respectful
      if (i < sampleUrls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Sort jobs by posted time (most recent first)
    console.log('🔄 LIGHT MODE - Sorting jobs by posted time...');
    jobs.sort((a, b) => {
      const parseTime = (timeStr) => {
        if (!timeStr || timeStr === 'Unknown' || timeStr === 'Recently posted') return Infinity;
        
        // Extract number and unit from strings like "3d ago", "1d ago", "4d ago"
        const match = timeStr.match(/(\d+)\s*([dhm])/);
        if (match) {
          const num = parseInt(match[1]);
          const unit = match[2];
          
          // Convert to minutes for comparison
          switch (unit) {
            case 'm': return num; // minutes
            case 'h': return num * 60; // hours to minutes
            case 'd': return num * 60 * 24; // days to minutes
            default: return Infinity;
          }
        }
        
        // Handle "today", "yesterday" etc
        if (timeStr.toLowerCase().includes('today')) return 0;
        if (timeStr.toLowerCase().includes('yesterday')) return 60 * 24;
        
        return Infinity; // Unknown format, put at end
      };
      
      const aTime = parseTime(a.postedAgo);
      const bTime = parseTime(b.postedAgo);
      
      return aTime - bTime; // Ascending order (most recent = smallest number)
    });
    
    console.log(`✅ LIGHT MODE - Completed scraping and sorting. Returning ${jobs.length} real job details`);
    console.log('📋 LIGHT MODE - Sorted job list:', jobs.map(j => ({ id: j.id, title: j.title, postedAgo: j.postedAgo })));
    
    return res.json({ jobs });
    
  } catch (error) {
    console.error('❌ LIGHT MODE - Critical error:', error);
    
    // Emergency fallback only if everything fails
    const emergencyJobs = [
      { 
        id: 'emergency-1', 
        title: 'Error loading jobs', 
        company: 'System error', 
        location: 'Check logs', 
        postedAgo: 'Unknown', 
        url: 'https://www.seek.com.au/job/85922270?ref=search-standalone&type=standard&origin=jobTitle#sol=40451a6d77ede368f079afaaa3392cf57401a2e8' 
      }
    ];
    
    res.json({ jobs: emergencyJobs });
  }
};

module.exports = {
  getTestJobs
}; 
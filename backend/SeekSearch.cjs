const SeekScraper = require('./scrapers/SeekScraper');

// Main execution function
(async () => {
  try {
    // Get config path from command line arguments
    const configPath = process.argv[2];
    if (!configPath) {
      throw new Error('Config path is required as first argument');
    }
    
    console.log(`[DEBUG] Starting SeekScraper with config: ${configPath}`);
    
    const scraper = new SeekScraper();
    await scraper.run(configPath);
    
    console.log(`[DEBUG] SeekScraper completed successfully`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
})(); 
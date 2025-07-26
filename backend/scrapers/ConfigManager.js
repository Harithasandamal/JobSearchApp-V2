const fs = require('fs');

class ConfigManager {
  static loadConfig(configPath = null) {
    let config;
    
    // Use provided configPath or fall back to command line argument
    const pathToLoad = configPath || process.argv[2];
    
    if (pathToLoad) {
      try {
        const configData = fs.readFileSync(pathToLoad, 'utf8');
        config = JSON.parse(configData);
        console.log(`[DEBUG] Config loaded from: ${pathToLoad}`);
      } catch (error) {
        console.error('Error reading config file:', error.message);
        process.exit(1);
      }
    } else {
      // Default configuration
      config = {
        site: 'SEEK',
        distance: '25km',
        location: 'Dandenong',
        postedAgo: '3 days',
        keyword: '', // No default keyword - make it optional
        maxResults: 20
      };
      console.log('[DEBUG] Using default configuration');
    }
    
    return config;
  }
  
  static validateConfig(config) {
    if (!config.location) {
      throw new Error('Location is required');
    }
    
    if (!config.distance) {
      throw new Error('Distance is required');
    }
    
    if (!config.postedAgo) {
      throw new Error('PostedAgo is required');
    }
    
    return true;
  }
  
  static getConfigPath() {
    return process.argv[2];
  }
}

module.exports = ConfigManager; 
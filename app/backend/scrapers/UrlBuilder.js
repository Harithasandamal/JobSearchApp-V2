const fs = require('fs');
const path = require('path');

class UrlBuilder {
  // Load Melbourne suburbs data for postcode lookup
  static getMelbourneSuburbsData() {
    try {
      // Load the suburbs data from the frontend data file
      const suburbsPath = path.join(__dirname, '../../../src/data/melbourneSuburbs.js');
      const suburbsContent = fs.readFileSync(suburbsPath, 'utf8');
      
      // Extract the JSON data from the export statement, handling comments
      const jsonMatch = suburbsContent.match(/export const melbourneSuburbs = (\[[\s\S]*?\]);/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[1];
        
        // Remove JavaScript comments (both // and /* */ style)
        jsonStr = jsonStr
          .replace(/\/\/.*$/gm, '')  // Remove single-line comments
          .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove multi-line comments
          .replace(/,\s*}/g, '}')  // Clean up trailing commas before closing braces
          .replace(/,\s*]/g, ']');  // Clean up trailing commas before closing brackets
        
        // Convert to proper JSON format
        jsonStr = jsonStr
          .replace(/'/g, '"')  // Replace single quotes with double quotes
          .replace(/(\w+):/g, '"$1":');  // Quote object keys
        
        return JSON.parse(jsonStr);
      }
    } catch (error) {
      console.log(`⚠️ Could not load Melbourne suburbs data: ${error.message}`);
    }
    return [];
  }

  // Enrich location with state and postcode if available - enhanced to match SEEK dropdown behavior
  static enrichLocationWithPostcode(location) {
    const suburbs = this.getMelbourneSuburbsData();
    


    
    // Handle complex area names that should NOT be enriched (preserve detailed area names)
    if (location.includes('&') || location.includes(' and ') || 
        location.match(/\b(North|South|East|West|Central|Inner|Outer|Greater)\s+(Melbourne|Sydney|Brisbane|Perth|Adelaide)\b/i) ||
        location.match(/(Bayside|Eastern|Western|Northern|Southern).*(Suburbs|Districts|Areas)/i) ||
        location.match(/\b\w+\s*&\s*\w+/i)) { // Any location with &
      // console.log(`🏘️ Complex area name detected - using as-is: "${location}"`);
      return location;
    }
    
    // If location contains comma, analyze both parts
    let targetLocation = location;
    if (location.includes(',')) {
      const beforeComma = location.split(',')[0].trim();
      const afterComma = location.split(',')[1] ? location.split(',')[1].trim() : '';
      
      // If before comma is a complex area name, use the whole thing
      if (beforeComma.length > 10 && (beforeComma.includes('&') || beforeComma.includes(' and ') || beforeComma.split(' ').length >= 3)) {
        return location; // Use the full location as-is
      }
      
      // Otherwise try to enrich the more specific part (before comma)
      targetLocation = beforeComma;
    }
    
    // Normalize input location for comparison
    const normalizedInput = targetLocation.trim().toLowerCase();
    
    // Try to find exact match first (case insensitive)
    let matchedSuburb = suburbs.find(suburb => 
      suburb.name.toLowerCase() === normalizedInput
    );
    
    // If no exact match, try partial match for compound names like "Dandenong South"
    if (!matchedSuburb && normalizedInput.includes(' ')) {
      matchedSuburb = suburbs.find(suburb => 
        suburb.name.toLowerCase().includes(normalizedInput) ||
        normalizedInput.includes(suburb.name.toLowerCase())
      );
    }
    
    // If still no match, try fuzzy matching for suburbs with similar names
    if (!matchedSuburb) {
      const words = normalizedInput.split(/\s+/);
      const primaryWord = words[0]; // Get the main suburb name
      
      matchedSuburb = suburbs.find(suburb => {
        const suburbWords = suburb.name.toLowerCase().split(/\s+/);
        return suburbWords[0] === primaryWord || suburb.name.toLowerCase().includes(primaryWord);
      });
    }
    
    if (matchedSuburb) {
      // Build the exact format that SEEK uses: "SuburbName VIC PostCode"
      const enrichedLocation = `${matchedSuburb.name} VIC ${matchedSuburb.postcode}`;
      return enrichedLocation;
    }
    
    // If no match found, check if location already has proper VIC/state info
    const hasStatePattern = location.match(/\b(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\b/i);
    const hasPostcodePattern = location.match(/\b\d{4}\b/);
    
    if (hasStatePattern && hasPostcodePattern) {
      return location;
    }
    
    if (hasStatePattern && !hasPostcodePattern) {
      return location;
    }
    
    // Last resort: add VIC if it's likely a Victorian location
    const likelyVicSuburbs = ['melbourne', 'geelong', 'ballarat', 'bendigo', 'shepparton', 'warrnambool'];
    const isLikelyVic = likelyVicSuburbs.some(vic => normalizedInput.includes(vic));
    
    if (isLikelyVic) {
      const enrichedLocation = `${location} VIC`;
      // console.log(`🏘️ Added VIC to likely Victorian location: "${location}" → "${enrichedLocation}"`);
      return enrichedLocation;
    }
    
    // Ultimate fallback: use as-is (reduced logging)
    // console.log(`❌ Could not enrich location "${location}" - no match found in suburbs data`);
    // console.log(`💡 Consider adding this location to the suburbs database for better accuracy`);
    return location;
  }

  // Extract numeric values from form inputs
  static extractDays(postedAgo) {
    return postedAgo.replace(/[^\d]/g, '') || '3'; // Extract numbers, default to 3
  }

  static extractDistance(distance) {
    return distance.replace(/[^\d]/g, '') || '25'; // Extract numbers, default to 25
  }

  // Build SEEK search URL - Simple structure for 2 cases
  static buildSeekUrl(keyword, location, distance, postedAgo) {
    // Extract numeric values from form inputs
    const days = this.extractDays(postedAgo);
    const distanceKm = this.extractDistance(distance);
    
    // Enrich location with postcode
    const enrichedLocation = this.enrichLocationWithPostcode(location);
    
    // Clean location for URL path: "Dandenong VIC 3175" → "Dandenong-VIC-3175"
    const locationPath = enrichedLocation
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9\-]/g, '')
      .replace(/-+/g, '-');
    
    // Build URL structure based on keyword presence
    let baseUrl;
    if (keyword && keyword.trim()) {
      // WITH KEYWORD: https://www.seek.com.au/[Keyword]-jobs/in-[Location]
      const keywordPath = keyword.trim()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^./, keyword.trim().charAt(0).toUpperCase());
      baseUrl = `https://www.seek.com.au/${keywordPath}-jobs/in-${locationPath}`;
    } else {
      // WITHOUT KEYWORD: https://www.seek.com.au/jobs/in-[Location]
      baseUrl = `https://www.seek.com.au/jobs/in-${locationPath}`;
    }
    
    // Add query parameters
    const url = `${baseUrl}?daterange=${days}&distance=${distanceKm}&sortmode=ListedDate`;
    
    return url;
  }
  
  // Parse posted ago text to days for filtering
  static parsePostedAgoToDays(postedAgo) {
    if (!postedAgo || typeof postedAgo !== 'string') {
      return Infinity;
    }
    
    const lower = postedAgo.toLowerCase().trim();
    
    // Handle featured jobs - return special value to indicate they need detail scraping
    if (lower.includes('featured') || lower.includes('sponsor') || lower.includes('promoted')) {
      return -1; // Special value to indicate featured job that needs detail scraping
    }
    
    // Handle "X days ago", "X day ago" OR "X days", "X day" (formatted)
    const dayMatch = lower.match(/(\d+)\s*days?\s*(?:ago)?/);
    if (dayMatch) {
      const days = parseInt(dayMatch[1]);
      console.log(`📅 Parsed "${days} days"`);
      return days;
    }
    
    // Handle "X hours ago", "X hour ago" OR "X hours", "X hour" (formatted)
    const hourMatch = lower.match(/(\d+)\s*hours?\s*(?:ago)?/);
    if (hourMatch) {
      const hours = parseInt(hourMatch[1]);
      const days = hours < 24 ? 1 : Math.ceil(hours / 24);
      console.log(`📅 Parsed ${hours} hours as ${days} days`);
      return days;
    }
    
    // Handle "X minutes ago", "X minute ago" OR "X minutes", "X minute" (formatted)
    const minuteMatch = lower.match(/(\d+)\s*minutes?\s*(?:ago)?/);
    if (minuteMatch) {
      console.log(`📅 Parsed minutes as 1 day`);
      return 1; // Minutes count as same day
    }
    
    // Handle short forms like "1d", "2h", "30m"
    const shortMatch = lower.match(/(\d+)\s*(d|h|m)(?:\s|$)/);
    if (shortMatch) {
      const num = parseInt(shortMatch[1]);
      const unit = shortMatch[2];
      if (unit === 'd') {
        console.log(`📅 Parsed short form ${num}d as ${num} days`);
        return num;
      }
      if (unit === 'h') {
        const days = num < 24 ? 1 : Math.ceil(num / 24);
        console.log(`📅 Parsed short form ${num}h as ${days} days`);
        return days;
      }
      if (unit === 'm') {
        console.log(`📅 Parsed short form ${num}m as 1 day`);
        return 1;
      }
    }
    
    // Handle "today", "yesterday"
    if (lower.includes('today') || lower.includes('just now')) {
      console.log(`📅 Parsed "${lower}" as 0 days`);
      return 0;
    }
    if (lower.includes('yesterday')) {
      console.log(`📅 Parsed "${lower}" as 1 day`);
      return 1;
    }
    
    // Handle specific dates (be lenient and assume recent)
    if (lower.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) || lower.match(/\d{1,2}-\d{1,2}-\d{2,4}/)) {
      console.log(`📅 Found date format, assuming recent (3 days)`);
      return 3;
    }
    
    console.log(`⚠️ Could not parse date format: "${postedAgo}" - excluding`);
    return Infinity;
  }
}

module.exports = UrlBuilder; 
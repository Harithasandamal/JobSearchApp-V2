/**
 * Job Extraction Module
 * Handles DOM extraction of job data from SEEK pages
 */

class JobExtractor {
  /**
   * Extract job data from SEEK page
   * @param {Object} page - Puppeteer page object
   * @param {Object} config - Search configuration
   * @returns {Array} - Array of extracted job objects
   */
  static async extractJobData(page, config) {
    try {
      // Try multiple selectors for job cards
      const jobCardSelectors = [
        '[data-testid="job-card"]',
        'article[data-automation="normalJob"]',
        'article[data-automation="premiumJob"]',
        'article',
        '.job-card',
        '[data-automation*="job"]'
      ];
      
      let jobCards = [];
      for (const selector of jobCardSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          jobCards = await page.$$(selector);
          if (jobCards.length > 0) {
            console.log(`✅ Found ${jobCards.length} job cards using selector: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`❌ Selector failed: ${selector}`);
        }
      }
      
      if (jobCards.length === 0) {
        console.log('❌ No job cards found with any selector, trying generic approach...');
        // Fallback: look for any elements that might contain job information
        jobCards = await page.$$('article, .job, [class*="job"], [data-automation*="job"]');
      }
      
      let jobs = await page.evaluate((jobCardCount) => {
        // Updated selectors based on current SEEK structure
        const getJobCards = () => {
          const selectors = [
            '[data-testid="job-card"]',
            'article[data-automation="normalJob"]',
            'article[data-automation="premiumJob"]',
            'article',
            '.job-card',
            '[data-automation*="job"]'
          ];
          
          for (const selector of selectors) {
            const cards = document.querySelectorAll(selector);
            if (cards.length > 0) {
              console.log(`Found ${cards.length} cards with ${selector}`);
              return Array.from(cards);
            }
          }
          return [];
        };
        
        const jobCards = getJobCards();
        const jobs = [];
        
        jobCards.forEach((card, index) => {
          if (index >= 20) return;
          try {
            // Debug: Log card content for first few cards
            if (index < 3) {
              console.log(`🔍 DEBUG Card ${index + 1} HTML:`, card.innerHTML.substring(0, 500));
              console.log(`🔍 DEBUG Card ${index + 1} Text:`, card.textContent.substring(0, 300));
            }
            
            // Extract job data using helper functions
            const title = this.extractTitle(card);
            const url = this.extractUrl(card);
            const company = this.extractCompany(card);
            const location = this.extractLocation(card);
            const postedAgo = this.extractPostedAgo(card);
            
            // Final debug log for this job
            console.log(`📝 Job ${index + 1} final data: Title="${title}", Company="${company}", Location="${location}", Posted="${postedAgo}"`);
            
            const id = url || `${title}-${company}-${location}`;
            jobs.push({
              id: id,
              title: title,
              company: company,
              location: location,
              postedAgo: postedAgo,
              url: url
            });
          } catch (e) {
            console.error('Error parsing job card:', e);
          }
        });
        
        return jobs;
      }, jobCards.length);
      
      console.log(`📋 Jobs extracted from search results:`, jobs.map(j => `${j.title} @ ${j.company} (${j.location}) - ${j.postedAgo}`));
      
      return jobs;
    } catch (error) {
      console.error('❌ Error extracting job data:', error);
      return [];
    }
  }

  /**
   * Extract job title from card element
   * @param {Element} card - Job card DOM element
   * @returns {string} - Job title
   */
  static extractTitle(card) {
    let title = 'N/A';
    const titleSelectors = [
      '[data-automation="job-title"]',
      'a[data-automation="job-title"]',
      'h3 a[href*="/job/"]',
      'h2 a[href*="/job/"]',
      'a[href*="/job/"]',
      'h3 a',
      'h2 a',
      'h1 a',
      'a[href*="seek.com.au"]',
      '[role="link"]',
      'a[title]'
    ];
    
    for (const selector of titleSelectors) {
      const titleEl = card.querySelector(selector);
      if (titleEl && titleEl.textContent.trim()) {
        title = titleEl.textContent.trim();
        console.log(`✅ Found title via ${selector}: "${title}"`);
        break;
      }
    }
    
    // If still no title, try any prominent text
    if (title === 'N/A') {
      const headings = card.querySelectorAll('h1, h2, h3, h4, h5, h6');
      for (const heading of headings) {
        if (heading.textContent.trim()) {
          title = heading.textContent.trim();
          console.log(`✅ Found title from heading: "${title}"`);
          break;
        }
      }
    }
    
    return title;
  }

  /**
   * Extract job URL from card element
   * @param {Element} card - Job card DOM element
   * @returns {string} - Job URL
   */
  static extractUrl(card) {
    let url = '';
    
    // Try to find URL from any link in the card
    const allLinks = card.querySelectorAll('a');
    for (const link of allLinks) {
      if (link.href && (link.href.includes('/job/') || link.href.includes('seek.com.au'))) {
        url = link.href;
        console.log(`✅ Found URL: "${url}"`);
        break;
      }
    }
    
    return url;
  }

  /**
   * Extract company name from card element
   * @param {Element} card - Job card DOM element
   * @returns {string} - Company name
   */
  static extractCompany(card) {
    let company = 'N/A';
    const companySelectors = [
      '[data-automation="job-company"]',
      'a[data-automation="job-company"]',
      '[data-automation="advertiser-name"]',
      'a[data-automation="advertiser-name"]', // Primary SEEK company selector
      '[data-automation*="company"]',
      'a[href*="/companies/"]', // Links to company pages
      '.company-name',
      '.company'
    ];
    
    for (const selector of companySelectors) {
      const companyEl = card.querySelector(selector);
      if (companyEl && companyEl.textContent.trim()) {
        const companyText = companyEl.textContent.trim();
        // Filter out promotional text
        if (!companyText.toLowerCase().includes('be an early applicant') && 
            !companyText.toLowerCase().includes('apply now') &&
            !companyText.toLowerCase().includes('quick apply') &&
            companyText.length > 1 && companyText.length < 100) {
          company = companyText;
          console.log(`✅ Found company via ${selector}: "${company}"`);
          break;
        }
      }
    }
    
    // Enhanced fallback: Look for company in links that aren't job links
    if (company === 'N/A') {
      const allLinks = card.querySelectorAll('a');
      for (const link of allLinks) {
        const linkText = link.textContent.trim();
        const href = link.href || '';
        
        // Skip promotional text and job links
        if (linkText && 
            linkText !== title && 
            !href.includes('/job/') && 
            !linkText.toLowerCase().includes('be an early applicant') &&
            !linkText.toLowerCase().includes('apply now') &&
            !linkText.toLowerCase().includes('quick apply') &&
            linkText.length > 2 && linkText.length < 60) {
          company = linkText;
          console.log(`✅ Found company from company link: "${company}"`);
          break;
        }
      }
    }
    
    // Last resort: look for company-like text (but avoid promotional text)
    if (company === 'N/A') {
      const textNodes = card.querySelectorAll('span, div');
      for (const node of textNodes) {
        const text = node.textContent.trim();
        if (text && 
            text !== title && 
            text.length > 2 && text.length < 60 && 
            !text.includes('ago') && 
            !text.includes('day') && 
            !text.includes('hour') &&
            !text.toLowerCase().includes('be an early applicant') &&
            !text.toLowerCase().includes('apply now') &&
            !text.toLowerCase().includes('quick apply') &&
            !text.toLowerCase().includes('posted') &&
            !text.toLowerCase().includes('featured')) {
          company = text;
          console.log(`✅ Found company from text node: "${company}"`);
          break;
        }
      }
    }

    return company;
  }

  /**
   * Extract location from card element
   * @param {Element} card - Job card DOM element
   * @returns {string} - Job location
   */
  static extractLocation(card) {
    let location = 'N/A';
    
    // First, try the most common SEEK location data attributes
    const locationSelectors = [
      '[data-automation="jobLocation"]',
      '[data-automation="job-location"]',
      'span[data-automation="jobLocation"]',
      'div[data-automation="jobLocation"]',
      '[data-testid*="location"]',
      '.job-location',
      '.location'
    ];
    
    // Try standard location selectors first
    for (const selector of locationSelectors) {
      try {
        const locationEl = card.querySelector(selector);
        if (locationEl && locationEl.textContent.trim()) {
          const extractedLocation = locationEl.textContent.trim();
          
          // Only accept if it looks like a location (contains VIC or city names)
          if (extractedLocation.match(/\b(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\b/i) || 
              extractedLocation.match(/\b(Melbourne|Sydney|Brisbane|Perth|Adelaide|Hobart|Darwin|Canberra)\b/i)) {
            location = extractedLocation;
            console.log(`✅ Found location via selector ${selector}: "${location}"`);
            break;
          }
        }
      } catch (e) {
        // Skip invalid selectors
      }
    }
    
    // Fallback: Search through all text elements for location patterns
    if (location === 'N/A') {
      console.log(`🔍 Location not found with selectors, searching in text elements...`);
      
      // Search all spans and divs for location-like text, but be more selective
      const allElements = card.querySelectorAll('span, div, p');
      for (const element of allElements) {
        const text = element.textContent.trim();
        
        // Skip if text is too long (likely not just a location)
        if (text.length > 100) continue;
        
        // PRIORITY: Look for complete suburb + Melbourne VIC patterns first
        const completeLocationPatterns = [
          /^([A-Za-z\s&]+),\s*Melbourne\s+VIC/i,
          /^([A-Za-z\s&]+)\s+Melbourne\s+VIC/i,
          /^([A-Za-z\s&]+),\s*VIC/i,
        ];
        
        // Check for complete location patterns first
        for (const pattern of completeLocationPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            const suburb = match[1].trim();
            // Skip if it contains job-related keywords
            if (!suburb.match(/\b(Apply|Save|View|Job|Posted|ago|early|applicant|Featured|Manager|Engineer|Developer|Analyst|Consultant|Specialist|Officer|Assistant|Coordinator|Administrator|Supervisor|Director|Lead|Senior|Junior|Graduate|Experience|years|Full|Part|time|Salary|Benefits|Casual|Contract|Permanent|This|is|a|Be|an|Vacation|Company|Pty|Ltd|Limited)\b/i)) {
              // Reconstruct the complete location for proper downstream processing
              location = text.trim(); // Keep the full format for downstream cleaning
              console.log(`✅ Found complete location in text element: "${location}" (suburb: "${suburb}")`);
              break;
            }
          }
        }
        
        if (location !== 'N/A') break;
        
        // Fallback: Look for text that contains location patterns but is reasonably short
        if (text.match(/\b(VIC|NSW|QLD|WA|SA|TAS|ACT|NT)\b/i) ||
            text.match(/\b(Melbourne|Sydney|Brisbane|Perth|Adelaide|Hobart|Darwin|Canberra)\b/i)) {
          
          // Skip if it contains obvious non-location keywords
          if (text.match(/\b(Apply|Save|View|Job|Posted|ago|early|applicant|Featured|Manager|Engineer|Developer|Analyst|Consultant|Specialist|Officer|Assistant|Coordinator|Administrator|Supervisor|Director|Lead|Senior|Junior|Graduate|Experience|years|Full|Part|time|Salary|Benefits|Casual|Contract|Permanent|This|is|a|Be|an|Vacation|Company|Pty|Ltd|Limited)\b/i)) {
            continue;
          }
          
          // Check if this element contains a clean location format
          let cleanText = text;
          
          // Try to extract just the location part using specific patterns
          const locationPatterns = [
            // Full location format: "Suburb, Melbourne VIC 3000"
            /^([A-Za-z\s&]+),\s*Melbourne\s+VIC\s*\d*$/i,
            // Location with state: "Suburb VIC 3000"
            /^([A-Za-z\s&]+)\s+VIC\s*\d*$/i,
            // Just suburb and state: "Suburb, VIC"
            /^([A-Za-z\s&]+),\s*VIC$/i,
            // City format: "Melbourne VIC"
            /^(Melbourne)\s+VIC\s*\d*$/i,
            // Just city: "Melbourne"
            /^(Melbourne)$/i,
            // Clean suburb name only (if it contains no job-related words)
            /^([A-Za-z\s&]+)$/i
          ];
          
          for (const pattern of locationPatterns) {
            const match = cleanText.match(pattern);
            if (match && match[1]) {
              const extractedLocation = match[1].trim();
              
              // Additional validation: ensure it looks like a place name
              if (extractedLocation.length >= 3 && extractedLocation.length <= 50 &&
                  !extractedLocation.match(/\b(Apply|Save|View|Job|Posted|ago|early|applicant|Featured|Manager|Engineer|Developer|Analyst|Consultant|Specialist|Officer|Assistant|Coordinator|Administrator|Supervisor|Director|Lead|Senior|Junior|Graduate|Experience|years|Full|Part|time|Salary|Benefits|Casual|Contract|Permanent|This|is|a|Be|an|Vacation|Company|Pty|Ltd|Limited)\b/i)) {
                
                // If we found a complete location with comma, preserve it for downstream processing
                if (text.includes(',') && text.toLowerCase().includes('melbourne')) {
                  location = text.trim();
                } else {
                  location = extractedLocation;
                }
                console.log(`✅ Found clean location in text element: "${location}" (from: "${text}")`);
                break;
              }
            }
          }
          
          if (location !== 'N/A') break;
        }
      }
    }
    
    // Final fallback: Pattern matching in full card text
    if (location === 'N/A') {
      console.log(`🔍 Final fallback: searching full card text...`);
      const cardText = card.textContent || '';
      
      // Look for common SEEK location patterns in full text - prioritize complete suburb + city strings
      const locationPatterns = [
        // PRIORITY: Complete suburb + Melbourne patterns (most specific first)
        /([A-Za-z\s&]+),\s*Melbourne\s+VIC[^A-Za-z]*/gi,
        /([A-Za-z\s&]+)\s+Melbourne\s+VIC[^A-Za-z]*/gi,
        // State patterns with suburbs
        /([A-Za-z\s&]+),\s*VIC[^A-Za-z]*/gi,
        /([A-Za-z\s&]+)\s+VIC[^A-Za-z]*/gi,
        // Only use these if no suburb is found
        /(Melbourne\s+VIC[^A-Za-z]*)/gi,
        /(Melbourne)/gi
      ];
      
      for (const pattern of locationPatterns) {
        const matches = cardText.match(pattern);
        if (matches && matches[0]) {
          // For the first 4 patterns, we want the captured group (suburb)
          // For the last 2 patterns, we want the full match (Melbourne)
          let foundLocation;
          
          if (pattern.source.includes('([A-Za-z\\s&]+)')) {
            // This pattern captures the suburb part
            const match = cardText.match(pattern);
            if (match && match[1]) {
              foundLocation = match[1].trim();
              // If we found a suburb, reconstruct the full location for proper downstream cleaning
              if (cardText.toLowerCase().includes('melbourne') && !foundLocation.toLowerCase().includes('melbourne')) {
                foundLocation = foundLocation + ', Melbourne VIC';
              }
            }
          } else {
            // This pattern matches Melbourne-only
            foundLocation = matches[0].trim();
          }
          
          if (foundLocation) {
            // Skip if it's obviously not a location
            if (!foundLocation.match(/^(Apply|Save|View|Job|Posted|ago|early|applicant|Featured)/i) &&
                foundLocation.length < 100 &&
                foundLocation.length > 2) {
              location = foundLocation;
              console.log(`✅ Found location via pattern: "${location}"`);
              break;
            }
          }
        }
      }
    }
    
    // Debug: Log the raw location before cleaning
    console.log(`🔍 Raw location before cleaning: "${location}"`);
    
    return location;
  }

  /**
   * Extract posted time from card element
   * @param {Element} card - Job card DOM element
   * @returns {string} - Posted time
   */
  static extractPostedAgo(card) {
    let postedAgo = 'N/A';
    const postedAgoSelectors = [
      '[data-automation="job-posted-date"]',
      '[data-automation*="date"]',
      'time',
      'span[title*="ago"]',
      'div[title*="ago"]',
      '[class*="date"]',
      '[class*="time"]',
      '[datetime]'
    ];
    
    for (const selector of postedAgoSelectors) {
      const postedEl = card.querySelector(selector);
      if (postedEl) {
        const text = postedEl.textContent.trim() || postedEl.title || postedEl.getAttribute('datetime') || postedEl.getAttribute('title');
        if (text) {
          postedAgo = text;
          break;
        }
      }
    }
    
    // If still no posted time, search in text content
    if (postedAgo === 'N/A') {
      const allText = card.textContent;
      const timePatterns = [
        /(\d+)([dhm])\s*ago/g,
        /(\d+)\s*(minute|hour|day|week)s?\s*ago/gi,
        /(yesterday|just now)/gi,
        /(today)/gi,
        /(featured|sponsor|promoted)/gi
      ];
      
      for (const pattern of timePatterns) {
        const matches = allText.match(pattern);
        if (matches && matches[0]) {
          postedAgo = matches[0];
          break;
        }
      }
      
      if (postedAgo === 'N/A') {
        postedAgo = '1 day ago';
      }
    }
    
    return postedAgo;
  }
}

module.exports = JobExtractor; 
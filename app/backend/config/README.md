# Optimized Scraping Configuration

This directory contains configuration files for the optimized scraping system.

## Files

### `testUrls.json`
Configuration file for test URLs used in light mode testing.

**Structure:**
```json
{
  "sampleUrls": [
    "https://www.seek.com.au/job/85981995?ref=recom-homepage&pos=4&sp=3&origin=jobTitle#sol=941dd2919d55ebc790f6017d3e00d197d7ce28a0",
    "https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=f5c442d9c765b69183c0a9f36e76c3773779cff4",
    "https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=ac705abd43f8e7aa11c57e26bdd7ef8de3e67313"
  ],
  "lastUpdated": "2025-02-08T11:45:00.000Z",
  "description": "Test URLs for light mode. Update when URLs expire.",
  "maxUrls": 5,
  "recommendedUpdateFrequency": "weekly"
}
```

**Fields:**
- `sampleUrls`: Array of test job URLs for light mode
- `lastUpdated`: Timestamp of last update
- `description`: Description of the configuration
- `maxUrls`: Maximum number of URLs allowed
- `recommendedUpdateFrequency`: How often to update URLs

## Usage

### Updating Test URLs
When test URLs expire, update them in `testUrls.json`:

1. Find new job URLs from SEEK
2. Replace the URLs in the `sampleUrls` array
3. Update the `lastUpdated` timestamp
4. Test the new URLs using the test script

### Test Scripts
Use the provided test scripts to validate the optimized scraping:

```bash
# Test optimized scraping functionality
npm run test:optimized

# Rollback to previous version if needed
npm run test:rollback

# Update test URLs in config
npm run test:update-urls
```

## Optimization Features

### Speed Optimizations
- **Reduced timeouts**: 20s for initial URL collection, 15s per job
- **Optimized browser instances**: 3 browsers for better stability
- **Reduced retry attempts**: 2 retries for faster completion
- **Parallel processing**: Multiple jobs processed simultaneously

### Reliability Enhancements
- **Multiple strategies**: Fallback URL collection methods
- **Enhanced error handling**: Better error recovery
- **Config-based URLs**: Easy URL updates without code changes
- **Separate light/dark modes**: Independent optimization for each mode

### Performance Monitoring
- **Test reports**: Detailed performance analysis
- **Rollback capability**: Easy restoration of previous versions
- **Error tracking**: Comprehensive error logging

## Maintenance

### Weekly Tasks
1. Check if test URLs are still valid
2. Update URLs if they've expired
3. Run test script to validate changes
4. Monitor performance metrics

### Monthly Tasks
1. Review optimization parameters
2. Update browser configurations if needed
3. Analyze test reports for trends
4. Consider performance improvements

## Troubleshooting

### Common Issues
1. **URLs expired**: Update `testUrls.json` with new URLs
2. **Scraping timeouts**: Check network connectivity
3. **Browser errors**: Verify Puppeteer installation
4. **Performance issues**: Review optimization parameters

### Rollback Process
If optimization causes issues:
1. Run `npm run test:rollback`
2. Verify previous version works
3. Investigate the issue
4. Re-implement fixes carefully

## Performance Targets

- **Light Mode**: < 30 seconds for 3 jobs
- **Dark Mode**: < 60 seconds for 10 jobs
- **Success Rate**: > 95% for both modes
- **Error Rate**: < 5% for both modes 
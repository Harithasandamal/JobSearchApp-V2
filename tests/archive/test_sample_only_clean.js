/**
 * QUICK SAMPLE JOBS TEST - 10s timeout, clean output
 */

const { scrapeAllJobsUnified } = require('../backend/controllers/search/jobScrapingUtils');

const SAMPLE_URLS = [
  'https://www.seek.com.au/job/85981995?ref=search-standalone&type=standard&origin=jobTitle#sol=014f12b9189e0a6d2c275dd68ab2722888ade58a',
  'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=014f12b9189e0a6d2c275dd68ab2722888ade58b',
  'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=014f12b9189e0a6d2c275dd68ab2722888ade58c'
];

const testSampleJobs = async () => {
  console.log('🧪 CLEAN SAMPLE JOBS TEST');
  console.log('=========================');
  console.log('🔧 10s timeout, 5 browsers, proper error handling\n');
  
  try {
    const startTime = Date.now();
    console.log('🚀 Starting parallel scraping...');
    
    const jobs = await scrapeAllJobsUnified(SAMPLE_URLS);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Filter successful vs failed jobs
    const successful = jobs.filter(job => job.title && job.title.trim() !== '');
    const failed = jobs.filter(job => !job.title || job.title.trim() === '');
    
    console.log('\n📊 CLEAN RESULTS TABLE');
    console.log('='.repeat(80));
    console.log('| # | Status | Title (25 chars)      | Company (20 chars)  | Posted    |');
    console.log('='.repeat(80));
    
    SAMPLE_URLS.forEach((url, index) => {
      const job = jobs.find(j => j.url === url) || jobs[index] || {};
      const num = (index + 1).toString().padStart(2, ' ');
      const status = job.title && job.title.trim() !== '' ? '✅' : '❌';
      const title = (job.title || 'TIMEOUT/FAILED').substring(0, 25).padEnd(25, ' ');
      const company = (job.company || 'N/A').substring(0, 20).padEnd(20, ' ');
      const posted = (job.postedAgo || 'N/A').substring(0, 9).padEnd(9, ' ');
      
      console.log(`| ${num} | ${status}     | ${title} | ${company} | ${posted} |`);
    });
    
    console.log('='.repeat(80));
    console.log(`📈 SUCCESS: ${successful.length}/${SAMPLE_URLS.length} jobs (${((successful.length / SAMPLE_URLS.length) * 100).toFixed(1)}%)`);
    console.log(`⚡ PERFORMANCE: ${duration}s total, 5 browsers, 10s timeout`);
    
    if (successful.length === SAMPLE_URLS.length) {
      console.log('\n🎉 ALL SAMPLE JOBS SCRAPED SUCCESSFULLY!');
    } else {
      console.log(`\n⚠️ ${failed.length} job(s) failed - likely due to 10s timeout or site issues`);
    }
    
  } catch (error) {
    console.error(`\n💥 TEST FAILED: ${error.message}`);
  }
  
  console.log('\n👋 Sample test complete');
  setTimeout(() => process.exit(0), 2000);
};

testSampleJobs();
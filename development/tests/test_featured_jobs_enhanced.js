/**
 * Test Enhanced Featured Job Handling
 * Tests the new featured job detection and parallel processing functionality
 */

const { scrapeBasicJobInfoFromSearchResults } = require('../../app/backend/controllers/search/searchResultsScraper');

class FeaturedJobsEnhancedTest {
  constructor() {
    this.results = {
      totalJobs: 0,
      featuredJobs: 0,
      regularJobs: 0,
      jobsWithPostedTime: 0,
      jobsWithoutPostedTime: 0,
      processingTime: 0
    };
  }

  async testFeaturedJobsEnhanced() {
    console.log('🧪 Testing Enhanced Featured Job Handling');
    console.log('==========================================');
    
    const startTime = Date.now();
    
    try {
      // Test URL with actual SEEK structure that matches app's search format
      const testUrl = 'https://www.seek.com.au/jobs/in-Dandenong-VIC-3175?daterange=3&distance=5&sortmode=ListedDate';
      
      console.log(`🔍 Testing URL: ${testUrl}`);
      console.log(`📊 Extracting jobs with enhanced featured job handling...`);
      
      const jobs = await scrapeBasicJobInfoFromSearchResults(testUrl, 15);
      
      this.results.totalJobs = jobs.length;
      this.results.processingTime = Date.now() - startTime;
      
      // Analyze results
      this.analyzeResults(jobs);
      this.printSummary();
      
      return jobs;
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      throw error;
    }
  }

  analyzeResults(jobs) {
    console.log('\n📊 Analysis Results:');
    console.log('====================');
    
    jobs.forEach((job, index) => {
      const featuredStatus = job.isFeatured ? '[FEATURED]' : '[REGULAR]';
      const postedTime = job.postedAgo || 'No Date';
      const tempId = job.tempId || 'No Temp ID';
      
      console.log(`${index + 1}. ${featuredStatus} ${job.title}`);
      console.log(`   Company: ${job.company}`);
      console.log(`   Location: ${job.location}`);
      console.log(`   Posted: ${postedTime}`);
      console.log(`   Temp ID: ${tempId}`);
      console.log(`   Original Index: ${job.originalIndex}`);
      console.log(`   Needs Individual Visit: ${job.needsIndividualVisit}`);
      console.log('');
      
      // Count statistics
      if (job.isFeatured) {
        this.results.featuredJobs++;
      } else {
        this.results.regularJobs++;
      }
      
      if (job.postedAgo && job.postedAgo.trim() !== '') {
        this.results.jobsWithPostedTime++;
      } else {
        this.results.jobsWithoutPostedTime++;
      }
    });
  }

  printSummary() {
    console.log('\n📈 Summary:');
    console.log('===========');
    console.log(`Total Jobs: ${this.results.totalJobs}`);
    console.log(`Featured Jobs: ${this.results.featuredJobs}`);
    console.log(`Regular Jobs: ${this.results.regularJobs}`);
    console.log(`Jobs with Posted Time: ${this.results.jobsWithPostedTime}`);
    console.log(`Jobs without Posted Time: ${this.results.jobsWithoutPostedTime}`);
    console.log(`Processing Time: ${this.results.processingTime}ms`);
    
    const featuredSuccessRate = this.results.featuredJobs > 0 
      ? (this.results.jobsWithPostedTime / this.results.totalJobs * 100).toFixed(1)
      : 0;
    
    console.log(`\n✅ Featured Job Success Rate: ${featuredSuccessRate}%`);
    
    if (this.results.jobsWithoutPostedTime > 0) {
      console.log(`⚠️  ${this.results.jobsWithoutPostedTime} jobs still missing posted times`);
    } else {
      console.log(`🎉 All jobs have posted times!`);
    }
  }

  async run() {
    try {
      await this.testFeaturedJobsEnhanced();
      console.log('\n✅ Enhanced Featured Job Test Completed Successfully');
    } catch (error) {
      console.error('\n❌ Enhanced Featured Job Test Failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const test = new FeaturedJobsEnhancedTest();
  test.run();
}

module.exports = FeaturedJobsEnhancedTest; 
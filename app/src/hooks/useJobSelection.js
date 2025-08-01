import { useState, useEffect, useCallback, useMemo } from 'react';

const useJobSelection = (scoredJobs) => {
  const [selectedJobId, setSelectedJobId] = useState(null);

  // Auto-select first job when screen loads and handle selection validation
  useEffect(() => {
    console.log('🔍 ScoredJobs changed:', scoredJobs?.length, 'jobs');
    console.log('🔍 Current selectedJobId:', selectedJobId);
    
    if (scoredJobs && scoredJobs.length > 0) {
      // Check if current selection is still valid
      if (selectedJobId && !scoredJobs.some(job => job.id === selectedJobId)) {
        console.log('🔍 Selected job no longer exists, clearing selection');
        setSelectedJobId(null);
      }
      
      // Auto-select first job if no selection
      if (!selectedJobId) {
        const firstJobId = scoredJobs[0].id;
        console.log('🔍 Auto-selecting first job:', firstJobId);
        setSelectedJobId(firstJobId);
      }
    } else {
      // Clear selection if no jobs
      if (selectedJobId) {
        console.log('🔍 No jobs available, clearing selection');
        setSelectedJobId(null);
      }
    }
  }, [scoredJobs]); // Removed selectedJobId from dependencies to prevent infinite loops

  const handleJobSelection = useCallback((jobId) => {
    console.log('🔍 Job selection clicked:', jobId);
    console.log('🔍 Available jobs:', scoredJobs?.map(j => j.id));
    
    // Verify the job exists before selecting it
    const jobExists = scoredJobs?.some(job => job.id === jobId);
    if (jobExists) {
      setSelectedJobId(jobId);
    } else {
      console.warn('⚠️ Attempted to select job that does not exist:', jobId);
    }
  }, [scoredJobs]);

  const selectedJob = useMemo(() => 
    scoredJobs?.find(job => job.id === selectedJobId) || null, 
    [scoredJobs, selectedJobId]
  );

  // Debug: Log the selected job structure
  useEffect(() => {
    if (selectedJob) {
      console.log('🔍 Selected job data:', selectedJob);
      console.log('🔍 Job analysis structure:', selectedJob.analysis);
      console.log('🔍 Job categories:', selectedJob.categories);
      
      // Debug: Check for flattened properties
      console.log('🔍 Required Skills:', selectedJob.requiredSkills);
      console.log('🔍 Preferred Experience:', selectedJob.preferredExperience);
      console.log('🔍 Technical Requirements:', selectedJob.technicalRequirements);
      console.log('🔍 Soft Skills:', selectedJob.softSkills);
      console.log('🔍 Responsibilities:', selectedJob.responsibilities);
      
      // Debug: Check for nested analysis structure
      if (selectedJob.analysis) {
        console.log('🔍 Analysis.categories:', selectedJob.analysis.categories);
        if (selectedJob.analysis.categories) {
          console.log('🔍 Categories.requiredSkills:', selectedJob.analysis.categories.requiredSkills);
          console.log('🔍 Categories.preferredExperience:', selectedJob.analysis.categories.preferredExperience);
        }
      }
    }
  }, [selectedJob]);

  return {
    selectedJobId,
    selectedJob,
    handleJobSelection,
    setSelectedJobId
  };
};

export default useJobSelection; 
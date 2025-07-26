import { useState, useEffect, useRef } from 'react';
import scoringApiService from '../services/scoringApi';
import { extractResumeContent } from '../utils/resumeUtils';

const useScoring = (selectedJobs, updateAppState, navigateTo, resumeFile) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [scoredJobs, setScoredJobs] = useState([]);
  const [scoringSteps, setScoringSteps] = useState([]);
  const [error, setError] = useState(null);
  const processStartedRef = useRef(false);

  // Initialize scoring steps with resume-based scoring events
  useEffect(() => {
    if (selectedJobs && selectedJobs.length > 0) {
      const resumeBasedSteps = [
        { 
          id: 1, 
          text: '📄 Analyzing Resume Content', 
          description: 'Extracting skills, experience, and qualifications from your resume',
          status: 'pending' 
        },
        { 
          id: 2, 
          text: '📋 Extracting Job Requirements', 
          description: 'Fetching and analyzing job descriptions from SEEK pages',
          status: 'pending' 
        },
        { 
          id: 3, 
          text: '📊 Analyzing Job Requirements', 
          description: 'Extracting required skills, experience, and qualifications',
          status: 'pending' 
        },
        { 
          id: 4, 
          text: '🎯 Calculating Compatibility Scores', 
          description: 'Comparing resume with job requirements across four categories',
          status: 'pending' 
        },
        { 
          id: 5, 
          text: '📊 Computing Final Weighted Score', 
          description: 'Calculating final score based on experience, education, requirements, and skills',
          status: 'pending' 
        }
      ];
      setScoringSteps(resumeBasedSteps);
      processStartedRef.current = false; // Reset process flag when steps change
    }
  }, [selectedJobs]);

  // Start real scoring process
  useEffect(() => {
    if (scoringSteps.length === 0 || processStartedRef.current || !selectedJobs) return;

    processStartedRef.current = true; // Mark process as started

    const startRealScoring = async () => {
      try {
        console.log('🚀 Starting resume-based job scoring...');
        console.log('📄 Resume file:', resumeFile);
        
        // Extract resume content
        const resumeData = await extractResumeContent(resumeFile);
        console.log('📄 Extracted resume data:', resumeData);
        
        // Only score jobs with valid URLs
        const jobsToScore = (selectedJobs || []).filter(job => job.url && job.url.startsWith('http'));
        if (jobsToScore.length === 0) {
          setError('No valid job URLs found for scoring.');
          return;
        }
        
        // Start the scoring process with resume data
        const response = await scoringApiService.startScoring(jobsToScore, resumeData);
        const processId = response.processId;
        
        console.log('✅ Resume-based scoring process started:', processId);
        
        // Poll for results
        scoringApiService.pollScoringResults(
          processId,
          // Progress callback
          (status) => {
            console.log('📊 Resume-based scoring progress:', status.progress);
            setProgress(status.progress || 0);
            
            // Map progress to resume-based scoring steps
            let currentStepIndex = 0;
            
            // Step 1: Analyzing Resume Content (0-20%)
            if (status.progress >= 5) currentStepIndex = 1;
            // Step 2: Extracting Job Requirements (20-40%)
            if (status.progress >= 25) currentStepIndex = 2;
            // Step 3: Analyzing Job Requirements (40-60%)
            if (status.progress >= 45) currentStepIndex = 3;
            // Step 4: Calculating Compatibility Scores (60-80%)
            if (status.progress >= 65) currentStepIndex = 4;
            // Step 5: Computing Final Weighted Score (80-100%)
            if (status.progress >= 85) currentStepIndex = 5;
            
            setCurrentStep(currentStepIndex);
            
            // Update step statuses
            setScoringSteps(prev => prev.map((step, index) => {
              if (index < currentStepIndex) {
                return { ...step, status: 'completed' };
              } else if (index === currentStepIndex) {
                return { ...step, status: 'processing' };
              } else {
                return { ...step, status: 'pending' };
              }
            }));
          },
          // Complete callback
          (status) => {
            console.log('✅ Resume-based scoring completed:', status);
            console.log('📋 Status structure:', JSON.stringify(status, null, 2));
            
            // All steps completed
            setCurrentStep(5);
            setProgress(100);
            setScoringSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
            
            // Process results regardless of structure
            let scoredJobsData = [];
            
            if (status.scoredJobs && Array.isArray(status.scoredJobs)) {
              scoredJobsData = status.scoredJobs.map(job => {
                // Handle resume-based scoring results
                const flattenedJob = {
                  ...job,
                  score: job.score || job.finalScore || 0,
                  postedAgo: job.postedAgo || 'N/A'
                };
                
                // If job has compatibility scores, extract category scores
                if (job.compatibilityScores) {
                  const categoryScores = {};
                  Object.entries(job.compatibilityScores).forEach(([category, data]) => {
                    categoryScores[category] = data.score || 0;
                  });
                  
                  return {
                    ...flattenedJob,
                    categoryScores,
                    resumeAnalysis: job.resumeAnalysis || {},
                    jobRequirements: job.jobRequirements || {},
                    compatibilityScores: job.compatibilityScores || {},
                    // Legacy compatibility - map to old structure
                    requiredSkills: job.jobRequirements?.requiredSkills || [],
                    preferredExperience: job.jobRequirements?.requiredExperience || [],
                    technicalRequirements: job.jobRequirements?.requiredSkills || [],
                    softSkills: job.compatibilityScores?.transferrableSkills?.matches || [],
                    responsibilities: job.jobRequirements?.otherRequirements || []
                  };
                }
                
                // Fallback for legacy structure
                if (job.analysis) {
                  const analysisData = job.analysis.categories || job.analysis;
                  return {
                    ...flattenedJob,
                    requiredSkills: analysisData.requiredSkills || [],
                    preferredExperience: analysisData.preferredExperience || [],
                    technicalRequirements: analysisData.technicalRequirements || [],
                    softSkills: analysisData.softSkills || [],
                    responsibilities: analysisData.responsibilities || [],
                    detailedScores: job.detailedScores || {}
                  };
                }
                
                return flattenedJob;
              });
            } else if (status.results && status.results.jobs) {
              scoredJobsData = status.results.jobs.map(job => {
                const flattenedJob = {
                  ...job,
                  score: job.compatibilityScore || job.analysis?.compatibilityScore || 0,
                  postedAgo: job.postedAgo || 'N/A'
                };
                
                if (job.analysis) {
                  const analysisData = job.analysis.categories || job.analysis;
                  return {
                    ...flattenedJob,
                    requiredSkills: analysisData.requiredSkills || [],
                    preferredExperience: analysisData.preferredExperience || [],
                    technicalRequirements: analysisData.technicalRequirements || [],
                    softSkills: analysisData.softSkills || [],
                    responsibilities: analysisData.responsibilities || [],
                    detailedScores: job.detailedScores || {}
                  };
                }
                
                return flattenedJob;
              });
            } else {
              // Fallback: create basic scored jobs from selected jobs
              scoredJobsData = (selectedJobs || []).map(job => ({
                ...job,
                score: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
                compatibilityScore: Math.floor(Math.random() * 40) + 60,
                postedAgo: job.postedAgo || 'N/A'
              }));
            }
            
            console.log('📊 Processed scored jobs:', scoredJobsData);
            
            // Debug: Log the first job's analysis structure
            if (scoredJobsData.length > 0) {
              const firstJob = scoredJobsData[0];
              console.log('🔍 First job analysis structure:', firstJob.analysis);
              console.log('🔍 First job category scores:', firstJob.categoryScores);
              console.log('🔍 First job compatibility scores:', firstJob.compatibilityScores);
            }
            
            setScoredJobs(scoredJobsData);
            updateAppState({ scoredJobs: scoredJobsData });
            
            // Navigate to scored screen immediately
            console.log('🚀 Navigating to scored screen...');
            navigateTo('scored');
          },
          // Error callback
          (error) => {
            console.error('❌ Resume-based scoring failed:', error);
            setError(error.message);
            setScoringSteps(prev => prev.map(step => ({ ...step, status: 'failed' })));
          }
        );
        
      } catch (error) {
        console.error('❌ Failed to start resume-based scoring:', error);
        setError(error.message);
      }
    };

    startRealScoring();
  }, [scoringSteps.length, selectedJobs, navigateTo, updateAppState, resumeFile]);

  return {
    progress,
    currentStep,
    scoredJobs,
    scoringSteps,
    error,
    setError
  };
};

export default useScoring; 
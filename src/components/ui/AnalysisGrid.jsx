import React, { useState, useCallback, useMemo } from 'react';

const AnalysisGrid = ({ selectedJob, onJobUpdate }) => {
  const [checkedItems, setCheckedItems] = useState({
    mandatory: new Set(),
    preferred: new Set(),
    employerQuestions: new Set(),
    otherDetails: new Set()
  });

  // Initialize checked items when job changes
  React.useEffect(() => {
    if (selectedJob) {
      setCheckedItems({
        mandatory: new Set(selectedJob.checkedMandatory || []),
        preferred: new Set(selectedJob.checkedPreferred || []),
        employerQuestions: new Set(selectedJob.checkedEmployerQuestions || []),
        otherDetails: new Set(selectedJob.checkedOtherDetails || [])
      });
    }
  }, [selectedJob]);

  // Calculate compatibility score based on checked items
  const compatibilityScore = useMemo(() => {
    if (!selectedJob) return 0;
    
    const mandatoryPoints = checkedItems.mandatory.size * 20; // 20 points each
    const preferredPoints = checkedItems.preferred.size * 10; // 10 points each
    const employerQuestionsPoints = checkedItems.employerQuestions.size * 20; // 20 points each
    const otherDetailsPoints = checkedItems.otherDetails.size * 10; // 10 points each
    
    return mandatoryPoints + preferredPoints + employerQuestionsPoints + otherDetailsPoints;
  }, [selectedJob, checkedItems]);

  // Calculate maximum possible score
  const maxPossibleScore = useMemo(() => {
    if (!selectedJob) return 0;
    
    return (selectedJob.mandatoryRequirements?.length || 0) * 20 +
           (selectedJob.preferredRequirements?.length || 0) * 10 +
           (selectedJob.employerQuestions?.length || 0) * 20 +
           (selectedJob.otherDetails?.length || 0) * 10;
  }, [selectedJob]);

  // Handle checkbox changes
  const handleCheckboxChange = useCallback((listType, index, checked) => {
    setCheckedItems(prev => {
      const newCheckedItems = { ...prev };
      const set = new Set(newCheckedItems[listType]);
      
      if (checked) {
        set.add(index);
      } else {
        set.delete(index);
      }
      
      newCheckedItems[listType] = set;
      
      // Calculate the new compatibility score based on the updated checked items
      const newCompatibilityScore = 
        newCheckedItems.mandatory.size * 20 + // 20 points each
        newCheckedItems.preferred.size * 10 + // 10 points each
        newCheckedItems.employerQuestions.size * 20 + // 20 points each
        newCheckedItems.otherDetails.size * 10; // 10 points each
      
      // Update the job data in memory
      if (onJobUpdate && selectedJob) {
        const updatedJob = {
          ...selectedJob,
          checkedMandatory: Array.from(newCheckedItems.mandatory),
          checkedPreferred: Array.from(newCheckedItems.preferred),
          checkedEmployerQuestions: Array.from(newCheckedItems.employerQuestions),
          checkedOtherDetails: Array.from(newCheckedItems.otherDetails),
          compatibilityScore: newCompatibilityScore,
          maxPossibleScore: maxPossibleScore
        };
        onJobUpdate(updatedJob);
      }
      
      return newCheckedItems;
    });
  }, [onJobUpdate, selectedJob, maxPossibleScore]);

  if (!selectedJob) {
    return (
      <div style={{ flex: 1, textAlign: 'center', padding: '20px', color: '#666' }}>
        Select a job to view analysis
      </div>
    );
  }

  // Get color for compatibility score based on percentage
  const getScoreColor = (score, maxScore) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    if (percentage >= 80) return '#28a745'; // Green
    if (percentage >= 60) return '#ffc107'; // Yellow
    if (percentage >= 40) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  };

  // Get gradient for compatibility bar based on percentage
  const getGradientColor = (score, maxScore) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    if (percentage >= 80) return 'linear-gradient(90deg, #28a745 0%, #20c997 100%)';
    if (percentage >= 60) return 'linear-gradient(90deg, #ffc107 0%, #fd7e14 100%)';
    if (percentage >= 40) return 'linear-gradient(90deg, #fd7e14 0%, #e83e8c 100%)';
    return 'linear-gradient(90deg, #dc3545 0%, #fd7e14 100%)';
  };

               return (
     <div style={{ 
       flex: 1, 
       display: 'flex', 
       flexDirection: 'column', 
       height: '100%', 
       padding: '0px', 
       margin: '0px',
       backgroundColor: 'transparent',
       position: 'relative'
     }}>
                                                                                                                                                                       <div className="analysis-grid" style={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '0px',
            marginTop: '0px',
            backgroundColor: 'transparent'
          }}>
        {/* Column 1: Job Requirements */}
        <div className="analysis-column" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%',
          borderRadius: '8px',
          padding: '5px',
          border: '1px solid var(--border-color)'
        }}>
                                                                                     <h4 style={{ 
               color: 'var(--text-primary)', 
               marginBottom: '8px', 
               fontSize: '16px',
               fontWeight: 'bold',
               textAlign: 'center',
               padding: '4px 4px 4px 4px',
               borderRadius: '4px',
               border: '1px solid var(--border-color)',
               backgroundColor: 'transparent',
               minHeight: '30px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               flexShrink: 0
             }}>
               Job Requirements
             </h4>
                      <div style={{ 
              flex: 1, 
              overflow: 'auto', 
              paddingRight: '5px',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '5px',
              backgroundColor: 'transparent'
            }}>
              {/* Mandatory Requirements */}
              {selectedJob.mandatoryRequirements?.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: 'var(--text-primary)', 
                  marginBottom: '8px',
                  fontSize: '15px'
                }}>
                  Mandatory Requirements:
                </div>
                {selectedJob.mandatoryRequirements.map((item, idx) => (
                  <div key={idx} style={{
                    marginBottom: '8px',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <input
                      type="checkbox"
                      checked={checkedItems.mandatory.has(idx)}
                      onChange={(e) => handleCheckboxChange('mandatory', idx, e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontWeight: 'bold' }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Preferred Requirements */}
            {selectedJob.preferredRequirements?.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: 'var(--text-primary)', 
                  marginBottom: '8px',
                  fontSize: '15px'
                }}>
                  Preferred Requirements:
                </div>
                {selectedJob.preferredRequirements.map((item, idx) => (
                  <div key={idx} style={{
                    marginBottom: '8px',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <input
                      type="checkbox"
                      checked={checkedItems.preferred.has(idx)}
                      onChange={(e) => handleCheckboxChange('preferred', idx, e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
            
            {(!selectedJob.mandatoryRequirements || selectedJob.mandatoryRequirements.length === 0) && 
             (!selectedJob.preferredRequirements || selectedJob.preferredRequirements.length === 0) && (
              <div style={{ 
                marginBottom: '12px',
                paddingLeft: '15px',
                position: 'relative',
                fontSize: '14px',
                lineHeight: '1.4',
                color: 'var(--text-secondary)',
                fontStyle: 'italic'
              }}>
                No requirements found
              </div>
            )}
          </div>
        </div>

                 {/* Column 2: Employer Questions & Other */}
         <div className="analysis-column" style={{ 
           display: 'flex', 
           flexDirection: 'column', 
           height: '100%',
           borderRadius: '8px',
           padding: '5px',
           border: '1px solid var(--border-color)'
         }}>
                                                                                     <h4 style={{ 
               color: 'var(--text-primary)', 
               marginBottom: '8px', 
               fontSize: '16px',
               fontWeight: 'bold',
               textAlign: 'center',
               padding: '4px 4px 4px 4px',
               borderRadius: '4px',
               border: '1px solid var(--border-color)',
               backgroundColor: 'transparent',
               minHeight: '30px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               flexShrink: 0
             }}>
               Employer Questions & Other
             </h4>
                                             <div style={{ 
               flex: 1, 
               overflow: 'auto', 
               paddingRight: '5px',
               border: '1px solid var(--border-color)',
               borderRadius: '4px',
               padding: '5px',
               backgroundColor: 'transparent'
             }}>
               {/* Employer Questions */}
               {selectedJob.employerQuestions?.length > 0 && (
               <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: 'var(--text-primary)', 
                  marginBottom: '8px',
                  fontSize: '15px'
                }}>
                  Employer Questions:
                </div>
                {selectedJob.employerQuestions.map((item, idx) => (
                  <div key={idx} style={{
                    marginBottom: '8px',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <input
                      type="checkbox"
                      checked={checkedItems.employerQuestions.has(idx)}
                      onChange={(e) => handleCheckboxChange('employerQuestions', idx, e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontWeight: 'bold' }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Other Details */}
            {selectedJob.otherDetails?.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: 'var(--text-primary)', 
                  marginBottom: '8px',
                  fontSize: '15px'
                }}>
                  Other Details:
                </div>
                {selectedJob.otherDetails.map((item, idx) => (
                  <div key={idx} style={{
                    marginBottom: '8px',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <input
                      type="checkbox"
                      checked={checkedItems.otherDetails.has(idx)}
                      onChange={(e) => handleCheckboxChange('otherDetails', idx, e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
            
            {(!selectedJob.employerQuestions || selectedJob.employerQuestions.length === 0) && 
             (!selectedJob.otherDetails || selectedJob.otherDetails.length === 0) && (
              <div style={{ 
                marginBottom: '12px',
                paddingLeft: '15px',
                position: 'relative',
                fontSize: '14px',
                lineHeight: '1.4',
                color: 'var(--text-secondary)',
                fontStyle: 'italic'
              }}>
                No questions or other details found
              </div>
            )}
          </div>
        </div>

                 {/* Column 3: Job Responsibilities */}
         <div className="analysis-column" style={{ 
           display: 'flex', 
           flexDirection: 'column', 
           height: '100%',
           borderRadius: '8px',
           padding: '5px',
           border: '1px solid var(--border-color)'
         }}>
                                                                                     <h4 style={{ 
               color: 'var(--text-primary)', 
               marginBottom: '8px', 
               fontSize: '16px',
               fontWeight: 'bold',
               textAlign: 'center',
               padding: '4px 4px 4px 4px',
               borderRadius: '4px',
               border: '1px solid var(--border-color)',
               backgroundColor: 'transparent',
               minHeight: '30px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               flexShrink: 0
             }}>
               Job Responsibilities
             </h4>
                                             <div style={{ 
               flex: 1, 
               overflow: 'auto', 
               paddingRight: '5px',
               border: '1px solid var(--border-color)',
               borderRadius: '4px',
               padding: '5px',
               backgroundColor: 'transparent'
             }}>
               {selectedJob.responsibilities?.length > 0 ? (
               selectedJob.responsibilities.map((item, index) => (
                <div key={index} style={{ 
                  marginBottom: '12px',
                  paddingLeft: '15px',
                  position: 'relative',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  color: 'var(--text-primary)'
                }}>
                  • {item}
                </div>
              ))
            ) : (
              <div style={{ 
                marginBottom: '12px',
                paddingLeft: '15px',
                position: 'relative',
                fontSize: '14px',
                lineHeight: '1.4',
                color: 'var(--text-secondary)',
                fontStyle: 'italic'
              }}>
                No responsibilities found
              </div>
            )}
          </div>
        </div>
      </div>
      
                                           {/* Compatibility Score Bar */}
         <div style={{ 
           marginTop: '2px',
           padding: '10px',
           borderRadius: '8px',
           border: '1px solid var(--border-color)',
           backgroundColor: 'transparent',
           flexShrink: 0,
           position: 'sticky',
           bottom: '0',
           zIndex: 1000
         }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
                     <span style={{
             fontWeight: 'bold',
             fontSize: '16px',
             color: 'var(--text-primary)'
           }}>
             Compatibility: {maxPossibleScore > 0 ? Math.round((compatibilityScore / maxPossibleScore) * 100) : 0}%
           </span>
          <span style={{
            fontSize: '14px',
            color: 'var(--text-secondary)'
          }}>
            {checkedItems.mandatory.size + checkedItems.preferred.size + checkedItems.employerQuestions.size + checkedItems.otherDetails.size} items checked
          </span>
        </div>
        
                 {/* Progress Bar */}
         <div style={{
           width: '100%',
           height: '20px',
           backgroundColor: '#e9ecef',
           borderRadius: '10px',
           overflow: 'hidden',
           position: 'relative',
           margin: '0 20px'
         }}>
           <div style={{
             width: `${maxPossibleScore > 0 ? (compatibilityScore / maxPossibleScore) * 100 : 0}%`,
             height: '100%',
             background: getGradientColor(compatibilityScore, maxPossibleScore),
             borderRadius: '10px',
             transition: 'width 0.3s ease, background 0.3s ease',
             boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
           }} />
         </div>
      </div>
    </div>
  );
};

export default AnalysisGrid; 
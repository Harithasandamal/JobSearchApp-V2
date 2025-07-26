import { useState } from 'react';
import { defaultSuburb } from '../data/melbourneSuburbs';

const useWelcomeForm = ({ appState, resumeFile, systemReady }) => {
  const [localState, setLocalState] = useState({
    location: appState.location || defaultSuburb,
    distance: appState.distance || '5 km',
    postedAgo: appState.postedAgo || '3 days',
    keyword: appState.keyword || '' // No default keyword
  });

  const handleInputChange = (field, value) => {
    setLocalState(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return systemReady && 
           resumeFile && resumeFile.name && resumeFile.name.trim() !== '' && 
           localState.location && 
           localState.location.trim() !== '';
  };

  return {
    localState,
    handleInputChange,
    isFormValid
  };
};

export default useWelcomeForm; 
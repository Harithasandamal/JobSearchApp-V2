import React from 'react';
import { getSuburbNames } from '../../data/melbourneSuburbs';
import useTheme from '../../hooks/useTheme';

const SearchParametersForm = ({ 
  localState, 
  handleInputChange, 
  searchLocked 
}) => {
  const { theme } = useTheme();
  
  // Lock inputs in light mode (test mode with fixed sample jobs)
  const isLightModeTestLocked = theme === 'light';
  const effectiveSearchLocked = searchLocked || isLightModeTestLocked;
  
  return (
    <div>
      {/* Location Selection */}
      <div className="form-group">
        <label className="form-label">Location:</label>
        <select
          className="form-control"
          value={localState.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          disabled={effectiveSearchLocked}
          style={{
            opacity: effectiveSearchLocked ? 0.5 : 1,
            cursor: effectiveSearchLocked ? 'not-allowed' : 'pointer',
            backgroundColor: effectiveSearchLocked
              ? '#f8f9fa'
              : theme === 'dark'
                ? '#2d2d2d'
                : '#ffffff',
            color: effectiveSearchLocked
              ? '#6c757d'
              : theme === 'dark'
                ? '#ffffff'
                : '#000000',
            pointerEvents: effectiveSearchLocked ? 'none' : 'auto'
          }}
        >
          {getSuburbNames().map((suburb) => (
            <option key={suburb} value={suburb}>
              {suburb}
            </option>
          ))}
        </select>
      </div>

      {/* Distance Selection */}
      <div className="form-group">
        <label className="form-label">Distance:</label>
        <select 
          className="form-control"
          value={localState.distance}
          onChange={(e) => handleInputChange('distance', e.target.value)}
          disabled={effectiveSearchLocked}
          style={{
            opacity: effectiveSearchLocked ? 0.5 : 1,
            cursor: effectiveSearchLocked ? 'not-allowed' : 'pointer',
            backgroundColor: effectiveSearchLocked
              ? '#f8f9fa'
              : theme === 'dark'
                ? '#2d2d2d'
                : '#ffffff',
            color: effectiveSearchLocked
              ? '#6c757d'
              : theme === 'dark'
                ? '#ffffff'
                : '#000000',
            pointerEvents: effectiveSearchLocked ? 'none' : 'auto'
          }}
        >
          <option value="2 km">2 km</option>
          <option value="5 km">5 km</option>
          <option value="10 km">10 km</option>
          <option value="25 km">25 km</option>
          <option value="50 km">50 km</option>
          <option value="100 km">100 km</option>
        </select>
      </div>

      {/* Posted Ago Selection */}
      <div className="form-group">
        <label className="form-label">Posted Ago:</label>
        <select 
          className="form-control"
          value={localState.postedAgo}
          onChange={(e) => handleInputChange('postedAgo', e.target.value)}
          disabled={effectiveSearchLocked}
          style={{
            opacity: effectiveSearchLocked ? 0.5 : 1,
            cursor: effectiveSearchLocked ? 'not-allowed' : 'pointer',
            backgroundColor: effectiveSearchLocked
              ? '#f8f9fa'
              : theme === 'dark'
                ? '#2d2d2d'
                : '#ffffff',
            color: effectiveSearchLocked
              ? '#6c757d'
              : theme === 'dark'
                ? '#ffffff'
                : '#000000',
            pointerEvents: effectiveSearchLocked ? 'none' : 'auto'
          }}
        >
          <option value="1 day">1 day</option>
          <option value="3 days">3 days</option>
          <option value="7 days">7 days</option>
          <option value="14 days">14 days</option>
          <option value="30 days">30 days</option>
        </select>
      </div>

      {/* Keyword Input */}
      <div className="form-group">
        <label className="form-label">Keyword:</label>
        <input 
          type="text"
          className="form-control"
          value={localState.keyword}
          onChange={(e) => handleInputChange('keyword', e.target.value)}
          placeholder="Type and Enter..."
          disabled={effectiveSearchLocked}
          style={{
            opacity: effectiveSearchLocked ? 0.5 : 1,
            cursor: effectiveSearchLocked ? 'not-allowed' : 'pointer',
            backgroundColor: effectiveSearchLocked
              ? '#f8f9fa'
              : theme === 'dark'
                ? '#2d2d2d'
                : '#ffffff',
            color: effectiveSearchLocked
              ? '#6c757d'
              : theme === 'dark'
                ? '#ffffff'
                : '#000000',
            pointerEvents: effectiveSearchLocked ? 'none' : 'auto'
          }}
        />
      </div>
    </div>
  );
};

export default SearchParametersForm; 
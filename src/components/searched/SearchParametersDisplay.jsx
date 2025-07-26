import React from 'react';
import { formatLocation, formatDistance, formatPostedAgo, formatKeyword } from '../../utils/formatters';

const SearchParametersDisplay = ({ appState }) => {
  return (
    <>
      <div className="form-group">
        <label className="form-label">Location:</label>
        <div className="search-param-display">
          {formatLocation(appState.location)}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Distance:</label>
        <div className="search-param-display">
          {formatDistance(appState.distance)}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Posted Ago:</label>
        <div className="search-param-display">
          {formatPostedAgo(appState.postedAgo)}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Keyword:</label>
        <div className="search-param-display">
          {formatKeyword(appState.keyword)}
        </div>
      </div>
    </>
  );
};

export default SearchParametersDisplay; 
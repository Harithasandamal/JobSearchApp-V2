/**
 * Utility functions for formatting search criteria values consistently across screens
 */

/**
 * Format location for display
 * @param {string} location - The location value from appState
 * @returns {string} Formatted location string
 */
export const formatLocation = (location) => {
  if (!location) return 'Not selected';
  return location;
};

/**
 * Format distance for display
 * @param {string} distance - The distance value from appState
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (!distance) return 'Not selected';
  // Ensure it has the "km" suffix if not already present
  if (distance.includes('km')) {
    return distance;
  }
  // If it's just a number, add "km"
  if (/^\d+$/.test(distance)) {
    return `${distance} km`;
  }
  return distance;
};

/**
 * Format posted ago for display
 * @param {string} postedAgo - The posted ago value from appState
 * @returns {string} Formatted posted ago string
 */
export const formatPostedAgo = (postedAgo) => {
  if (!postedAgo) return 'Not selected';
  // Ensure it has the "days" suffix if not already present
  if (postedAgo.includes('days') || postedAgo.includes('day')) {
    return postedAgo;
  }
  // If it's just a number, add "days"
  if (/^\d+$/.test(postedAgo)) {
    return `${postedAgo} days`;
  }
  return postedAgo;
};

/**
 * Format keyword for display
 * @param {string} keyword - The keyword value from appState
 * @returns {string} Formatted keyword string
 */
export const formatKeyword = (keyword) => {
  if (!keyword || keyword.trim() === '') return '';
  return keyword;
}; 
/**
 * Shared data structures for search controllers
 */

/**
 * Store active scraping processes
 */
const activeProcesses = new Map();
const activeJobDetails = {};

module.exports = {
  activeProcesses,
  activeJobDetails
}; 
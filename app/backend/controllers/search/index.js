const { getSearchStatus, getJobDetails } = require('./searchStatusController');
const { activeProcesses } = require('./sharedData');

module.exports = {
  getSearchStatus,
  getJobDetails,
  activeProcesses
}; 
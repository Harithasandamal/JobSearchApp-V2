const express = require('express');
const router = express.Router();

const { 
  getSearchStatus, 
  getJobDetails
} = require('../controllers/search');

const workflowLogger = require('../utils/WorkflowLogger');

// Job search endpoints
router.get('/search-status/:processId', getSearchStatus);
router.get('/job-details/:processId', getJobDetails);



// Unified workflow logging endpoint
router.post('/workflow-log', (req, res) => {
  try {
    const { eventType, data } = req.body;
    
    switch (eventType) {
      case 'navigation':
        workflowLogger.navigateToScreen(data.toScreen, data.fromScreen);
        break;
      case 'action':
        workflowLogger.logAction(data.action, data.details);
        break;
      case 'click':
        workflowLogger.logAction(`Clicked: ${data.buttonName}`, data.context);
        break;
      case 'input':
        workflowLogger.logAction(`Input: ${data.field}`, `Value: ${data.value}`);
        break;
      case 'form':
        workflowLogger.logAction(`Form submitted: ${data.formName}`, `Data: ${JSON.stringify(data.data)}`);
        break;
      case 'screenLoad':
        const loadTimeText = data.loadTime ? ` (${data.loadTime}ms)` : '';
        workflowLogger.logAction(`Screen loaded: ${data.screenName}${loadTimeText}`);
        break;
      case 'error':
        workflowLogger.logError(data.error, data.context);
        break;
      default:
        workflowLogger.log(`Frontend event: ${eventType}`, 'info');
    }
    
    res.json({ status: 'logged' });
  } catch (error) {
    console.error('Workflow logging error:', error);
    res.status(500).json({ error: 'Logging failed' });
  }
});

// Shutdown endpoint
router.post('/shutdown', (req, res) => {
  workflowLogger.logSessionSummary();
  res.json({ message: 'Server shutting down' });
  setTimeout(() => process.exit(0), 1000);
});

module.exports = router; 
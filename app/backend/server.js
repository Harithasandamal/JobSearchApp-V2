const express = require('express');
const cors = require('cors');
const path = require('path');
const searchRoutes = require('./routes/searchRoutes');
const scoringRoutes = require('./routes/scoringRoutes');
const healthRoutes = require('./routes/healthRoutes');
const workflowLogger = require('./utils/WorkflowLogger');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Custom middleware to log meaningful API calls (skip repetitive status checks)
app.use((req, res, next) => {
  // Only log important API calls, not repetitive status checks
  if (!req.path.includes('search-status') && !req.path.includes('health')) {
    workflowLogger.logApiCall(req.method, req.path);
  }
  next();
});

// Routes
app.use('/api', searchRoutes);
app.use('/api', scoringRoutes);
app.use('/api', healthRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  workflowLogger.logError(err.message, `API ${req.method} ${req.path}`);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  workflowLogger.logSessionSummary();
  process.exit(0);
});

process.on('SIGINT', () => {
  workflowLogger.logSessionSummary();
  process.exit(0);
});

app.listen(PORT, () => {
  workflowLogger.log(`🚀 Backend server running on port ${PORT}`, 'system');
  workflowLogger.log(`📡 API endpoints available:`, 'system');
  workflowLogger.log(`   • /api/search-jobs`, 'system');
  workflowLogger.log(`   • /api/test-jobs`, 'system');
  workflowLogger.log(`   • /api/mock-scored-jobs`, 'system');
  workflowLogger.log(`   • /api/mock-analysis`, 'system');
  workflowLogger.log(`   • /api/health`, 'system');
  workflowLogger.log('', 'system'); // Empty line for readability
}); 
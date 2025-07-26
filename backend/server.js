const express = require('express');
const cors = require('cors');

// Import route modules
const searchRoutes = require('./routes/searchRoutes');
const scoringRoutes = require('./routes/scoringRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Route handlers
app.use('/api', searchRoutes);
app.use('/api', scoringRoutes);
app.use('/health', healthRoutes);
app.use('/api', healthRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SEEK Scraper API Server running on port ${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   POST /api/search-jobs - Start a new job search`);
  console.log(`   GET /api/search-status/:processId - Get search progress`);
  console.log(`   DELETE /api/search-stop/:processId - Stop a search`);
  console.log(`   POST /api/score-jobs - Start job scoring`);
  console.log(`   GET /api/scoring-status/:processId - Get scoring progress`);
  console.log(`   GET /api/health - Health check`);
  console.log(`   GET /api/test-jobs - Get sample test jobs`);
  console.log(`   GET /api/job-details/:processId - Get job details`);
}); 
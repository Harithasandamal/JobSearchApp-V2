# JobSearchApp V2 - Comprehensive Reference Document

## 📋 CURRENT STRUCTURE ANALYSIS

### 1. MAIN DIRECTORIES & PURPOSE
```
📁 Root/
├── 🚀 start_app.bat (78 lines) - Main launcher 
├── 📁 src/ - Frontend React application
├── 📁 backend/ - Express.js server
├── 📁 public/ - Static assets
├── 📁 build/ - React build output
├── 📁 node_modules/ - Dependencies
└── 📦 package.json - Project configuration
```

### 2. FRONTEND STRUCTURE (src/)
```
📁 src/
├── 🎯 App.jsx (183 lines) - Main application controller
├── 📁 components/ - React components
│   ├── 🏠 WelcomeScreen.jsx (111 lines)
│   ├── 🔍 SearchingScreen.jsx (284 lines) 
│   ├── 📋 SearchedScreen.jsx (71 lines)
│   ├── 🎯 ScoringScreen.jsx (129 lines)
│   ├── 📊 ScoredScreen.jsx (160 lines)
│   ├── 🧠 AnalyzingScreen.jsx (198 lines)
│   ├── ✅ AnalyzedScreen.jsx (55 lines)
│   └── 📄 ResumeUpload.jsx (90 lines)
├── 📁 hooks/ - Custom React hooks
│   ├── useTheme.js - Theme management
│   ├── useLocalStorage.js - Local storage persistence
│   └── useWorkflowLogger.js (61 lines) - Logging functionality
├── 📁 services/ - API communication
│   └── seekApi.js - SEEK API service
├── 📁 utils/ - Utility functions
│   └── formatters.js - Data formatting
├── 📁 styles/ - CSS styling
│   ├── base.css - Base styles
│   ├── layout.css - Layout styles
│   └── components.css - Component styles
└── 📁 data/ - Static data
    └── melbourneSuburbs.js (255 lines) - Suburb data
```

### 3. BACKEND STRUCTURE (backend/)
```
📁 backend/
├── 🚀 server.js (56 lines) - Express server setup
├── 📁 routes/ - API routes
│   ├── searchRoutes.js (73 lines)
│   ├── scoringRoutes.js (185 lines)
│   └── healthRoutes.js (56 lines)
├── 📁 controllers/ - Business logic
│   └── 📁 search/
│       ├── index.js - Controller exports
│       ├── testJobsController.js (383 lines) - Light mode jobs
│       ├── jobSearchController.js - Dark mode jobs
│       └── jobScrapingUtils.js - Scraping utilities
├── 📁 scrapers/ - Web scraping
│   └── UrlBuilder.js (294 lines) - URL construction
├── 📁 utils/ - Backend utilities
│   └── WorkflowLogger.js - Backend logging
└── 📁 config/ - Configuration files
```

## 🎯 CURRENT WORKFLOW ANALYSIS

### SCREEN FLOW
1. **WelcomeScreen** - Theme selection, search parameters
2. **SearchingScreen** - Progress display during scraping  
3. **SearchedScreen** - Job selection (max 5)
4. **ScoringScreen** - Loading screen for scoring
5. **ScoredScreen** - Scored jobs table with selection
6. **AnalyzingScreen** - Deep analysis loading
7. **AnalyzedScreen** - Final analysis results

### THEME SYSTEM
- **Light Mode**: Test mode with 3 hardcoded sample URLs
- **Dark Mode**: Real SEEK scraping with URL building
- **Current URLs**: Located in `testJobsController.js` lines 20-24

### LOGGING SYSTEM  
- **Frontend**: `useWorkflowLogger.js` - Sends events to backend
- **Backend**: `WorkflowLogger.js` - Console logging
- **Current Levels**: Basic navigation and action logging

### SCRAPING METHODS
- **Light Mode**: Uses 3 predefined SEEK URLs
- **Dark Mode**: Builds URLs with location enrichment
- **Parallel Processing**: Batch processing in groups of 10

## 🔧 CURRENT FUNCTIONS & THEIR PURPOSE

### App.jsx Functions
1. `navigateTo(screen)` - Screen navigation with logging
2. `updateAppState(updates)` - State management
3. `resetApp()` - Full application reset
4. `renderCurrentScreen()` - Screen rendering logic

### SearchingScreen.jsx Functions  
1. `pollForProgress()` - Progress monitoring
2. `updateSearchSteps()` - Step status updates
3. Theme-based search routing

### WorkflowLogger Functions
1. `logNavigation()` - Screen transitions
2. `logAction()` - User actions  
3. `logUserInput()` - Form inputs
4. `logButtonClick()` - Button interactions
5. `logError()` - Error tracking

### UrlBuilder Functions
1. `enrichLocationWithPostcode()` - Location enhancement
2. `buildSearchUrl()` - SEEK URL construction
3. `getMelbourneSuburbsData()` - Suburb data loading

## 📊 DATA FLOW ANALYSIS

### State Management
- **App Level**: `appState` object containing all session data
- **Local Storage**: Persistent storage via `useLocalStorage`
- **Theme State**: Managed via `useTheme` hook

### Session Data Structure
```javascript
appState = {
  resume: 'Shamalka Resume v2.pdf',
  location: defaultSuburb,
  distance: '5 km', 
  postedAgo: '3 days',
  keyword: '',
  searchProcessId: null,
  selectedJobs: [],
  selectedJobForAnalysis: null,
  jobsFound: [],
  scoredJobs: [],
  analysisData: null
}
```

## 🚫 IDENTIFIED ISSUES & CLEANUP TARGETS

### File Size Issues (>300 lines)
- ✅ App.jsx: 183 lines (OK)
- ❌ SearchingScreen.jsx: 284 lines (NEEDS SPLITTING)
- ❌ UrlBuilder.js: 294 lines (NEEDS SPLITTING)  
- ❌ testJobsController.js: 383 lines (NEEDS SPLITTING)

### Potential Dead Code
- Unused imports in components
- Mock data functions that may be replaced
- Redundant error handling patterns

### Organization Issues
- Multiple files directly in main directory
- Mixed concerns in single files
- No clear separation of test vs production code

## 🎯 REFACTORING TARGETS

### Light Mode Requirements
- Lock to exactly 3 hardcoded sample URLs
- No user input variations allowed
- Direct URL access for maximum speed

### Dark Mode Requirements  
- Full URL building with location enrichment
- Keyword validation and cross-referencing
- Posted time filtering
- Parallel scraping optimization

### Logging Enhancement
- Level 0: Main app steps & system checks
- Level 1: Welcome & Searching screens
- Level 2: Searched & Scoring screens  
- Level 3: Scored & Analyzing screens
- Level 4: Analyzed screen details

### File Organization Target
```
📁 Root/
├── 🚀 start_app.bat (ONLY FILE IN ROOT)
├── 📁 app/ - Organized application
│   ├── 📁 frontend/
│   ├── 📁 backend/
│   ├── 📁 shared/
│   └── 📁 config/
└── 📁 docs/ - Documentation
```

## 🧪 TEST SCENARIOS

### Required Test Cases
1. **Light Mode**: 3 hardcoded URLs → job details
2. **Dark Mode (No Keyword)**: Dandenong, 25km, 7 days → job list
3. **Dark Mode (With Keyword)**: analyst, Dandenong, 25km, 7 days → filtered jobs

### Validation Criteria
- 100% scraping accuracy
- Maximum parallel speed
- Proper cross-validation
- Complete data integrity

---

**Document Created**: During refactoring planning phase
**Purpose**: Reference for systematic refactoring process
**Status**: Living document - updated during refactoring
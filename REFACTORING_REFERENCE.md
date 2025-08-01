# COMPREHENSIVE REFACTORING REFERENCE

## RESTORE POINT INSTRUCTIONS
**To restore to working version:**
```bash
git checkout restore-point-working-v1
# OR reset to specific commit:
git reset --hard 89c9d3e
```

## 1. CURRENT SYSTEM OVERVIEW

### 1.1 Application Architecture
- **Frontend**: React (src/) - 7 screen workflow
- **Backend**: Node.js/Express (backend/) - API endpoints and scraping
- **Database**: None (localStorage for persistence)
- **Scraping**: Puppeteer-based with parallel processing

### 1.2 Screen Flow & Navigation
```
WelcomeScreen → SearchingScreen → SearchedScreen → ScoringScreen → ScoredScreen → AnalyzingScreen → AnalyzedScreen
     ↑                                                                                                      ↓
     ←←←←←←←←←←←←←←←←←←←←←←←← BACK NAVIGATION AVAILABLE ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

### 1.3 Theme System (Light/Dark Mode)
- **Component**: `src/components/ui/ThemeToggle.jsx` (46 lines)
- **Hook**: `src/hooks/useTheme.js` (66 lines)
- **Functionality**: 
  - Light mode = Test mode (hardcoded 3 sample URLs)
  - Dark mode = Real mode (dynamic URL building)
  - Lock mechanism during search process
  - localStorage persistence

## 2. DETAILED FILE ANALYSIS

### 2.1 Frontend Components (src/components/)

#### 2.1.1 Core Screens
- **WelcomeScreen.jsx**: Initial screen with search parameters
- **SearchingScreen.jsx**: Loading screen during search
- **SearchedScreen.jsx**: Display search results, job selection
- **ScoringScreen.jsx**: Loading screen during scoring
- **ScoredScreen.jsx**: Display scored jobs with compatibility scores
- **AnalyzingScreen.jsx**: Loading screen during analysis
- **AnalyzedScreen.jsx**: Final analysis results

#### 2.1.2 UI Components
- **ThemeToggle.jsx**: Light/Dark mode switcher
- **LoadingSpinner.jsx**: Loading animations
- **ProgressBar.jsx**: Progress indicators
- **JobTable.jsx**: Job listings display
- **AnalysisGrid.jsx**: Analysis results layout

#### 2.1.3 Feature-Specific Components
- **searched/**: JobsTable, JobStatusIndicator, SearchActionButtons, SearchParametersDisplay
- **analyzed/**: AnalysisColumns, AnalyzedActionButtons, AnalyzedStatusDisplay, PDFGenerator
- **welcome/**: InstructionsPanel, SearchButton, SearchParametersForm
- **common/**: ProgressChecklist, ResumeLabel

### 2.2 Frontend Hooks (src/hooks/)
- **useTheme.js**: Theme management and locking (66 lines)
- **useWorkflowLogger.js**: Frontend logger integration
- **useLocalStorage.js**: localStorage state management
- **useSearchHandler.js**: Search process management
- **useScoring.js**: Scoring process management
- **useJobSelection.js**: Job selection logic
- **useAnalyzedScreen.js**: Analysis screen logic
- **useSearchedScreen.js**: Search results management
- **useSystemStatus.js**: System status monitoring
- **useWelcomeForm.js**: Welcome form management

### 2.3 Backend Controllers (backend/controllers/)

#### 2.3.1 Search Controllers
- **search/index.js**: Main search exports (15 lines)
- **search/jobSearchController.js**: Main search orchestration
- **search/darkModeController.js**: Real search mode logic (204 lines)
- **search/lightModeController.js**: Test mode logic
- **search/testJobsController.js**: Hardcoded sample URLs (383 lines)
- **search/searchStatusController.js**: Search status monitoring
- **search/mockDataController.js**: Mock data generation
- **search/searchResultsScraper.js**: SEEK search results extraction
- **search/sharedData.js**: Shared process state

#### 2.3.2 Utility Controllers
- **search/jobScrapingUtils.js**: Unified scraping functions
- **scoringController.js**: Job scoring logic

### 2.4 Backend Scrapers (backend/scrapers/)
- **UrlBuilder.js**: SEEK URL construction with location enrichment (294 lines)
- **searchPageScraper.js**: Search results page scraping
- **OptimizedSeekScraper.js**: Parallel job scraping with browser pooling (263 lines)

### 2.5 Backend Utils (backend/utils/)
- **WorkflowLogger.js**: Unified logging with indentation levels (244 lines)
- **dataUtils.js**: Data processing utilities
- **jobUtils.js**: Job data manipulation
- **urlUtils.js**: URL processing functions
- **featuredJobValidator.js**: Featured job validation

## 3. CURRENT HARDCODED SAMPLE URLs (Light Mode)
```javascript
const sampleUrls = [
  'https://www.seek.com.au/job/85981995?ref=recom-homepage&pos=4&sp=3&origin=jobTitle#sol=941dd2919d55ebc790f6017d3e00d197d7ce28a0',
  'https://www.seek.com.au/job/85994049?ref=search-standalone&type=standard&origin=jobTitle#sol=f5c442d9c765b69183c0a9f36e76c3773779cff4',
  'https://www.seek.com.au/job/85907804?ref=search-standalone&type=standard&origin=jobTitle#sol=ac705abd43f8e7aa11c57e26bdd7ef8de3e67313'
];
```

## 4. SCRAPING IMPLEMENTATION DETAILS

### 4.1 Proven Selectors (OptimizedSeekScraper.js)
```javascript
const title = document.querySelector('h1[data-automation="job-detail-title"]')?.textContent?.trim();
const company = document.querySelector('[data-automation="advertiser-name"]')?.textContent?.trim();
const location = document.querySelector('[data-automation="job-detail-location"]')?.textContent?.trim();
```

### 4.2 Parallel Processing
- **Browser Pool**: Max 3 browsers for resource control
- **Batch Processing**: 10 jobs per batch with 10-second timeouts
- **Round-Robin**: Jobs distributed across browser instances
- **Error Handling**: Graceful failure with detailed logging

### 4.3 URL Building (Dark Mode)
- **With Keyword**: `https://www.seek.com.au/{Keyword}-jobs/in-{Location-VIC-Postcode}`
- **Without Keyword**: `https://www.seek.com.au/jobs/in-{Location-VIC-Postcode}`
- **Parameters**: daterange, distance, sortmode=ListedDate
- **Location Enrichment**: Melbourne suburbs with postcodes

## 5. WORKFLOW LOGGER LEVELS

### 5.1 Indentation Structure
- **Level 0**: System/Server actions (no indent)
- **Level 1**: Welcome & Searching screens
- **Level 2**: Searched & Scoring screens  
- **Level 3**: Scored & Analyzing screens
- **Level 4**: Analyzed screen

### 5.2 Log Types
- **system**: ⚙️ System operations
- **navigation**: 🧭 Screen navigation
- **action**: 👆 User actions
- **process**: ⚡ Background processes
- **scraping**: 🕷️ Web scraping operations
- **success**: ✅ Successful operations
- **error**: ❌ Error conditions
- **warning**: ⚠️ Warning messages
- **info**: ℹ️ Information messages

## 6. DATA PERSISTENCE STRATEGY

### 6.1 App State Structure
```javascript
const appState = {
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
};
```

### 6.2 localStorage Keys
- **theme**: Light/Dark mode preference
- **appState**: Current application state
- **currentScreen**: Active screen for navigation

## 7. SCORING SYSTEM REQUIREMENTS

### 7.1 Compatibility Scoring
- **Mandatory Requirements**: 30 points each (max 3)
- **Preferred Requirements**: 20 points each (max 4)
- **Maximum Score**: 170 points (90 + 80)

### 7.2 Job Analysis Components
- **Requirements**: Mandatory (bold) + Preferred (max 7 total)
- **Responsibilities**: Job duties and tasks
- **HTML Storage**: Full job page saved as markdown
- **ChatGPT Integration**: AI analysis of job requirements

## 8. CURRENT TESTING STRATEGY

### 8.1 Test Scenarios
1. **Light Mode**: 3 hardcoded sample URLs
2. **Dark Mode without keyword**: `[location: "Dandenong", distance: "25km", postedAgo: "7 days"]`
3. **Dark Mode with keyword**: `[keyword: "analyst", location: "Dandenong", distance: "25km", postedAgo: "7 days"]`

### 8.2 Success Criteria
- **Speed**: Maximum parallel processing
- **Accuracy**: 100% data extraction
- **Reliability**: Consistent results across test runs

## 9. FILE SIZE CONSTRAINTS
- **Maximum**: 300 lines per file
- **Current Violations**: 
  - testJobsController.js: 383 lines
  - UrlBuilder.js: 294 lines  
  - OptimizedSeekScraper.js: 263 lines
  - WorkflowLogger.js: 244 lines

## 10. ORGANIZATION REQUIREMENTS
- **Main Directory**: Only launcher (bat file)
- **All Code**: Organized in folders/subfolders
- **Clean Structure**: No unnecessary files in root

## 11. ERROR PATTERNS & POTENTIAL ISSUES

### 11.1 Hanging Terminal Commands
- **Browser instances**: May not close properly
- **Promise timeouts**: Can cause hanging processes
- **Async operations**: Need proper cleanup

### 11.2 Data Inconsistencies  
- **Featured job validation**: May miss posted dates
- **URL building**: Special characters in location names
- **Scraping failures**: Silent failures without proper logging

### 11.3 Memory Management
- **Browser pool**: Limited to 3 instances
- **Page cleanup**: Must close pages after scraping
- **Process management**: Active processes cleanup

## 12. REFACTORING SCOPE

### 12.1 Must Keep
- All existing UI functionality
- 7-screen navigation flow
- Theme lock mechanism
- Parallel scraping accuracy
- WorkflowLogger indentation levels
- Data persistence during navigation

### 12.2 Must Change
- File organization (move launcher only to root)
- Script length limits (300 lines max)
- Unified scraping approach
- Clean redundant code
- Comprehensive testing strategy

### 12.3 Must Add
- Restore point access
- Phased refactoring with testing
- Comprehensive error handling
- Clean dead code analysis
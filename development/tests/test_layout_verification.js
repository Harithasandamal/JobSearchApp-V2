const fs = require('fs');
const path = require('path');

// Test the layout by checking the CSS and component files
function testLayoutFixes() {
  console.log('🔍 Testing Layout Fixes');
  console.log('=' .repeat(40));
  
  const results = {
    analysisGridPadding: false,
    columnPadding: false,
    gridGap: false,
    tableHeight: false,
    compatibilityBar: false
  };
  
  try {
    // Check AnalysisGrid padding
    const analysisGridPath = path.join(__dirname, '../../src/components/ui/AnalysisGrid.jsx');
    const analysisGridContent = fs.readFileSync(analysisGridPath, 'utf8');
    
    if (analysisGridContent.includes('padding: \'0px\'')) {
      results.analysisGridPadding = true;
      console.log('✅ AnalysisGrid padding: 0px (fixed)');
    } else {
      console.log('❌ AnalysisGrid padding: not optimized');
    }
    
    if (analysisGridContent.includes('gap: \'10px\'')) {
      results.gridGap = true;
      console.log('✅ Grid gap: 10px (optimized)');
    } else {
      console.log('❌ Grid gap: not optimized');
    }
    
    if (analysisGridContent.includes('marginBottom: \'2px\'')) {
      results.gridGap = true;
      console.log('✅ Grid marginBottom: 2px (optimized)');
    } else {
      console.log('❌ Grid marginBottom: not optimized');
    }
    
    // Check column padding
    if (analysisGridContent.includes('padding: \'5px\'')) {
      results.columnPadding = true;
      console.log('✅ Column padding: 5px (optimized)');
    } else {
      console.log('❌ Column padding: not optimized');
    }
    
    // Check table height
    const jobTablePath = path.join(__dirname, '../../src/components/ui/JobTable.jsx');
    const jobTableContent = fs.readFileSync(jobTablePath, 'utf8');
    
    if (jobTableContent.includes('height: \'400px\'')) {
      results.tableHeight = true;
      console.log('✅ Table height: 400px (optimized)');
    } else {
      console.log('❌ Table height: not optimized');
    }
    
    // Check ScoredScreen layout
    const scoredScreenPath = path.join(__dirname, '../../src/components/ScoredScreen.jsx');
    const scoredScreenContent = fs.readFileSync(scoredScreenPath, 'utf8');
    
    if (scoredScreenContent.includes('gap: \'2px\'')) {
      results.tableHeight = true;
      console.log('✅ Container gap: 2px (optimized)');
    } else {
      console.log('❌ Container gap: not optimized');
    }
    
    // Check compatibility bar
    if (analysisGridContent.includes('marginTop: \'2px\'')) {
      results.compatibilityBar = true;
      console.log('✅ Compatibility bar marginTop: 2px (optimized)');
    } else {
      console.log('❌ Compatibility bar marginTop: not optimized');
    }
    
    // Check CSS table container
    const cssPath = path.join(__dirname, '../../src/styles/components.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    if (cssContent.includes('min-height: 400px')) {
      results.tableHeight = true;
      console.log('✅ CSS table min-height: 400px (optimized)');
    } else {
      console.log('❌ CSS table min-height: not optimized');
    }
    
    console.log('\n📊 LAYOUT OPTIMIZATION SUMMARY:');
    console.log('=' .repeat(40));
    
    const totalChecks = Object.keys(results).length;
    const passedChecks = Object.values(results).filter(Boolean).length;
    
    console.log(`✅ Passed: ${passedChecks}/${totalChecks}`);
    console.log(`📊 Success Rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);
    
    if (passedChecks === totalChecks) {
      console.log('🎉 ALL LAYOUT FIXES APPLIED SUCCESSFULLY!');
      return true;
    } else {
      console.log('⚠️  Some layout fixes may need attention');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing layout fixes:', error.message);
    return false;
  }
}

// Run the layout verification test
if (require.main === module) {
  const success = testLayoutFixes();
  process.exit(success ? 0 : 1);
}

module.exports = { testLayoutFixes }; 
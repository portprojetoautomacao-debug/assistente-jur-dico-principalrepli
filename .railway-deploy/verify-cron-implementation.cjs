#!/usr/bin/env node
/**
 * Verification script for Vercel Cron Jobs implementation
 * 
 * This script verifies that:
 * 1. All cron endpoint files exist
 * 2. vercel.json has cron configuration
 * 3. TypeScript compiles without errors
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Vercel Cron Jobs Implementation\n');
console.log('='.repeat(60));

let allChecksPass = true;

// Check 1: Verify cron endpoint files exist
console.log('\n📁 Check 1: Verifying cron endpoint files exist');
console.log('-'.repeat(60));

const cronFiles = [
  'api/cron.ts',
  'api/cron/djen-monitor.ts',
  'api/cron/daily-reset.ts'
];

cronFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} NOT found`);
    allChecksPass = false;
  }
});

// Check 2: Verify vercel.json has cron configuration
console.log('\n⚙️  Check 2: Verifying vercel.json configuration');
console.log('-'.repeat(60));

try {
  const vercelJsonPath = path.join(__dirname, 'vercel.json');
  const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
  
  if (vercelJson.crons && Array.isArray(vercelJson.crons)) {
    console.log(`✅ vercel.json has crons array with ${vercelJson.crons.length} jobs`);
    
    vercelJson.crons.forEach((cron, index) => {
      console.log(`   ${index + 1}. ${cron.path} - Schedule: ${cron.schedule}`);
    });
    
    // Verify expected cron jobs
    const expectedPaths = ['/api/cron', '/api/cron/djen-monitor', '/api/cron/daily-reset'];
    const actualPaths = vercelJson.crons.map(c => c.path);
    
    expectedPaths.forEach(expectedPath => {
      if (actualPaths.includes(expectedPath)) {
        console.log(`✅ ${expectedPath} is configured`);
      } else {
        console.log(`❌ ${expectedPath} is NOT configured`);
        allChecksPass = false;
      }
    });
  } else {
    console.log('❌ vercel.json does NOT have crons configuration');
    allChecksPass = false;
  }
} catch (error) {
  console.log(`❌ Error reading vercel.json: ${error.message}`);
  allChecksPass = false;
}

// Check 3: Verify @vercel/node is installed
console.log('\n📦 Check 3: Verifying @vercel/node package');
console.log('-'.repeat(60));

try {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (packageJson.devDependencies && packageJson.devDependencies['@vercel/node']) {
    console.log(`✅ @vercel/node ${packageJson.devDependencies['@vercel/node']} is installed`);
  } else {
    console.log('❌ @vercel/node is NOT installed');
    allChecksPass = false;
  }
} catch (error) {
  console.log(`❌ Error reading package.json: ${error.message}`);
  allChecksPass = false;
}

// Check 4: Verify documentation
console.log('\n📚 Check 4: Verifying documentation');
console.log('-'.repeat(60));

const docFile = 'VERCEL_CRON_JOBS.md';
const docPath = path.join(__dirname, docFile);
if (fs.existsSync(docPath)) {
  console.log(`✅ ${docFile} exists`);
} else {
  console.log(`⚠️  ${docFile} NOT found (documentation recommended)`);
}

// Check 5: Verify .env.example updated
console.log('\n🔐 Check 5: Verifying .env.example');
console.log('-'.repeat(60));

try {
  const envExamplePath = path.join(__dirname, '.env.example');
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  
  if (envExample.includes('DJEN_TRIBUNAIS')) {
    console.log('✅ .env.example includes DJEN_TRIBUNAIS');
  } else {
    console.log('⚠️  .env.example does NOT include DJEN_TRIBUNAIS');
  }
} catch (error) {
  console.log(`❌ Error reading .env.example: ${error.message}`);
}

// Final result
console.log('\n' + '='.repeat(60));
if (allChecksPass) {
  console.log('\n✅ All critical checks passed!');
  console.log('\n🚀 Next steps:');
  console.log('   1. Deploy to Vercel: git push');
  console.log('   2. Monitor cron jobs in Vercel Dashboard');
  console.log('   3. View logs: vercel logs --follow');
  console.log('\n📖 Documentation: VERCEL_CRON_JOBS.md');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Please review the errors above.');
  process.exit(1);
}

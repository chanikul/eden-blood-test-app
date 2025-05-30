const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper to execute commands with output streaming and error handling
function runCommand(command, options = {}) {
  console.log(`\n\u001b[36m===> RUNNING: ${command}\u001b[0m`);
  try {
    const output = execSync(command, { 
      stdio: 'pipe', 
      encoding: 'utf-8',
      ...options 
    });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`\u001b[31m===> ERROR: Command '${command}' failed\u001b[0m`);
    console.error(error.stdout?.toString() || '');
    console.error(error.stderr?.toString() || '');
    throw error;
  }
}

console.log('\u001b[35m=== EDEN CLINIC NETLIFY DEPLOYMENT ===\u001b[0m');

// Step 1: Verify Netlify CLI
try {
  runCommand('netlify --version');
  console.log('\u001b[32m✓ Netlify CLI is installed\u001b[0m');
} catch (error) {
  console.error('\u001b[31m✗ Netlify CLI is not installed or not working correctly\u001b[0m');
  process.exit(1);
}

// Step 2: Check Netlify login status
try {
  runCommand('netlify status');
  console.log('\u001b[32m✓ Netlify login verified\u001b[0m');
} catch (error) {
  console.error('\u001b[31m✗ Not logged in to Netlify\u001b[0m');
  process.exit(1);
}

// Step 3: Prepare the build environment
console.log('\u001b[35m=== PREPARING BUILD ENVIRONMENT ===\u001b[0m');

// Clear any previous build artifacts
if (fs.existsSync('.next')) {
  console.log('Cleaning previous build directory...');
  fs.rmSync('.next', { recursive: true, force: true });
}

// Step 4: Build the application
console.log('\u001b[35m=== BUILDING APPLICATION ===\u001b[0m');

try {
  // Generate Prisma client
  runCommand('npx prisma generate');
  console.log('\u001b[32m✓ Prisma client generated\u001b[0m');
  
  // Build Next.js app
  runCommand('next build');
  console.log('\u001b[32m✓ Next.js build completed\u001b[0m');
} catch (error) {
  console.error('\u001b[31m✗ Build failed\u001b[0m');
  process.exit(1);
}

// Step 5: Deploy to Netlify
console.log('\u001b[35m=== DEPLOYING TO NETLIFY ===\u001b[0m');

const SITE_ID = '25c8097e-f765-402a-91cc-b1bd8b5fa1f5';

try {
  // Deploy the site
  runCommand(`netlify deploy --prod --dir=.next --site=${SITE_ID} --message="Manual deployment from CLI script"`);
  console.log('\u001b[32m✓ Deployment to Netlify completed successfully!\u001b[0m');
  
  // Get site URL
  const siteData = runCommand(`netlify sites:info ${SITE_ID} --json`);
  const siteInfo = JSON.parse(siteData);
  console.log(`\u001b[32m✓ Site deployed to: ${siteInfo.ssl_url || siteInfo.url}\u001b[0m`);
} catch (error) {
  console.error('\u001b[31m✗ Deployment failed\u001b[0m');
  process.exit(1);
}

console.log('\u001b[35m=== DEPLOYMENT COMPLETE ===\u001b[0m');

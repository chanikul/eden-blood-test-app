#!/usr/bin/env node

// Custom build script for Netlify that avoids SWC dependency issues
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting custom build script for Netlify');

// Set environment variables to improve build reliability
process.env.NODE_OPTIONS = '--max_old_space_size=4096';
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NEXT_DISABLE_SWC = '1'; // Disable SWC compilation

// Install dependencies with specific flags to avoid SWC issues
console.log('📦 Installing dependencies...');
try {
  // Use npm ci for more reliable installation
  execSync('npm ci --no-optional --prefer-offline --legacy-peer-deps', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_DISABLE_SWC: '1',
      NEXT_TELEMETRY_DISABLED: '1'
    }
  });
} catch (error) {
  console.error('⚠️ Error during dependency installation:', error.message);
  console.log('⚠️ Continuing with build despite installation errors...');
}

// Create a .babelrc file to ensure Babel is used instead of SWC
console.log('🔧 Configuring Babel...');
const babelConfig = {
  "presets": ["next/babel"],
  "plugins": []
};

fs.writeFileSync(
  path.join(process.cwd(), '.babelrc'),
  JSON.stringify(babelConfig, null, 2),
  'utf8'
);

// Build the Next.js application
console.log('🏗️ Building Next.js application...');
try {
  execSync('npx next build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_DISABLE_SWC: '1',
      NEXT_TELEMETRY_DISABLED: '1'
    }
  });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

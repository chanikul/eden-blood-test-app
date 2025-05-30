const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Eden Clinic Netlify deployment process...');

// Set environment variable to identify Netlify build
process.env.NETLIFY = 'true';

// Step 1: Build the application
console.log('📦 Building application...');
try {
  // Clean build directory first
  if (fs.existsSync('.next')) {
    console.log('🧹 Cleaning previous build directory...');
    fs.rmSync('.next', { recursive: true, force: true });
  }

  // Generate Prisma client
  console.log('🔄 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Build Next.js application
  console.log('🏗️ Building Next.js application...');
  execSync('next build', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

// Step 2: Deploy to Netlify
console.log('🚀 Deploying to Netlify...');
try {
  // Use Netlify CLI to deploy
  console.log('📤 Uploading to Netlify (eden-clinic-blood-test-u8ft1)...');
  execSync('netlify deploy --prod --dir=.next --site=eden-clinic-blood-test-u8ft1 --message="Deployed from CLI script"', { stdio: 'inherit' });

  console.log('✅ Deployment completed successfully!');
} catch (error) {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
}

console.log('🎉 Eden Clinic deployment process completed!');

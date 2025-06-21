#!/usr/bin/env node

/**
 * Eden Clinic Production Configuration Verification Script
 * 
 * This script checks that all required environment variables are set
 * and that the application is properly configured for production deployment.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const chalk = require('chalk');

// Load environment variables from .env files
dotenv.config({ path: '.env.production' });
dotenv.config({ path: '.env.local' });
dotenv.config();

console.log(chalk.blue('🔍 Eden Clinic Production Configuration Verification'));
console.log(chalk.blue('================================================='));

// Required environment variables
const requiredVars = [
  // Database
  { name: 'DATABASE_URL', description: 'PostgreSQL database connection string' },
  { name: 'DIRECT_URL', description: 'Direct PostgreSQL connection string' },
  
  // Supabase
  { name: 'NEXT_PUBLIC_SUPABASE_URL', description: 'Supabase project URL' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Supabase anonymous key' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service role key' },
  
  // Authentication
  { name: 'JWT_SECRET', description: 'Secret for JWT token signing' },
  
  // Stripe
  { name: 'STRIPE_SECRET_KEY', description: 'Stripe secret key' },
  { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', description: 'Stripe publishable key' },
  { name: 'STRIPE_WEBHOOK_SECRET', description: 'Stripe webhook secret' },
  
  // Email
  { name: 'SENDGRID_API_KEY', description: 'SendGrid API key' },
  { name: 'SENDGRID_FROM_EMAIL', description: 'SendGrid sender email' },
  { name: 'SUPPORT_EMAIL', description: 'Support email address' },
];

// Check for required environment variables
let missingVars = 0;
console.log(chalk.yellow('\n📋 Checking required environment variables:'));

requiredVars.forEach(({ name, description }) => {
  if (!process.env[name]) {
    console.log(chalk.red(`❌ Missing ${name}: ${description}`));
    missingVars++;
  } else {
    // Show first few characters of sensitive values
    const value = process.env[name];
    const displayValue = name.includes('KEY') || name.includes('SECRET') || name.includes('URL')
      ? `${value.substring(0, 5)}...${value.substring(value.length - 3)}`
      : value;
    console.log(chalk.green(`✅ ${name}: ${displayValue}`));
  }
});

// Check for development mode flags
console.log(chalk.yellow('\n🚫 Checking development mode flags:'));

const devFlags = [
  { name: 'NEXT_PUBLIC_USE_FIREBASE_EMULATOR', expected: 'false' },
  { name: 'FORCE_REAL_EMAILS', expected: 'true' },
  { name: 'ENABLE_TEST_DATA_CLEANUP', expected: 'true' },
  { name: 'NODE_ENV', expected: 'production' },
];

devFlags.forEach(({ name, expected }) => {
  const value = process.env[name] || 'not set';
  if (value !== expected) {
    console.log(chalk.red(`❌ ${name} should be "${expected}" but is "${value}"`));
    missingVars++;
  } else {
    console.log(chalk.green(`✅ ${name}: ${value}`));
  }
});

// Check next.config.js
console.log(chalk.yellow('\n📄 Checking next.config.js:'));

try {
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Check for production configuration
  const checks = [
    { pattern: /output:\s*['"]standalone['"]/, message: 'Output set to standalone' },
    { pattern: /domains:\s*\[.*?eden-clinic-blood-test-app\.windsurf\.build.*?\]/, message: 'Production domain in image config' },
    { pattern: /assetPrefix:\s*isProd\s*\?/, message: 'Asset prefix configured for production' },
    { pattern: /experimental:\s*\{[\s\S]*?serverActions:\s*true/, message: 'Server Actions enabled' },
  ];
  
  checks.forEach(({ pattern, message }) => {
    if (pattern.test(nextConfig)) {
      console.log(chalk.green(`✅ ${message}`));
    } else {
      console.log(chalk.red(`❌ ${message} not found`));
      missingVars++;
    }
  });
} catch (error) {
  console.log(chalk.red(`❌ Error reading next.config.js: ${error.message}`));
  missingVars++;
}

// Check for Netlify configuration
console.log(chalk.yellow('\n🌐 Checking Netlify configuration:'));

try {
  const netlifyConfigPath = path.join(process.cwd(), 'netlify.toml');
  const netlifyConfig = fs.readFileSync(netlifyConfigPath, 'utf8');
  
  const netlifyChecks = [
    { pattern: /\[build\]/, message: 'Build configuration present' },
    { pattern: /command\s*=\s*["']npm run build["']/, message: 'Build command configured' },
    { pattern: /publish\s*=\s*["']\.next["']/, message: 'Publish directory set to .next' },
    { pattern: /package\s*=\s*["']@netlify\/plugin-nextjs["']/, message: 'Next.js plugin configured' },
  ];
  
  netlifyChecks.forEach(({ pattern, message }) => {
    if (pattern.test(netlifyConfig)) {
      console.log(chalk.green(`✅ ${message}`));
    } else {
      console.log(chalk.red(`❌ ${message} not found`));
      missingVars++;
    }
  });
} catch (error) {
  console.log(chalk.red(`❌ Error reading netlify.toml: ${error.message}`));
  missingVars++;
}

// Summary
console.log(chalk.blue('\n================================================='));
if (missingVars > 0) {
  console.log(chalk.red(`❌ Found ${missingVars} configuration issues that need to be fixed before deployment.`));
  console.log(chalk.yellow('Please review the issues above and fix them before deploying to production.'));
  process.exit(1);
} else {
  console.log(chalk.green('✅ All production configuration checks passed!'));
  console.log(chalk.green('You are ready to deploy to production.'));
  console.log(chalk.blue('\nTo deploy:'));
  console.log(chalk.white('1. Commit your changes: git add . && git commit -m "Prepare for production deployment"'));
  console.log(chalk.white('2. Push to GitHub: git push origin main'));
  console.log(chalk.white('3. Monitor the deployment in Netlify dashboard'));
}

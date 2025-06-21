#!/usr/bin/env node

/**
 * This script validates critical environment variables for production deployment
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
let envVars = {};

try {
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    envVars = envConfig;
    console.log('✅ Found .env file');
  } else {
    console.log('❌ No .env file found in project root');
  }
} catch (error) {
  console.error('Error reading .env file:', error);
}

// Check Supabase environment variables
console.log('\n🔷 Checking Supabase Configuration:');
checkEnvVar('NEXT_PUBLIC_SUPABASE_URL', true);
checkEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', true);
checkEnvVar('SUPABASE_SERVICE_ROLE_KEY', false);

// Check JWT_SECRET for slash at start
const jwtSecret = envVars.JWT_SECRET;
if (jwtSecret) {
  console.log(`✅ Found JWT_SECRET`);
  if (jwtSecret.startsWith('/')) {
    console.log('⚠️ WARNING: JWT_SECRET starts with a slash (/), which may cause issues');
  }
} else {
  console.log('❌ Missing JWT_SECRET');
}

checkEnvVar('SUPABASE_DB_PASSWORD', false);

// Check Stripe environment variables
console.log('\n🔷 Checking Stripe Configuration:');
checkEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', true);
checkEnvVar('STRIPE_SECRET_KEY', false);
checkEnvVar('STRIPE_WEBHOOK_SECRET', false);

// Check SendGrid environment variables
console.log('\n🔷 Checking SendGrid Configuration:');
checkEnvVar('SENDGRID_API_KEY', false);
checkEnvVar('SENDGRID_FROM_EMAIL', true);
checkEnvVar('SUPPORT_EMAIL', true);

// Check for hardcoded URLs
console.log('\n🔷 Checking for hardcoded URLs:');
checkEnvVar('BASE_URL', true);

// Helper function to check environment variables
function checkEnvVar(name, isPublic) {
  const value = envVars[name];
  if (!value) {
    console.log(`❌ Missing ${name}`);
    return false;
  }
  
  // For public variables, show partial value
  if (isPublic) {
    console.log(`✅ Found ${name}: ${maskValue(value)}`);
  } else {
    console.log(`✅ Found ${name}: [HIDDEN]`);
  }
  
  return true;
}

// Helper function to mask sensitive values
function maskValue(value) {
  if (!value || value.length < 8) return '[HIDDEN]';
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
}

console.log('\n✨ Environment validation complete');

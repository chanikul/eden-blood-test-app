#!/usr/bin/env node

/**
 * This script checks for the presence of important environment variables
 * and provides guidance on how to set them up correctly.
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

// Check for Google Maps API key
const googleMapsApiKey = envVars.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
if (!googleMapsApiKey) {
  console.log('❌ Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env file');
  console.log('  This is required for the address autocomplete feature to work.');
  console.log('  Get an API key from: https://developers.google.com/maps/documentation/javascript/get-api-key');
  console.log('  Make sure to enable the Places API in your Google Cloud Console.');
  console.log('  Add to your .env file: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here');
} else {
  console.log(`✅ Found NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: ${googleMapsApiKey.substring(0, 4)}...${googleMapsApiKey.substring(googleMapsApiKey.length - 4)}`);
  
  // Check if it looks like a valid Google Maps API key (they typically start with "AIza")
  if (!googleMapsApiKey.startsWith('AIza')) {
    console.log('⚠️ Warning: Google Maps API key does not start with "AIza", which is unusual.');
    console.log('  Please verify that the key is correct.');
  }
}

// Check for other important environment variables
const criticalEnvVars = [
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'JWT_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

console.log('\n--- Critical Environment Variables ---');
criticalEnvVars.forEach(varName => {
  if (envVars[varName]) {
    const value = envVars[varName];
    const displayValue = value.length > 8 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '[too short]';
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ Missing ${varName}`);
  }
});

console.log('\n--- Next.js Public Environment Variables ---');
Object.keys(envVars)
  .filter(key => key.startsWith('NEXT_PUBLIC_'))
  .forEach(key => {
    const value = envVars[key];
    const displayValue = value.length > 8 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : value;
    console.log(`✅ ${key}: ${displayValue}`);
  });

console.log('\n--- Environment Check Complete ---');

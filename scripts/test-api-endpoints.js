#!/usr/bin/env node

/**
 * This script tests critical API endpoints for the Eden Clinic app
 */

// Using built-in fetch API
const BASE_URL = 'http://localhost:3000';

async function testEndpoints() {
  console.log('🔍 Testing Eden Clinic API Endpoints\n');
  
  // Test endpoints
  await testEndpoint('/api/products', 'Products API');
  await testEndpoint('/api/admin/stats', 'Admin Stats API');
  await testEndpoint('/api/debug-products', 'Debug Products API');
}

async function testEndpoint(path, name) {
  try {
    console.log(`Testing ${name} (${path})...`);
    const response = await fetch(`${BASE_URL}${path}`);
    const contentType = response.headers.get('content-type');
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const data = await response.json();
        console.log(`  Response: Valid JSON (${typeof data === 'object' ? Object.keys(data).length : 0} keys)`);
        
        if (typeof data === 'object' && data !== null) {
          if (Array.isArray(data)) {
            console.log(`  Data: Array with ${data.length} items`);
          } else if (data.error) {
            console.log(`  Error: ${data.error}`);
            if (data.message) console.log(`  Message: ${data.message}`);
          } else {
            console.log(`  Data: Object with keys: ${Object.keys(data).join(', ')}`);
          }
        }
      } catch (jsonError) {
        console.log(`  Response: Invalid JSON (${jsonError.message})`);
        const text = await response.text();
        console.log(`  Raw response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      }
    } else {
      const text = await response.text();
      console.log(`  Response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    }
  } catch (error) {
    console.log(`  Error: ${error.message}`);
  }
  
  console.log(''); // Add empty line for readability
}

// Run the tests
testEndpoints().catch(console.error);

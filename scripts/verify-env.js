require('dotenv').config();

console.log('\n=== Environment Variables Check ===');
console.log('DATABASE_URL configured:', !!process.env.DATABASE_URL);
console.log('DIRECT_URL configured:', !!process.env.DIRECT_URL);

// Check if URLs match expected Supabase hostname
const dbUrl = new URL(process.env.DATABASE_URL || '');
const directUrl = new URL(process.env.DIRECT_URL || '');

console.log('\n=== URL Validation ===');
console.log('DATABASE_URL hostname:', dbUrl.hostname);
console.log('DATABASE_URL port:', dbUrl.port, '(should be 6543 for pooled connections)');
console.log('DIRECT_URL hostname:', directUrl.hostname);
console.log('DIRECT_URL port:', directUrl.port, '(should be 5432 for direct connections)');

// Verify against expected values
const expectedHostname = 'aws-0-eu-west-2.pooler.supabase.com';
const expectedPooledPort = '6543';
const expectedDirectPort = '5432';

console.log('\n=== Validation Results ===');
console.log('DATABASE_URL hostname matches:', dbUrl.hostname === expectedHostname ? '✅' : '❌');
console.log('DATABASE_URL port correct:', dbUrl.port === expectedPooledPort ? '✅' : '❌');
console.log('DIRECT_URL hostname matches:', directUrl.hostname === expectedHostname ? '✅' : '❌');
console.log('DIRECT_URL port correct:', directUrl.port === expectedDirectPort ? '✅' : '❌');

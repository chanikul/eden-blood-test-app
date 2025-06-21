#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Path to the seed script
const seedScript = path.join(__dirname, 'seed-test-data.ts');

// Run the seed script using ts-node
const child = spawn('npx', ['ts-node', seedScript], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error(`Error executing seed script: ${error.message}`);
  process.exit(1);
});

child.on('close', (code) => {
  if (code !== 0) {
    console.error(`Seed script exited with code ${code}`);
    process.exit(code);
  }
  console.log('Seed script completed successfully');
});

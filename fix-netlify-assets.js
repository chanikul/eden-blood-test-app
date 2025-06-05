// Script to fix Next.js asset paths for Netlify deployment
const fs = require('fs-extra');
const path = require('path');

console.log('Starting Netlify asset fix script...');

// Main directories
const nextDir = path.join(process.cwd(), '.next');
const publicDir = path.join(process.cwd(), 'public');
const nextStaticDir = path.join(nextDir, 'static');
const publicNextDir = path.join(publicDir, '_next');
const publicNextStaticDir = path.join(publicNextDir, 'static');

// Ensure directories exist
console.log('Creating necessary directories...');
fs.ensureDirSync(publicNextDir);
fs.ensureDirSync(publicNextStaticDir);

// Copy all static assets from .next/static to public/_next/static
console.log('Copying static assets to public/_next/static...');
fs.copySync(nextStaticDir, publicNextStaticDir, {
  overwrite: true,
  errorOnExist: false,
  dereference: true,
  preserveTimestamps: true
});

// Create _headers file for proper caching
console.log('Creating Netlify _headers file...');
const headersContent = `
# Cache static assets for 1 year
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

# Cache page data for 1 minute
/_next/data/*
  Cache-Control: public, max-age=60

# Don't cache HTML and other dynamic content
/*
  Cache-Control: public, max-age=0, must-revalidate
`;

fs.writeFileSync(path.join(publicDir, '_headers'), headersContent.trim());

console.log('Asset fix completed successfully!');

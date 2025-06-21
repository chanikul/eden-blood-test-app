// Script to fix Next.js asset paths for Netlify deployment
const fs = require('fs-extra');
const path = require('path');

console.log('Starting Netlify asset fix script...');

// Main directories
const nextDir = path.join(process.cwd(), '.next');
const nextStaticDir = path.join(nextDir, 'static');

// Create a special _headers file for proper caching
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

fs.writeFileSync(path.join(nextDir, '_headers'), headersContent.trim());

// Create a special _redirects file to ensure CSS is properly served
console.log('Creating Netlify _redirects file...');
const redirectsContent = `
# Ensure static assets are properly served
/_next/static/*  /static/:splat  200

# Ensure CSS files are properly served
/_next/static/css/*  /static/css/:splat  200

# Ensure JS chunks are properly served
/_next/static/chunks/*  /static/chunks/:splat  200

# Ensure media files are properly served
/_next/static/media/*  /static/media/:splat  200

# Ensure image files are properly served
/_next/static/images/*  /static/images/:splat  200

# Handle client-side routing
/*  /index.html  200
`;

fs.writeFileSync(path.join(nextDir, '_redirects'), redirectsContent.trim());

// Copy any necessary files from public to .next
console.log('Copying public files to .next...');
if (fs.existsSync(path.join(process.cwd(), 'public'))) {
  fs.copySync(
    path.join(process.cwd(), 'public'),
    nextDir,
    {
      overwrite: false,
      errorOnExist: false
    }
  );
}

console.log('Asset fix completed successfully!');

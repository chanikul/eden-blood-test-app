// Script to enhance Next.js static assets for Netlify deployment
const fs = require('fs-extra');
const path = require('path');

console.log('Enhancing Next.js static assets for Netlify deployment...');

// Create a _redirects file in the .next directory to handle static assets
const redirectsContent = `
# Redirect static assets to the correct location
/_next/static/*  /static/:splat  200

# Handle client-side routing
/*  /index.html  200
`;

fs.writeFileSync(path.join(__dirname, '.next', '_redirects'), redirectsContent.trim());
console.log('Created _redirects file in .next directory');

// Copy public directory contents to .next for proper asset handling
const publicDir = path.join(__dirname, 'public');
const nextDir = path.join(__dirname, '.next');

if (fs.existsSync(publicDir)) {
  fs.copySync(publicDir, nextDir, {
    filter: (src) => {
      // Don't overwrite _redirects file we just created
      return path.basename(src) !== '_redirects' || !fs.existsSync(path.join(nextDir, '_redirects'));
    }
  });
  console.log('Copied public directory contents to .next');
}

console.log('Static asset enhancement completed successfully!');


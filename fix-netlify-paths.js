// fix-netlify-paths.js
const fs = require('fs');
const path = require('path');

// Function to copy files recursively
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// Create the _redirects file with proper rules for static assets
function createRedirectsFile() {
  const redirectsContent = `
# Redirect all Next.js static assets to the correct location
/_next/static/*  /.next/static/:splat  200
/_next/data/*    /.next/data/:splat    200

# Handle client-side routing for Next.js app router
/*  /index.html  200!
`;

  fs.writeFileSync(path.join('.next', '_redirects'), redirectsContent.trim());
  console.log('Created _redirects file in .next directory');
}

// Create the _headers file with caching rules
function createHeadersFile() {
  const headersContent = `
# Cache static assets for 1 year
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

# Don't cache HTML and other dynamic content
/*
  Cache-Control: public, max-age=0, must-revalidate
`;

  fs.writeFileSync(path.join('.next', '_headers'), headersContent.trim());
  console.log('Created _headers file in .next directory');
}

// Copy all files from public directory to .next
function copyPublicFiles() {
  const publicDir = path.join(process.cwd(), 'public');
  const targetDir = path.join(process.cwd(), '.next');
  
  if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir);
    
    files.forEach(file => {
      const srcPath = path.join(publicDir, file);
      const destPath = path.join(targetDir, file);
      
      if (fs.statSync(srcPath).isDirectory()) {
        copyRecursiveSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
    
    console.log('Copied public files to .next directory');
  }
}

// Main function
function main() {
  createRedirectsFile();
  createHeadersFile();
  copyPublicFiles();
  console.log('Netlify path fixes completed successfully');
}

main();

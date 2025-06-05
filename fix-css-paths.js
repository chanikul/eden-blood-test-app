// Script to fix CSS paths in Next.js build output
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

console.log('Fixing CSS paths in Next.js build output...');

// Function to find all CSS files
function findCssFiles() {
  return new Promise((resolve, reject) => {
    glob('.next/static/css/*.css', (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(files);
    });
  });
}

// Function to fix HTML files to ensure they reference CSS properly
async function fixHtmlFiles(cssFiles) {
  // Get all HTML files
  const htmlFiles = await new Promise((resolve, reject) => {
    glob('.next/**/*.html', (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(files);
    });
  });

  console.log(`Found ${htmlFiles.length} HTML files to process`);

  // Create CSS link tags for each CSS file
  const cssLinkTags = cssFiles.map(file => {
    const relativePath = file.replace('.next/', '');
    return `<link rel="stylesheet" href="/${relativePath}">`;
  }).join('\\n');

  // Process each HTML file
  for (const htmlFile of htmlFiles) {
    try {
      let content = fs.readFileSync(htmlFile, 'utf8');
      
      // Check if the file already has our CSS links
      if (!content.includes('<!-- CSS-FIX -->')) {
        // Insert CSS links after the <head> tag
        content = content.replace(/<head>/, `<head>\\n<!-- CSS-FIX -->${cssLinkTags}<!-- /CSS-FIX -->`);
        fs.writeFileSync(htmlFile, content);
        console.log(`Fixed CSS references in ${htmlFile}`);
      }
    } catch (error) {
      console.error(`Error processing ${htmlFile}:`, error);
    }
  }
}

// Create a custom _redirects file to ensure CSS is properly served
function createRedirects() {
  const redirectsContent = `
# Ensure CSS files are properly served
/static/css/*  /.next/static/css/:splat  200
/_next/static/css/*  /.next/static/css/:splat  200

# Handle client-side routing
/*  /index.html  200
`;

  fs.writeFileSync('.next/_redirects', redirectsContent.trim());
  console.log('Created custom _redirects file');
}

// Copy CSS files to a location that's guaranteed to be accessible
async function copyCssToPublic(cssFiles) {
  // Ensure public directory exists
  fs.ensureDirSync('.next/public/css');
  
  for (const file of cssFiles) {
    const filename = path.basename(file);
    fs.copyFileSync(file, `.next/public/css/${filename}`);
    console.log(`Copied ${file} to .next/public/css/${filename}`);
  }
}

// Main function
async function main() {
  try {
    // Find all CSS files
    const cssFiles = await findCssFiles();
    console.log(`Found ${cssFiles.length} CSS files`);
    
    if (cssFiles.length === 0) {
      console.warn('No CSS files found! This might indicate a problem with the build.');
      return;
    }
    
    // Fix HTML files
    await fixHtmlFiles(cssFiles);
    
    // Create redirects
    createRedirects();
    
    // Copy CSS files to public directory
    await copyCssToPublic(cssFiles);
    
    console.log('CSS path fixing completed successfully!');
  } catch (error) {
    console.error('Error fixing CSS paths:', error);
    process.exit(1);
  }
}

main();

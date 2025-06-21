// netlify-postbuild.js
const fs = require('fs');
const path = require('path');

// Function to recursively copy files
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

// Copy static assets to a location Netlify can serve them from
function copyStaticAssets() {
  console.log('Starting to copy static assets for Netlify...');
  
  // Copy CSS files to ensure they're accessible
  const cssSourceDir = path.join(process.cwd(), '.next', 'static', 'css');
  
  if (fs.existsSync(cssSourceDir)) {
    // Copy to root _next/static/css directory for direct access
    const cssDestDir = path.join(process.cwd(), '.next', '_next', 'static', 'css');
    copyRecursiveSync(cssSourceDir, cssDestDir);
    console.log('Copied CSS files to .next/_next/static/css');
  } else {
    console.log('CSS source directory not found:', cssSourceDir);
  }
  
  // Copy JS chunks as well
  const chunksSourceDir = path.join(process.cwd(), '.next', 'static', 'chunks');
  
  if (fs.existsSync(chunksSourceDir)) {
    // Copy to root _next/static/chunks directory for direct access
    const chunksDestDir = path.join(process.cwd(), '.next', '_next', 'static', 'chunks');
    copyRecursiveSync(chunksSourceDir, chunksDestDir);
    console.log('Copied JS chunks to .next/_next/static/chunks');
  } else {
    console.log('Chunks source directory not found:', chunksSourceDir);
  }
  
  // Copy all other static assets
  const staticSourceDir = path.join(process.cwd(), '.next', 'static');
  if (fs.existsSync(staticSourceDir)) {
    // Create a directory structure that matches what the browser expects
    const staticDestDir = path.join(process.cwd(), '.next', '_next', 'static');
    copyRecursiveSync(staticSourceDir, staticDestDir);
    console.log('Copied all static assets to .next/_next/static');
  } else {
    console.log('Static source directory not found:', staticSourceDir);
  }
  
  // Copy build ID file to ensure correct asset paths
  const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');
  if (fs.existsSync(buildIdPath)) {
    const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
    console.log('Found build ID:', buildId);
    
    // Create directories for build-specific assets
    const buildDestDir = path.join(process.cwd(), '.next', '_next', 'static', buildId);
    fs.mkdirSync(buildDestDir, { recursive: true });
    
    // Copy any build-specific assets if they exist
    const buildSourceDir = path.join(process.cwd(), '.next', 'static', buildId);
    if (fs.existsSync(buildSourceDir)) {
      copyRecursiveSync(buildSourceDir, buildDestDir);
      console.log('Copied build-specific assets');
    }
    
    // Also copy to root static directory for direct access
    // This helps with the pattern matching in Netlify redirects
    const rootBuildDestDir = path.join(process.cwd(), '.next', 'static', buildId);
    fs.mkdirSync(rootBuildDestDir, { recursive: true });
    
    // Copy any build-specific chunks to the static directory
    const buildChunksSourceDir = path.join(process.cwd(), '.next', 'static', 'chunks');
    if (fs.existsSync(buildChunksSourceDir)) {
      const buildChunksDestDir = path.join(process.cwd(), '.next', 'static', buildId);
      copyRecursiveSync(buildChunksSourceDir, buildChunksDestDir);
      console.log('Copied build-specific chunks to static directory');
    }
  }
}

// Create a netlify.toml file inside the .next directory
function createNetlifyConfig() {
  // Get the build ID for specific redirects
  let buildId = '';
  const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');
  if (fs.existsSync(buildIdPath)) {
    buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
  }

  const netlifyConfig = `
# Netlify configuration for Next.js
[[redirects]]
  from = "/_next/static/css/*"
  to = "/.next/static/css/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/_next/static/chunks/*"
  to = "/.next/static/chunks/:splat"
  status = 200
  force = true

${buildId ? `[[redirects]]
  from = "/_next/static/${buildId}/*"
  to = "/.next/static/${buildId}/:splat"
  status = 200
  force = true
` : ''}

[[redirects]]
  from = "/_next/static/*"
  to = "/.next/static/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/_next/*"
  to = "/.next/_next/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;

  fs.writeFileSync(path.join('.next', 'netlify.toml'), netlifyConfig.trim());
  console.log('Created netlify.toml file in .next directory');
}

// Main function to run all tasks
function main() {
  copyStaticAssets();
  createNetlifyConfig();
  console.log('Netlify post-build process completed successfully');
}

main();

// This script creates symlinks for UI components to ensure proper resolution
const fs = require('fs');
const path = require('path');

// Ensure the .next/server directory exists
const serverDir = path.resolve(__dirname, '.next/server');
if (!fs.existsSync(serverDir)) {
  fs.mkdirSync(serverDir, { recursive: true });
}

// Create a components directory in .next/server
const componentsDir = path.resolve(serverDir, 'components');
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

// Create a ui directory in .next/server/components
const uiDir = path.resolve(componentsDir, 'ui');
if (!fs.existsSync(uiDir)) {
  fs.mkdirSync(uiDir, { recursive: true });
}

// Copy UI component files to ensure they're available during build
const srcUiDir = path.resolve(__dirname, 'src/components/ui');
if (fs.existsSync(srcUiDir)) {
  const files = fs.readdirSync(srcUiDir);
  
  files.forEach(file => {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const srcPath = path.resolve(srcUiDir, file);
      const destPath = path.resolve(uiDir, file);
      
      // Copy the file
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${file} to ensure component resolution`);
    }
  });
}

console.log('Component resolution fix complete');

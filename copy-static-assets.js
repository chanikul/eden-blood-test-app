// Script to copy static assets to the standalone directory
const fs = require('fs-extra');
const path = require('path');

console.log('Copying static assets to standalone directory...');

// Ensure the public directory exists in standalone
const publicDir = path.join(__dirname, '.next/standalone/public');
fs.ensureDirSync(publicDir);

// Copy static directory to standalone/public/_next/static
const sourceStaticDir = path.join(__dirname, '.next/static');
const targetStaticDir = path.join(__dirname, '.next/standalone/public/_next/static');
fs.copySync(sourceStaticDir, targetStaticDir);

// Copy other assets from .next root to standalone/public
const nextDir = path.join(__dirname, '.next');
fs.readdirSync(nextDir).forEach(file => {
  const filePath = path.join(nextDir, file);
  // Skip directories and files we don't want to copy
  if (fs.statSync(filePath).isDirectory() && 
      !['standalone', 'cache', 'server', 'types'].includes(file)) {
    fs.copySync(filePath, path.join(publicDir, file));
  } else if (fs.statSync(filePath).isFile() && 
            file.match(/\.(svg|png|jpg|jpeg|gif|ico|json)$/)) {
    fs.copyFileSync(filePath, path.join(publicDir, file));
  }
});

console.log('Static assets copied successfully!');

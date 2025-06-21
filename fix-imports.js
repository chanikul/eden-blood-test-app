#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to recursively find all .ts files in a directory
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Get relative path from file to src directory
  const relativePath = path.relative(path.dirname(filePath), path.join(path.dirname(filePath), '..', '..', '..', '..'));
  
  // Replace @/lib/ imports with relative paths
  content = content.replace(/from\s+['"]@\/lib\/(.*?)['"]/g, (match, importPath) => {
    return `from '${relativePath}/lib/${importPath}'`;
  });
  
  // Replace @/components/ imports with relative paths
  content = content.replace(/from\s+['"]@\/components\/(.*?)['"]/g, (match, importPath) => {
    return `from '${relativePath}/components/${importPath}'`;
  });
  
  // Replace @/types/ imports with relative paths
  content = content.replace(/from\s+['"]@\/types\/(.*?)['"]/g, (match, importPath) => {
    return `from '${relativePath}/types/${importPath}'`;
  });
  
  // Only write back if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed imports in ${filePath}`);
    return true;
  }
  
  return false;
}

// Main function
function main() {
  const apiDir = path.join(__dirname, 'src', 'app', 'api');
  const tsFiles = findTsFiles(apiDir);
  
  let fixedCount = 0;
  
  tsFiles.forEach(file => {
    if (fixImportsInFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`\nFixed imports in ${fixedCount} files.`);
}

main();

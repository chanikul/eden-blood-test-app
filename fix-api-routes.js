#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all .ts files in a directory
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file === 'route.ts') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix API route files
function fixApiRouteFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let modified = false;
  
  // 1. Fix import paths - make sure they have the correct number of '../'
  const relativePath = path.relative(path.dirname(filePath), path.join(process.cwd(), 'src'));
  const correctPrefix = relativePath + '/lib/';
  
  // Fix relative paths that might be incorrect
  content = content.replace(/from\s+['"]\.\.\/\.\.\/\.\.\/\.\.\/lib\/(.*?)['"]/g, (match, importPath) => {
    modified = true;
    return `from '${correctPrefix}${importPath}'`;
  });
  
  // 2. Ensure NextRequest is imported if it's not already
  if (content.includes('export async function') && !content.includes('NextRequest')) {
    if (content.includes('import { NextResponse } from \'next/server\';')) {
      content = content.replace(
        'import { NextResponse } from \'next/server\';',
        'import { NextRequest, NextResponse } from \'next/server\';'
      );
      modified = true;
    }
  }
  
  // 3. Update function signatures to use NextRequest
  if (content.includes('export async function') && content.includes('NextRequest')) {
    content = content.replace(
      /export async function (GET|POST|PUT|PATCH|DELETE)\(request: Request\)/g,
      'export async function $1(request: NextRequest)'
    );
    modified = true;
  }
  
  // Only write back if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed API route in ${filePath}`);
    return true;
  }
  
  return false;
}

// Main function
function main() {
  const apiDir = path.join(__dirname, 'src', 'app', 'api');
  const routeFiles = findTsFiles(apiDir);
  
  let fixedCount = 0;
  
  routeFiles.forEach(file => {
    if (fixApiRouteFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`\nFixed ${fixedCount} API route files.`);
}

main();

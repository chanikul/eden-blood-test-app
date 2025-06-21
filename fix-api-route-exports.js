#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all route.ts files in a directory
function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findRouteFiles(filePath, fileList);
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
  
  // 1. Make sure we have the correct imports
  if (!content.includes('import { NextRequest, NextResponse }')) {
    if (content.includes('import { NextResponse }')) {
      content = content.replace(
        'import { NextResponse }',
        'import { NextRequest, NextResponse }'
      );
      modified = true;
    }
  }
  
  // 2. Fix function signatures for HTTP methods
  const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  
  httpMethods.forEach(method => {
    // Fix export async function METHOD(request: Request)
    const regex1 = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(\\s*request\\s*:\\s*Request\\s*\\)`, 'g');
    if (regex1.test(content)) {
      content = content.replace(regex1, `export async function ${method}(request: NextRequest)`);
      modified = true;
    }
    
    // Fix export async function METHOD(req: Request)
    const regex2 = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(\\s*req\\s*:\\s*Request\\s*\\)`, 'g');
    if (regex2.test(content)) {
      content = content.replace(regex2, `export async function ${method}(request: NextRequest)`);
      modified = true;
    }
    
    // Fix export async function METHOD(request)
    const regex3 = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(\\s*request\\s*\\)`, 'g');
    if (regex3.test(content)) {
      content = content.replace(regex3, `export async function ${method}(request: NextRequest)`);
      modified = true;
    }
    
    // Fix export async function METHOD(req)
    const regex4 = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(\\s*req\\s*\\)`, 'g');
    if (regex4.test(content)) {
      content = content.replace(regex4, `export async function ${method}(request: NextRequest)`);
      modified = true;
    }
    
    // Fix export async function METHOD(): Promise<...>
    const regex5 = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(\\s*\\)\\s*:\\s*Promise<`, 'g');
    if (regex5.test(content)) {
      content = content.replace(regex5, `export async function ${method}(request: NextRequest): Promise<`);
      modified = true;
    }
    
    // Fix export function METHOD
    const regex6 = new RegExp(`export\\s+function\\s+${method}\\s*\\(`, 'g');
    if (regex6.test(content)) {
      content = content.replace(regex6, `export async function ${method}(`);
      modified = true;
    }
  });
  
  // 3. Make sure all HTTP methods return NextResponse
  httpMethods.forEach(method => {
    if (content.includes(`export async function ${method}`) && !content.includes('NextResponse')) {
      // Add NextResponse import if it's missing
      if (!content.includes('import { NextResponse }') && !content.includes('import { NextRequest, NextResponse }')) {
        content = `import { NextRequest, NextResponse } from 'next/server';\n${content}`;
        modified = true;
      }
    }
  });
  
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
  const routeFiles = findRouteFiles(apiDir);
  
  let fixedCount = 0;
  
  routeFiles.forEach(file => {
    if (fixApiRouteFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`\nFixed ${fixedCount} API route files.`);
}

main();

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

async function findApiRouteFiles(dir) {
  const files = await readdir(dir);
  const results = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      const nestedResults = await findApiRouteFiles(filePath);
      results.push(...nestedResults);
    } else if (file === 'route.ts' && dir.includes('/api/')) {
      results.push(filePath);
    }
  }

  return results;
}

async function fixRouteHandlers(filePath) {
  console.log(`Processing: ${filePath}`);
  let content = await readFile(filePath, 'utf8');
  
  // Fix handlers with params
  content = content.replace(
    /export const (\w+) = async \(request, { params }\)/g, 
    'export const $1 = async (request) => {\n  const { params } = request'
  );
  
  // Fix simple handlers without params
  content = content.replace(
    /export const (\w+) = async \(request\)(?!\s*=>)/g, 
    'export const $1 = async (request) =>'
  );
  
  // Fix any missing opening braces after arrow functions
  content = content.replace(
    /export const (\w+) = async \(request\) =>\s*(?!{)/g,
    'export const $1 = async (request) => {'
  );
  
  // Fix any missing closing braces at the end of the file
  if (content.split('{').length > content.split('}').length) {
    content = content + '\n}';
  }

  await writeFile(filePath, content);
  console.log(`Fixed: ${filePath}`);
}

async function main() {
  try {
    const apiDir = path.join(__dirname, '../src/app/api');
    const routeFiles = await findApiRouteFiles(apiDir);
    
    console.log(`Found ${routeFiles.length} API route files to process`);
    
    for (const file of routeFiles) {
      await fixRouteHandlers(file);
    }
    
    console.log('All files processed successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

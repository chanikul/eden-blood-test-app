const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to update the export syntax in a file
function updateFileExports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace export async function with export const
    const updatedContent = content.replace(
      /export\s+async\s+function\s+([A-Z]+)\s*\(/g, 
      'export const $1 = async ('
    );
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

// Process a batch of files
function processBatch(files) {
  let updatedCount = 0;
  
  for (const file of files) {
    const updated = updateFileExports(file);
    if (updated) updatedCount++;
  }
  
  console.log(`Updated ${updatedCount} files out of ${files.length}`);
  return updatedCount;
}

// Main function
function main() {
  // Get all route.ts files from the api directory
  const apiDir = path.resolve(__dirname, '../src/app/api');
  const routeFiles = execSync(`find ${apiDir} -name "route.ts"`, { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  
  console.log(`Found ${routeFiles.length} route files to process`);
  
  const updatedCount = processBatch(routeFiles);
  
  console.log(`Total files updated: ${updatedCount}`);
}

main();

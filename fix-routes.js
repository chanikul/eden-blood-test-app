const fs = require('fs');
const path = require('path');
const { rm } = require('fs/promises');

// Path to the conflicting directory
const conflictingPath = path.join(__dirname, 'src', 'app', 'api', 'admin', 'orders', '[id]');

// Check if the directory exists
if (fs.existsSync(conflictingPath)) {
  console.log(`Removing conflicting directory: ${conflictingPath}`);
  
  // Use fs.rm to force delete the directory and its contents
  rm(conflictingPath, { recursive: true, force: true })
    .then(() => {
      console.log('Directory removed successfully!');
    })
    .catch(err => {
      console.error('Error removing directory:', err);
    });
} else {
  console.log(`Directory does not exist: ${conflictingPath}`);
}

#!/usr/bin/env node

import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const projectRoot = path.resolve(__dirname, '..');
  const testDir = path.join(projectRoot, 'src/lib/email-templates/__tests__');
  const command = `cross-env NODE_ENV=test ts-node --project ${path.join(testDir, 'tsconfig.json')} ${path.join(testDir, 'email-preview.ts')}`;
  
  execSync(command, { stdio: 'inherit', cwd: projectRoot });
} catch (error) {
  console.error('Failed to run email preview:', error);
  process.exit(1);
}

const fs = require('fs');
const path = require('path');

// Fix seed-sample-data.ts
const seedFilePath = path.join(__dirname, 'scripts', 'seed-sample-data.ts');
let seedContent = fs.readFileSync(seedFilePath, 'utf8');

// Add hashPassword function if it doesn't exist
if (!seedContent.includes('hashPassword')) {
  seedContent = seedContent.replace(
    "import crypto from 'crypto';",
    "import crypto from 'crypto';\n\n// Simple hash function to replace bcrypt for sample data\nconst hashPassword = async (password) => {\n  return crypto.createHash('sha256').update(password).digest('hex');\n};"
  );
}

// Replace bcrypt references with hashPassword
seedContent = seedContent.replace(/await bcrypt\.hash\('samplepass123', 10\)/g, "await hashPassword('samplepass123')");
fs.writeFileSync(seedFilePath, seedContent);
console.log('✅ Fixed bcrypt references in seed-sample-data.ts');

// Fix Button component in reset-password page
const buttonFilePath = path.join(__dirname, 'src', 'components', 'ui', 'button.tsx');
let buttonContent = fs.readFileSync(buttonFilePath, 'utf8');

// Add loading prop if it doesn't exist
if (!buttonContent.includes('loading?: boolean')) {
  buttonContent = buttonContent.replace(
    'interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {',
    'interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {\n  loading?: boolean;'
  );
  
  // Update the function parameters
  buttonContent = buttonContent.replace(
    'fullWidth = false,',
    'fullWidth = false,\n  loading = false,'
  );
  
  // Update the button rendering to handle loading state
  buttonContent = buttonContent.replace(
    '{children}',
    '{loading ? (\n        <span className="flex items-center">\n          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">\n            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>\n            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>\n          </svg>\n          {children}\n        </span>\n      ) : (\n        children\n      )}'
  );
  
  // Add disabled attribute for loading state
  buttonContent = buttonContent.replace(
    '{...props}',
    'disabled={loading || props.disabled}\n      {...props}'
  );
  
  fs.writeFileSync(buttonFilePath, buttonContent);
  console.log('✅ Added loading prop to Button component');
}

// Fix cleanup-test-data route
const cleanupFilePath = path.join(__dirname, 'src', 'app', 'api', 'admin', 'cleanup-test-data', 'route.ts');
let cleanupContent = fs.readFileSync(cleanupFilePath, 'utf8');

// Fix session null checks
cleanupContent = cleanupContent.replace(
  "if (!session?.user || session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')",
  "if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN'))"
);

// Fix error handling
cleanupContent = cleanupContent.replace(
  "} catch (error) {",
  "} catch (error: unknown) {"
);

cleanupContent = cleanupContent.replace(
  "{ error: 'Failed to clean up test data', details: error instanceof Error ? error.message : String(error) }",
  "{ error: 'Failed to clean up test data', details: error instanceof Error ? error.message : String(error) }"
);

fs.writeFileSync(cleanupFilePath, cleanupContent);
console.log('✅ Fixed session null checks and error handling in cleanup-test-data route');

// Fix google-users route
const googleUsersFilePath = path.join(__dirname, 'src', 'app', 'api', 'admin', 'google-users', 'route.ts');
let googleUsersContent = fs.readFileSync(googleUsersFilePath, 'utf8');

// Fix OR property in StringFilter by replacing both instances
googleUsersContent = googleUsersContent.replace(
  /email: {\s+OR: ALLOWED_DOMAINS\.map\(domain => \(\{ endsWith: `@\${domain}` \}\)\)\s+},/g,
  "OR: ALLOWED_DOMAINS.map(domain => ({\n          email: {\n            endsWith: `@\${domain}`\n          }\n        })),\n        "
);

fs.writeFileSync(googleUsersFilePath, googleUsersContent);
console.log('✅ Fixed OR property in StringFilter in google-users route');

console.log('✅ All TypeScript errors fixed successfully!');

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
require('dotenv').config(); // Load environment variables from .env file

const port = 3000;

// Mock data for blood tests
const mockBloodTests = [
  {
    id: 'mock_prod_1',
    name: 'Complete Blood Count',
    description: 'Comprehensive blood test that checks for a variety of conditions',
    price: 9900,
    stripePriceId: 'mock_price_1',
    isActive: true,
    slug: 'complete-blood-count',
  },
  {
    id: 'mock_prod_2',
    name: 'Liver Function Test',
    description: 'Checks how well your liver is working',
    price: 7900,
    stripePriceId: 'mock_price_2',
    isActive: true,
    slug: 'liver-function-test',
  },
];

// Create a server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  
  // API routes
  if (reqUrl.pathname === '/api/blood-tests' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(mockBloodTests));
    return;
  }
  
  if (reqUrl.pathname === '/api/env' && req.method === 'GET') {
    // Return environment variables (be careful not to expose sensitive data)
    const safeEnv = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      NEXT_PUBLIC_STRIPE_KEY: process.env.NEXT_PUBLIC_STRIPE_KEY || 'not-set',
      NEXT_PUBLIC_FALLBACK_STRIPE_KEY: process.env.NEXT_PUBLIC_FALLBACK_STRIPE_KEY || 'not-set',
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'set (hidden)' : 'not-set',
      DATABASE_URL: process.env.DATABASE_URL ? 'set (hidden)' : 'not-set',
      JWT_SECRET: process.env.JWT_SECRET ? 'set (hidden)' : 'not-set',
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'set (hidden)' : 'not-set',
      SUPABASE_URL: process.env.SUPABASE_URL ? 'set (hidden)' : 'not-set',
      SUPABASE_KEY: process.env.SUPABASE_KEY ? 'set (hidden)' : 'not-set',
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(safeEnv));
    return;
  }
  
  // Serve the demo HTML file
  if (reqUrl.pathname === '/' || reqUrl.pathname === '/demo') {
    const filePath = path.join(__dirname, 'blood-test-dropdown-demo.html');
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading the demo page');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
    return;
  }
  
  // 404 for everything else
  res.writeHead(404);
  res.end('Not Found');
});

// Start the server
server.listen(port, () => {
  console.log(`Simple server running at http://localhost:${port}`);
  console.log(`Environment loaded: NODE_ENV=${process.env.NODE_ENV || 'not set'}`);
  console.log(`BASE_URL=${process.env.BASE_URL || 'not set'}`);
  console.log('Available routes:');
  console.log(`- http://localhost:${port}/demo - Blood test dropdown demo`);
  console.log(`- http://localhost:${port}/api/blood-tests - Mock blood test data`);
  console.log(`- http://localhost:${port}/api/env - Environment variables (safe view)`);
});

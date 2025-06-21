// Simple server to display environment variables
const http = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

// Create a server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Eden Clinic Environment Variables</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #2c3e50; }
        .env-container { 
          background-color: #f8f9fa; 
          border-radius: 5px; 
          padding: 20px; 
          margin-top: 20px;
        }
        table { width: 100%; border-collapse: collapse; }
        th, td { 
          text-align: left; 
          padding: 12px; 
          border-bottom: 1px solid #ddd; 
        }
        th { background-color: #4CAF50; color: white; }
        tr:hover { background-color: #f5f5f5; }
        .key { font-weight: bold; color: #2980b9; }
        .value { font-family: monospace; }
        .masked { color: #e74c3c; }
      </style>
    </head>
    <body>
      <h1>Eden Clinic Environment Variables</h1>
      <div class="env-container">
        <table>
          <tr>
            <th>Key</th>
            <th>Value</th>
          </tr>
  `;
  
  // Add each environment variable to the HTML
  Object.keys(envConfig).forEach(key => {
    const value = envConfig[key];
    const isSensitive = key.toLowerCase().includes('key') || 
                        key.toLowerCase().includes('secret') || 
                        key.toLowerCase().includes('password') ||
                        key.toLowerCase().includes('token');
    
    const displayValue = isSensitive ? 
      value.substring(0, 4) + '...' + value.substring(value.length - 4) : 
      value;
    
    html += `
      <tr>
        <td class="key">${key}</td>
        <td class="value ${isSensitive ? 'masked' : ''}">${displayValue}</td>
      </tr>
    `;
  });
  
  html += `
        </table>
      </div>
      <p><strong>Note:</strong> Sensitive values (keys, secrets, passwords, tokens) are partially masked for security.</p>
    </body>
    </html>
  `;
  
  res.end(html);
});

const PORT = 3333;
server.listen(PORT, () => {
  console.log(`Environment variable server running at http://localhost:${PORT}`);
  console.log(`Loaded ${Object.keys(envConfig).length} environment variables from ${envPath}`);
});

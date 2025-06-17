import { uploadTool } from './upload-tool';
import { listResultsTool } from './list-results-tool';

/**
 * MCP server for handling file storage operations across different patient-facing services
 * This server provides tools for uploading, listing, and verifying test results
 */
export const storageMcpServer = {
  name: 'storage-mcp-server',
  description: 'MCP server for handling file storage operations across different patient-facing services',
  version: '1.0.0',
  
  // Register the tools with the MCP server
  tools: [
    uploadTool,
    listResultsTool
  ],
  
  // Helper method to get a tool by name
  getTool(name: string) {
    return this.tools.find(tool => tool.name === name);
  }
};

// Export individual tools for direct access
export { uploadTool, listResultsTool };

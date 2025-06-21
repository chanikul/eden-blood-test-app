import { NextRequest, NextResponse } from 'next/server';
import { getClientSession } from '../../../../lib/auth/client';
import { prisma } from '../../../../lib/prisma';
import { StorageMcpClient } from '../../../../lib/mcp/storage-mcp-client';

// Mark as dynamic to ensure proper execution
export const dynamic = 'force-dynamic';

// Using named export for compatibility with Netlify
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('GET /api/test-results/download - Starting request');
    
    // Get the test result ID from searchParams directly
    const testResultId = request.nextUrl.searchParams.get('id');
    
    if (!testResultId) {
      console.log('GET /api/test-results/download - Missing test result ID');
      return NextResponse.json({ error: 'Missing test result ID' }, { status: 400 });
    }
    
    // First try to get a client session
    const clientSession = await getClientSession();
    
    // If no client session, check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // If neither session exists and not in development, return unauthorized
    if (!clientSession && !isDevelopment) {
      console.log('GET /api/test-results/download - Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the test result
    const testResult = await prisma.testResult.findUnique({
      where: { id: testResultId },
      include: {
        client: {
          select: {
            id: true,
          },
        },
      },
    });
    
    if (!testResult) {
      console.log(`GET /api/test-results/download - Test result not found: ${testResultId}`);
      return NextResponse.json({ error: 'Test result not found' }, { status: 404 });
    }
    
    // Check if the user is authorized to access this test result
    const isAdmin = isDevelopment || !clientSession;
    const isOwner = clientSession && clientSession.id === testResult.clientId;
    
    if (!isAdmin && !isOwner) {
      console.log(`GET /api/test-results/download - Unauthorized access to test result: ${testResultId}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the test result has a URL
    if (!testResult.resultUrl) {
      console.log(`GET /api/test-results/download - Test result has no URL: ${testResultId}`);
      return NextResponse.json({ error: 'Test result has no file' }, { status: 404 });
    }
    
    // Extract the filename from the URL
    const fileName = testResult.resultUrl.split('/').pop() || '';
    
    if (!fileName) {
      console.log(`GET /api/test-results/download - Invalid result URL: ${testResult.resultUrl}`);
      return NextResponse.json({ error: 'Invalid result URL' }, { status: 400 });
    }
    
    try {
      // Use MCP client to verify the file exists
      const verifyResult = await StorageMcpClient.verifyFile(
        testResult.clientId || '',
        fileName,
        'blood-test'
      );
      
      if (!verifyResult.exists) {
        console.log(`GET /api/test-results/download - File does not exist: ${fileName}`);
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      
      // Use MCP client to get a download URL
      const downloadUrl = await StorageMcpClient.getDownloadUrl(
        testResult.clientId || '',
        fileName,
        'blood-test'
      );
      
      if (!downloadUrl) {
        console.log(`GET /api/test-results/download - Failed to generate download URL for: ${fileName}`);
        return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
      }
      
      // Update download count if the field exists in the schema
      try {
        await prisma.$executeRaw`UPDATE "TestResult" SET "downloadCount" = COALESCE("downloadCount", 0) + 1 WHERE id = ${testResultId}::uuid`;
      } catch (countError) {
        // If the field doesn't exist, just log and continue
        console.warn('Could not update download count, field may not exist:', countError);
      }
      
      console.log(`GET /api/test-results/download - Success for test result: ${testResultId}`);
      return NextResponse.json({ downloadUrl });
    } catch (error) {
      console.error('Error generating download URL:', error);
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in test results download API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { prisma } from '../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { createPresignedUrl } from '../../../lib/storage';
import { StorageMcpClient } from '../../../lib/mcp/storage-mcp-client';
import { getClientSession } from '../../../lib/auth/client';
import { TestStatus } from '@prisma/client';
import { sendResultReadyEmail } from '../../../lib/email-templates/result-ready-email';

export const dynamic = 'force-dynamic';

// Using named export for compatibility with Netlify
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // First try to get a client session
    const clientSession = await getClientSession();
    
    // If no client session, check if we're in development mode or try admin session
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // If neither session exists and not in development, return unauthorized
    if (!clientSession && !isDevelopment) {
      console.log('GET /api/test-results - Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get client ID from the appropriate session
    let clientId: string | undefined;
    let isAdmin = false;
    
    if (clientSession) {
      // Client user
      clientId = clientSession.id;
      console.log(`GET /api/test-results - Client user ${clientId} accessing their test results`);
    } else {
      // Either in development mode or admin user
      clientId = undefined;
      isAdmin = true;
      console.log('GET /api/test-results - Admin or development mode access');
    }
    
    // Get test results for the logged-in client
    const results = await prisma.testResult.findMany({
      where: {
        clientId,
      },
      include: {
        bloodTest: {
          select: {
            name: true,
            slug: true,
          },
        },
        order: {
          select: {
            createdAt: true,
            testName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error fetching test results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test results' },
      { status: 500 }
    );
  }
}

// Using named export for compatibility with Netlify
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('POST /api/test-results - Starting request');
    
    // Bypass authentication in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Bypassing authentication for test-results POST API');
    } else {
      // Check for admin session
      try {
        // Get admin session from cookies or headers
        const response = await fetch('/api/auth/admin-check');
        const data = await response.json();
        
        if (!data.isAdmin) {
          console.log('POST /api/test-results - Unauthorized access attempt');
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      } catch (error) {
        console.error('Error checking admin authentication:', error);
        return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
      }
    }
    
    console.log('POST /api/test-results - Parsing request body');
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body));
    
    const { orderId, bloodTestId, clientId, status = TestStatus.processing, resultUrl } = body;
    
    // Validate all required fields
    const missingFields = [];
    if (!orderId) missingFields.push('orderId');
    if (!bloodTestId) missingFields.push('bloodTestId');
    
    if (missingFields.length > 0) {
      console.log(`POST /api/test-results - Missing fields: ${missingFields.join(', ')}`);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    console.log(`POST /api/test-results - Validated request with orderId: ${orderId}, bloodTestId: ${bloodTestId}, clientId: ${clientId || 'not provided'}, resultUrl: ${resultUrl ? 'provided' : 'not provided'}`);
    
    // Create a new test result
    console.log('POST /api/test-results - Creating test result in database');
    
    // Variable to store the created result
    let createdResult;
    
    // Create the test result
    try {
      // If a result URL is provided, verify the file exists using our MCP tool
      if (resultUrl && status === TestStatus.ready) {
        try {
          // Extract filename from URL
          const fileName = resultUrl.split('/').pop() || '';
          
          // Use MCP tool to verify file existence
          const verifyResult = await StorageMcpClient.verifyFile(clientId, fileName, 'blood-test');
          
          if (!verifyResult.exists) {
            console.warn(`File marked as ready but does not exist: ${fileName} for client ${clientId}`);
            // We'll continue with creation, but log the warning
          }
        } catch (err) {
          console.error('Error verifying file existence during test result creation:', err);
          // Continue with creation despite verification error
        }
      }
      
      createdResult = await prisma.testResult.create({
        data: {
          orderId,
          bloodTestId,
          clientId,
          status,
          resultUrl,
        },
        include: {
          bloodTest: true,
          order: true,
          client: true,
        },
      }); 
      console.log('POST /api/test-results - Test result created successfully:', createdResult.id);
    } catch (dbError) {
      console.error('POST /api/test-results - Database error creating test result:', dbError);
      console.error('Error details:', JSON.stringify(dbError, Object.getOwnPropertyNames(dbError)));
      
      // Check for specific Prisma errors
      if (dbError instanceof Error) {
        if (dbError.message.includes('Foreign key constraint failed')) {
          return NextResponse.json(
            { error: 'Invalid reference: One of the provided IDs does not exist in the database' },
            { status: 400 }
          );
        }
      }
      
      throw dbError; // Re-throw to be caught by the outer catch block
    }
    
    // If status is ready, update the order status and send notification email to the client
    if (status === TestStatus.ready && clientId) {
      try {
        // Update the order status to READY
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'READY' }
        });
        
        console.log(`Order ${orderId} status updated to READY`);
        
        // Use the correct Prisma model for users
        const client = await prisma.clientUser.findUnique({
          where: { id: clientId },
          select: { email: true, name: true }
        });
        
        if (client?.email) {
          // Get the test name for the email
          const bloodTest = await prisma.bloodTest.findUnique({
            where: { id: bloodTestId },
            select: { name: true }
          });
          
          await sendResultReadyEmail({
            email: client.email,
            name: client.name || 'Patient',
            testName: bloodTest?.name || 'Your blood test'
          });
          console.log(`Result ready email sent to ${client.email}`);
        }
      } catch (emailError) {
        console.error('Failed to send result ready email or update order:', emailError);
        // Continue execution even if email fails
      }
    }
    
    return NextResponse.json({ result: createdResult }, { status: 201 });
  } catch (error) {
    console.error('Error creating test result:', error);
    
    // Enhanced error logging
    console.error('Error type:', Object.prototype.toString.call(error));
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Provide more specific error messages based on error types
      if (error.message.includes('Foreign key constraint failed')) {
        return NextResponse.json(
          { error: 'Invalid reference: One of the provided IDs does not exist in the database' },
          { status: 400 }
        );
      } else if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          { error: 'A test result with these details already exists' },
          { status: 409 }
        );
      }
    }
    
    // Generic error response
    return NextResponse.json(
      { 
        error: 'Failed to create test result',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
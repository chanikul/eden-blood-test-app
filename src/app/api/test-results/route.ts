import { prisma } from '../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../lib/session';
import { TestStatus } from '@prisma/client';
import { sendResultReadyEmail } from '../../../lib/email-templates/result-ready-email';

export const dynamic = 'force-dynamic';

// Using named export for compatibility with Netlify
export const GET = async (request) => { {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // For patient users, id exists; for admin users we don't need it here
    const clientId = session.user.role === 'PATIENT' ? (session.user as any).id : undefined;
    
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
    const session = await getSession();
    
    if (!session?.user || session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      console.log('POST /api/test-results - Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    let result;
    try {
      result = await prisma.testResult.create({
        data: {
          status,
          orderId,
          bloodTestId,
          clientId,
          resultUrl, // Add the resultUrl field from the uploaded file
        },
      });
      console.log('POST /api/test-results - Test result created successfully:', result.id);
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
    
    // If status is ready, send notification email to the client
    if (status === TestStatus.ready && clientId) {
      try {
        // Use the correct Prisma model for users
        const client = await prisma.clientUser.findUnique({
          where: { id: clientId },
          select: { email: true, name: true }
        });
        
        if (client?.email) {
          await sendResultReadyEmail({
            email: client.email,
            name: client.name || 'Patient',
            testName: 'Your blood test' // Could fetch the actual test name if needed
          });
          console.log(`Result ready email sent to ${client.email}`);
        }
      } catch (emailError) {
        console.error('Failed to send result ready email:', emailError);
        // Continue execution even if email fails
      }
    }
    
    return NextResponse.json({ result }, { status: 201 });
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

}
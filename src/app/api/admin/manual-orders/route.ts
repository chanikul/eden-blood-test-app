export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, getAdminFromToken } from '@/lib/auth';
import { PrismaClient, OrderStatus, TestStatus } from '@prisma/client';
import { logAdminAction, AdminActions, EntityTypes } from '@/lib/services/admin-audit';

// Use the PrismaClient directly to ensure all models are available
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  console.log('Manual orders API endpoint called');
  try {
    // In development mode, bypass authentication
    let adminId = 'development-admin';
    
    // Only verify authentication in production
    if (process.env.NODE_ENV === 'production') {
      // Verify admin authentication
      const cookieStore = cookies();
      const token = cookieStore.get('eden_admin_token')?.value;
      
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const session = await verifySessionToken(token);
      // Fix TypeScript error by checking the role property directly on session
      if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Get admin info for audit logging
      const admin = await getAdminFromToken(token);
      adminId = admin?.id || 'development-admin';
    } else {
      console.log('Development mode: Bypassing authentication for manual-orders API');
    }
    
    // Parse request body
    const { clientId, bloodTestId, testDate, sendEmail } = await request.json();
    console.log('Received manual order request:', { clientId, bloodTestId, testDate, sendEmail });
    
    // Validate required fields
    if (!clientId || !bloodTestId) {
      console.error('Missing required fields:', { clientId, bloodTestId });
      return NextResponse.json(
        { error: 'Client ID and Blood Test ID are required' },
        { status: 400 }
      );
    }
    
    // Check if client exists
    const client = await prisma.clientUser.findUnique({
      where: { id: clientId },
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Check if blood test exists
    const bloodTest = await prisma.bloodTest.findUnique({
      where: { id: bloodTestId },
    });
    
    if (!bloodTest) {
      return NextResponse.json({ error: 'Blood test not found' }, { status: 404 });
    }
    
    // Create a new order with test result
    const order = await prisma.order.create({
      data: {
        // Required fields from the schema
        patientName: client.name,
        patientEmail: client.email,
        patientDateOfBirth: client.dateOfBirth,
        patientMobile: client.mobile,
        testName: bloodTest.name,
        status: 'PAID' as OrderStatus, // Use PAID instead of COMPLETED which doesn't exist in schema
        
        // Connect relations
        client: {
          connect: { id: clientId },
        },
        bloodTest: {
          connect: { id: bloodTestId },
        },
        
        // Create test result
        testResults: {
          create: {
            status: TestStatus.processing, // Use the proper enum value from Prisma
            client: {
              connect: { id: clientId },
            },
            bloodTest: {
              connect: { id: bloodTestId },
            },
            // Store test date in metadata
            metadata: testDate ? { testDate: testDate } : undefined,
          },
        },
      },
      include: {
        testResults: true,
        client: true,
        bloodTest: true,
      },
    });
    
    // Log admin action - only in production or if admin exists in development
    try {
      if (process.env.NODE_ENV === 'production') {
        await logAdminAction(
          adminId,
          'ADD_MANUAL_TEST', // Custom action not in AdminActions enum
          order.id,
          EntityTypes.ORDER,
          {
            clientId,
            clientName: client.name,
            clientEmail: client.email,
            bloodTestId,
            bloodTestName: bloodTest.name,
          }
        );
      } else {
        console.log('Development mode: Skipping admin audit logging');
      }
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
      // Don't throw error, just log it - this shouldn't block the main functionality
    }
    
    // Extract the test result from the order response
    // Type cast the order to access the testResults property
    const testResults = (order as any).testResults || [];
    const testResultId = testResults[0]?.id;
    
    // Return the created order and test result IDs
    const response = {
      success: true,
      orderId: order.id,
      testResultId,
      message: 'Blood test order created successfully',
    };
    
    console.log('Returning successful response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating manual blood test order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { error: 'Failed to create blood test order', details: errorMessage },
      { status: 500 }
    );
  }
}

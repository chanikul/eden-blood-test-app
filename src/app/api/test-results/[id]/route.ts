// Direct import of PrismaClient
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
import { logAdminAction, AdminActions, EntityTypes } from '../../../../lib/services/admin-audit';
import { cookies } from 'next/headers';
import { getAdminFromToken } from '../../../../lib/auth';
import { TestStatus } from '@prisma/client';
import { sendResultReadyEmail } from '../../../../lib/email-templates/result-ready-email';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In development mode, bypass authentication
    let bypassAuth = false;
    if (process.env.NODE_ENV !== 'production') {
      console.log('Development mode: Bypassing authentication for test-results GET API');
      bypassAuth = true;
    }
    
    if (!bypassAuth) {
      const session = await getSession();
      
      if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    const resultId = params.id;
    
    const result = await prisma.testResult.findUnique({
      where: {
        id: resultId,
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
    });
    
    if (!result) {
      return NextResponse.json({ error: 'Test result not found' }, { status: 404 });
    }
    
    // Check if the user is authorized to view this result (skip in development)
    if (!bypassAuth) {
      const session = await getSession();
      const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
      const isOwner = session?.user?.role === 'PATIENT' && result.clientId === (session.user as any).id;
      
      if (!isAdmin && !isOwner) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }
    
    // Return the result directly, not wrapped in an object
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching test result:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test result' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In development mode, bypass authentication
    if (process.env.NODE_ENV !== 'production') {
      console.log('Development mode: Bypassing authentication for test-results PATCH API');
    } else {
      // Only verify authentication in production
      const session = await getSession();
      
      // Only admins can update test results
      if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    const resultId = params.id;
    const { status, resultUrl } = await request.json();
    
    // Validate status
    if (status && !Object.values(TestStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    // Get the current result to check if status is changing to ready
    const currentResult = await prisma.testResult.findUnique({
      where: { id: resultId },
      include: { client: true, bloodTest: true },
    });
    
    if (!currentResult) {
      return NextResponse.json({ error: 'Test result not found' }, { status: 404 });
    }
    
    // Update the test result
    const updatedResult = await prisma.testResult.update({
      where: {
        id: resultId,
      },
      data: {
        ...(status && { status }),
        ...(resultUrl && { resultUrl }),
      },
      include: {
        client: true,
        bloodTest: true,
      },
    });
    
    // Log admin action
    try {
      // Get admin ID from session
      const cookieStore = cookies();
      const token = cookieStore.get('eden_admin_token')?.value;
      let adminId = 'development-admin';
      
      if (token) {
        const admin = await getAdminFromToken(token);
        if (admin) {
          adminId = admin.id;
        }
      }
      
      await logAdminAction(
        adminId,
        status === TestStatus.ready ? AdminActions.UPDATE_TEST_RESULT : AdminActions.UPLOAD_TEST_RESULT,
        resultId,
        EntityTypes.TEST_RESULT,
        {
          previousStatus: currentResult.status,
          newStatus: status || currentResult.status,
          hasResultUrl: !!resultUrl,
          clientId: currentResult.client?.id,
          clientEmail: currentResult.client?.email,
          testName: currentResult.bloodTest?.name
        }
      );
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
      // Continue even if logging fails
    }
    
    // If status is changed to ready, send notification email
    if (status === TestStatus.ready && 
        currentResult.status !== TestStatus.ready && 
        updatedResult.client?.email) {
      try {
        await sendResultReadyEmail({
          email: updatedResult.client.email,
          name: updatedResult.client.name,
          testName: updatedResult.bloodTest.name,
        });
        console.log(`Result ready email sent to ${updatedResult.client.email}`);
      } catch (emailError) {
        console.error('Error sending result ready email:', emailError);
        // Continue despite email error
      }
    }
    
    return NextResponse.json({ result: updatedResult });
  } catch (error) {
    console.error('Error updating test result:', error);
    return NextResponse.json(
      { error: 'Failed to update test result' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In development mode, bypass authentication
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Bypassing authentication for test-results DELETE API');
    } else {
      const session = await getSession();
      
      // Only admins can delete test results
      if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    const resultId = params.id;
    
    // Get the test result before deleting it for audit logging
    const testResult = await prisma.testResult.findUnique({
      where: { id: resultId },
      include: { client: true, bloodTest: true }
    });
    
    if (!testResult) {
      return NextResponse.json({ error: 'Test result not found' }, { status: 404 });
    }
    
    // Delete the test result
    await prisma.testResult.delete({
      where: {
        id: resultId,
      },
    });
    
    // Log admin action
    try {
      // Get admin ID from session
      const cookieStore = cookies();
      const token = cookieStore.get('eden_admin_token')?.value;
      let adminId = 'development-admin';
      
      if (token) {
        const admin = await getAdminFromToken(token);
        if (admin) {
          adminId = admin.id;
        }
      }
      
      await logAdminAction(
        adminId,
        AdminActions.DELETE_TEST_RESULT,
        resultId,
        EntityTypes.TEST_RESULT,
        {
          clientId: testResult.client?.id,
          clientEmail: testResult.client?.email,
          testName: testResult.bloodTest?.name,
          status: testResult.status,
          hadResultUrl: !!testResult.resultUrl
        }
      );
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
      // Continue even if logging fails
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting test result:', error);
    return NextResponse.json(
      { error: 'Failed to delete test result' },
      { status: 500 }
    );
  }
}

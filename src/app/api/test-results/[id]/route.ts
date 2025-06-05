// Direct import of PrismaClient
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../lib/session';
import { TestStatus } from '@prisma/client';
import { sendResultReadyEmail } from '../../../../lib/email-templates/result-ready-email';

export const GET = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    
    // Check if the user is authorized to view this result
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    const isOwner = session.user.role === 'PATIENT' && result.clientId === (session.user as any).id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error fetching test result:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test result' },
      { status: 500 }
    );
  }
}

export const PATCH = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    // Only admins can update test results
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

export const DELETE = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    // Only admins can delete test results
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resultId = params.id;
    
    await prisma.testResult.delete({
      where: {
        id: resultId,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting test result:', error);
    return NextResponse.json(
      { error: 'Failed to delete test result' },
      { status: 500 }
    );
  }
}

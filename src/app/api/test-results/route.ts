import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { TestStatus } from '@prisma/client';
import { sendResultReadyEmail } from '@/lib/email-templates/result-ready-email';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const clientId = session.user.id;
    
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

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { orderId, bloodTestId, clientId, status = TestStatus.processing } = await request.json();
    
    if (!orderId || !bloodTestId) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId and bloodTestId' },
        { status: 400 }
      );
    }
    
    // Create a new test result
    const result = await prisma.testResult.create({
      data: {
        status,
        orderId,
        bloodTestId,
        clientId,
      },
    });
    
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    console.error('Error creating test result:', error);
    return NextResponse.json(
      { error: 'Failed to create test result' },
      { status: 500 }
    );
  }
}

import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { TestStatus } from '@prisma/client';
import { createPresignedUrl } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const resultId = params.id;
    
    // Get the test result
    const result = await prisma.testResult.findUnique({
      where: {
        id: resultId,
      },
      include: {
        client: true,
      },
    });
    
    if (!result) {
      return NextResponse.json({ error: 'Test result not found' }, { status: 404 });
    }
    
    // Check if the user is authorized to download this result
    if (result.clientId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Check if the result is ready and has a URL
    if (result.status !== TestStatus.ready || !result.resultUrl) {
      return NextResponse.json(
        { error: 'Test result is not ready for download' },
        { status: 400 }
      );
    }
    
    // Create a short-lived presigned URL for secure download
    // This prevents direct access to the PDF and ensures authentication
    const downloadUrl = await createPresignedUrl(result.resultUrl, 300); // 5-minute expiry
    
    // Log the download attempt
    await prisma.testResult.update({
      where: {
        id: resultId,
      },
      data: {
        updatedAt: new Date(), // Update the timestamp
      },
    });
    
    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}

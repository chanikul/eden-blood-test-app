import { prisma } from '../../../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/session';
import { TestStatus } from '@prisma/client';
import { createPresignedUrl } from '../../../../../lib/storage';

export const dynamic = 'force-dynamic';

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
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    const isOwner = session.user.role === 'PATIENT' && result.clientId === (session.user as any).id;
    
    if (!isAdmin && !isOwner) {
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
    // The URL will expire in 5 minutes (300 seconds)
    const downloadUrl = await createPresignedUrl(result.resultUrl, 300);
    
    // Log the download attempt for audit purposes
    await prisma.testResult.update({
      where: {
        id: resultId,
      },
      data: {
        updatedAt: new Date(), // Update the timestamp
      },
    });
    
    // Log download information to console for audit purposes
    // In production, this would be stored in the AuditLog table
    console.log('Test result downloaded', {
      resultId,
      userId: session.user.role === 'PATIENT' ? (session.user as any).id : 'admin',
      userRole: session.user.role,
      clientId: result.clientId,
      orderId: result.orderId,
      downloadedAt: new Date().toISOString(),
    });
    
    // In development mode, we'll add a download count to the test result
    // This simulates tracking download metrics without needing the AuditLog model
    if (process.env.NODE_ENV === 'development') {
      try {
        await prisma.testResult.update({
          where: { id: resultId },
          data: {
            // Use a metadata field to store download count
            // In production, this would be tracked in the AuditLog table
            metadata: {
              downloadCount: ((result.metadata as any)?.downloadCount || 0) + 1,
              lastDownloaded: new Date().toISOString()
            }
          }
        });
      } catch (updateError) {
        // Don't fail the request if the update fails
        console.error('Error updating download metrics:', updateError);
      }
    }
    
    return NextResponse.json({ downloadUrl });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}

import { prisma } from '../../../../../lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/session';
import { getClientSession } from '../../../../../lib/auth/client';
import { TestStatus } from '@prisma/client';
import { createPresignedUrl } from '../../../../../lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if we're in development mode and bypass authentication if so
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isDevelopmentRequest = request.headers.get('X-Development-Mode') === 'true';
    
    // Log development mode status
    console.log('GET /api/test-results/[id]/download - Development mode:', { 
      isDevelopment, 
      isDevelopmentRequest,
      headers: Object.fromEntries(request.headers.entries())
    });
    
    // Initialize session variables
    let clientSession = null;
    let adminSession = null;
    let isAuthorized = false;
    
    // Skip authentication in development mode
    if (isDevelopment) {
      console.log('Development mode: Bypassing authentication check');
      isAuthorized = true;
    } else {
      // First try to get a client session
      clientSession = await getClientSession();
      
      // If no client session, try admin session
      adminSession = clientSession ? null : await getSession();
      
      // If neither session exists, return unauthorized
      if (!clientSession && (!adminSession || !adminSession.user)) {
        console.log('GET /api/test-results/[id]/download - Unauthorized access attempt');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
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
    
    // Check if the user is authorized to download this result if not in development mode
    if (!isAuthorized) { // Only check if not already authorized via development mode
      if (clientSession) {
        // Client user can only access their own results
        isAuthorized = result.clientId === clientSession.id;
      } else if (adminSession) {
        // Admin users can access any result
        isAuthorized = adminSession.user?.role === 'ADMIN' || adminSession.user?.role === 'SUPER_ADMIN';
      }
    }
    
    if (!isAuthorized) {
      console.log('GET /api/test-results/[id]/download - Unauthorized access attempt for result:', resultId);
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
    const downloadUrl = await createPresignedUrl(result.resultUrl, '300');
    
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
      userId: clientSession ? clientSession.id : 'admin',
      userRole: clientSession ? 'CLIENT' : (adminSession?.user?.role || 'UNKNOWN'),
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

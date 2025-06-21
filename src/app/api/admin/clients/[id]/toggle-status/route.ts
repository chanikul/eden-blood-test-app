export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, getAdminFromToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAdminAction, AdminActions, EntityTypes } from '@/lib/services/admin-audit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get client ID from params
    const clientId = params.id;
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Get admin token
    const cookieStore = cookies();
    const token = cookieStore.get('eden_admin_token')?.value;
    
    // Skip authentication check in development mode
    if (process.env.NODE_ENV !== 'development') {
      if (!token || !verifySessionToken(token)) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Find the client
    const client = await prisma.clientUser.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        email: true,
        name: true,
        active: true
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Toggle the active status
    const updatedClient = await prisma.clientUser.update({
      where: { id: clientId },
      data: { active: !client.active },
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        dateOfBirth: true,
        mobile: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    // Get admin ID for audit logging
    let adminId = 'development-admin';
    
    // In production, get the real admin ID from the token
    if (process.env.NODE_ENV !== 'development') {
      if (token) {
        const admin = await getAdminFromToken(token);
        if (admin) {
          adminId = admin.id;
        }
      }
    }

    // Log admin action
    try {
      await logAdminAction(
        adminId,
        AdminActions.TOGGLE_CLIENT_STATUS,
        client.id,
        EntityTypes.CLIENT,
        {
          clientEmail: client.email,
          clientName: client.name,
          previousStatus: client.active,
          newStatus: updatedClient.active
        }
      );
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
      // Continue even if logging fails
    }

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Error toggling client status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle client status' },
      { status: 500 }
    );
  }
}

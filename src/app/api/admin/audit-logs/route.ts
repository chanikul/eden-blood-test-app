export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

// Use the PrismaClient directly to ensure all models are available
const prisma = new PrismaClient();
import { z } from 'zod';

// Get audit logs with pagination
export async function GET(request: NextRequest) {
  try {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const entityType = searchParams.get('entityType') || undefined;
    const action = searchParams.get('action') || undefined;
    const adminId = searchParams.get('adminId') || undefined;
    const entityId = searchParams.get('entityId') || undefined;

    // Build filter conditions
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (adminId) where.adminId = adminId;
    if (entityId) where.entityId = entityId;

    // Get total count for pagination
    const totalCount = await prisma.adminAuditLog.count({ where });

    // Get audit logs with pagination and related admin info
    const auditLogs = await prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        admin: {
          select: {
            email: true,
            name: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json({
      data: auditLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

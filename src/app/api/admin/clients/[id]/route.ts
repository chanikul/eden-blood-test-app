import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

// Use the PrismaClient directly to ensure all models are available
const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In development mode, bypass authentication check completely
    if (process.env.NODE_ENV !== 'development') {
      // Only verify authentication in production
      const cookieStore = cookies();
      const token = cookieStore.get('eden_admin_token')?.value;
      
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const admin = await verifySessionToken(token);
      if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    // Log that we're bypassing auth in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Bypassing API authentication check for client ID:', params.id);
    }
    
    const clientId = params.id;
    
    // Fetch client with their orders and test results
    const client = await prisma.clientUser.findUnique({
      where: {
        id: clientId,
      },
      include: {
        orders: {
          include: {
            bloodTest: true,
            testResults: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client details' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '../../../../../lib/auth';
import { updateAdmin, getAdminById } from '../../../../../lib/services/admin';
import { z } from 'zod';

const updateAdminSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
  active: z.boolean().optional(),
});

// Get admin by ID
export const GET = async (request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('eden_admin_token')?.value;
    if (!token || !verifySessionToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const admin = await getAdminById(params.id);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error('Error getting admin:', error);
    return NextResponse.json(
      { error: 'Failed to get admin' },
      { status: 500 }
    );
  }
}

// Update admin
export const PATCH = async (request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('eden_admin_token')?.value;
    if (!token || !verifySessionToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateAdminSchema.parse(body);

    const admin = await updateAdmin(params.id, validatedData);
    return NextResponse.json(admin);
  } catch (error) {
    console.error('Error updating admin:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update admin' },
      { status: 500 }
    );
  }
}

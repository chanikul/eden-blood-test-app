import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '../../../../lib/auth';
import { createAdmin, listAdmins, updateAdmin } from '../../../../lib/services/admin';
import { z } from 'zod';

const createAdminSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
});

const updateAdminSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
  active: z.boolean().optional(),
});

// List all admins
// Using named export for compatibility with Netlify
export const GET = async () => {
  try {
    // Skip authentication check in development mode
    if (process.env.NODE_ENV !== 'development') {
      const cookieStore = cookies();
      const token = cookieStore.get('eden_admin_token')?.value;
      if (!token || !verifySessionToken(token)) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const admins = await listAdmins();
    return NextResponse.json(admins);
  } catch (error) {
    console.error('Error listing admins:', error);
    return NextResponse.json(
      { error: 'Failed to list admins' },
      { status: 500 }
    );
  }
}

// Create new admin
export const POST = async (request: NextRequest) {
  try {
    // Skip authentication check in development mode
    if (process.env.NODE_ENV !== 'development') {
      const cookieStore = cookies();
      const token = cookieStore.get('eden_admin_token')?.value;
      if (!token || !verifySessionToken(token)) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const validatedData = createAdminSchema.parse(body);

    const admin = await createAdmin(validatedData);
    return NextResponse.json(admin, { status: 201 });
  } catch (error) {
    console.error('Error creating admin:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}

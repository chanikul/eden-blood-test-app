import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/services/email';
import { generatePassword } from '@/lib/utils';
import { logAdminAction, AdminActions, EntityTypes } from '@/lib/services/admin-audit';
import { getAdminFromToken } from '@/lib/auth';

const createClientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  dateOfBirth: z.string().refine(val => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid date of birth'),
  mobile: z.string().optional(),
});

// List all clients
export async function GET(request: NextRequest) {
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

    const clients = await prisma.clientUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        dateOfBirth: true,
        mobile: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
      }
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error listing clients:', error);
    return NextResponse.json(
      { error: 'Failed to list clients' },
      { status: 500 }
    );
  }
}

// Create new client
export async function POST(request: NextRequest) {
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
    const validatedData = createClientSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.clientUser.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Generate a secure random password
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the client user
    const client = await prisma.clientUser.create({
      data: {
        email: validatedData.email,
        passwordHash,
        name: validatedData.name,
        dateOfBirth: validatedData.dateOfBirth,
        mobile: validatedData.mobile,
        active: true,
        lastLoginAt: null,
        must_reset_password: true, // Force password reset on first login
      },
    });

    // Send welcome email with login credentials
    try {
      // Check if SENDGRID_API_KEY is available
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('SENDGRID_API_KEY not set - skipping welcome email');
      } else {
        const emailResult = await sendWelcomeEmail({
          email: validatedData.email,
          name: validatedData.name,
          password,
          orderId: '', // No order associated with manually created clients
          testName: '' // No test associated with manually created clients
        });
        
        if (emailResult) {
          console.log('Welcome email sent successfully');
        } else {
          console.warn('Email service not initialized - welcome email not sent');
        }
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue even if email fails
    }

    // Get admin from token
    let adminId = 'development-admin';
    
    // In production, get the real admin ID from the token
    if (process.env.NODE_ENV !== 'development') {
      const cookieStore = cookies();
      const token = cookieStore.get('eden_admin_token')?.value;
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
        AdminActions.CREATE_CLIENT,
        client.id,
        EntityTypes.CLIENT,
        {
          clientEmail: client.email,
          clientName: client.name,
          manuallyCreated: true
        }
      );
    } catch (logError) {
      console.error('Failed to log admin action:', logError);
      // Continue even if logging fails
    }

    return NextResponse.json({
      id: client.id,
      email: client.email,
      name: client.name,
      dateOfBirth: client.dateOfBirth,
      mobile: client.mobile,
      active: client.active,
      createdAt: client.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

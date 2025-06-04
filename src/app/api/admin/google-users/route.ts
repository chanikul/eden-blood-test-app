import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { AdminRole } from '@prisma/client';

// Domain restrictions for Eden Clinic staff
const ALLOWED_DOMAINS = ['edenclinicformen.com', 'edenclinic.co.uk'];

/**
 * API route for managing Google-authenticated admin users
 * This route allows SUPER_ADMIN users to:
 * - List all Google-authenticated admin users
 * - Update user roles and active status
 * - Delete users
 */

// GET: List all Google-authenticated admin users
export async function GET(request: NextRequest) {
  try {
    // Bypass auth check in development
    if (process.env.NODE_ENV === 'development') {
      const googleUsers = await prisma.admin.findMany({
        where: {
          OR: ALLOWED_DOMAINS.map(domain => ({
            email: {
              endsWith: `@${domain}`
            }
          })),
          passwordHash: {
            equals: '' // Google users have empty password hash
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          active: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      return NextResponse.json({ users: googleUsers });
    }

    // Verify session
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only SUPER_ADMIN can manage other admin users
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Get all Google-authenticated admin users
    const googleUsers = await prisma.admin.findMany({
      where: {
        OR: ALLOWED_DOMAINS.map(domain => ({
          email: {
            endsWith: `@${domain}`
          }
        })),
        passwordHash: {
          equals: '' // Google users have empty password hash
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json({ users: googleUsers });
  } catch (error) {
    console.error('Error fetching Google admin users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Google admin users' },
      { status: 500 }
    );
  }
}

// POST: Update a Google-authenticated admin user's role or active status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, role, active, name } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Bypass auth check in development
    if (process.env.NODE_ENV === 'development') {
      const updatedUser = await prisma.admin.update({
        where: { id: userId },
        data: {
          ...(role && { role: role as AdminRole }),
          ...(active !== undefined && { active }),
          ...(name && { name })
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          active: true
        }
      });
      
      return NextResponse.json({ user: updatedUser });
    }

    // Verify session
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only SUPER_ADMIN can update admin users
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Find the user to update
    const existingUser = await prisma.admin.findUnique({
      where: { id: userId },
      select: { email: true, passwordHash: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Ensure the user is a Google-authenticated user (empty password hash)
    if (existingUser.passwordHash !== '') {
      return NextResponse.json(
        { error: 'This endpoint is only for Google-authenticated users' },
        { status: 400 }
      );
    }

    // Ensure the user has an allowed email domain
    if (!ALLOWED_DOMAINS.some(domain => existingUser.email.endsWith(`@${domain}`))) {
      return NextResponse.json(
        { error: `Only users with @${ALLOWED_DOMAINS.join(' or @')} emails can be managed here` },
        { status: 400 }
      );
    }

    // Update the user
    const updatedUser = await prisma.admin.update({
      where: { id: userId },
      data: {
        ...(role && { role: role as AdminRole }),
        ...(active !== undefined && { active }),
        ...(name && { name })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true
      }
    });
    
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating Google admin user:', error);
    return NextResponse.json(
      { error: 'Failed to update Google admin user' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a Google-authenticated admin user
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Bypass auth check in development
    if (process.env.NODE_ENV === 'development') {
      await prisma.admin.delete({
        where: { id: userId }
      });
      
      return NextResponse.json({ success: true });
    }

    // Verify session
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only SUPER_ADMIN can delete admin users
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    // Find the user to delete
    const existingUser = await prisma.admin.findUnique({
      where: { id: userId },
      select: { email: true, passwordHash: true }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Ensure the user is a Google-authenticated user (empty password hash)
    if (existingUser.passwordHash !== '') {
      return NextResponse.json(
        { error: 'This endpoint is only for Google-authenticated users' },
        { status: 400 }
      );
    }

    // Ensure the user has an allowed email domain
    if (!ALLOWED_DOMAINS.some(domain => existingUser.email.endsWith(`@${domain}`))) {
      return NextResponse.json(
        { error: `Only users with @${ALLOWED_DOMAINS.join(' or @')} emails can be managed here` },
        { status: 400 }
      );
    }

    // Delete the user
    await prisma.admin.delete({
      where: { id: userId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Google admin user:', error);
    return NextResponse.json(
      { error: 'Failed to delete Google admin user' },
      { status: 500 }
    );
  }
}

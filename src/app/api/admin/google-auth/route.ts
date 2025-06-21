import { NextRequest, NextResponse } from 'next/server';
import { AdminRole } from '@prisma/client';

// Direct import of PrismaClient
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Domain restrictions for Eden Clinic staff
const ALLOWED_DOMAINS = ['edenclinicformen.com', 'edenclinic.co.uk'];

/**
 * API route for Google authentication of admin users
 * This route handles the Google OAuth callback and creates/updates admin users
 */

// POST: Authenticate a Google user and create/update admin record
export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { accessToken } = body;
    
    if (!accessToken) {
      console.error('No access token provided');
      return NextResponse.json(
        { message: 'Access token is required' },
        { status: 400 }
      );
    }
    
    console.log('Received Google authentication request with token');
    
    // In development mode, allow any Google account for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Bypassing domain restrictions and token validation');
      
      // Create or update a mock admin user for development
      const mockEmail = 'admin@edenclinic.co.uk';
      const mockName = 'Development Admin';
      
      // Check if user exists
      let adminUser = await prisma.admin.findUnique({
        where: { email: mockEmail }
      });
      
      if (!adminUser) {
        // Create new admin user
        adminUser = await prisma.admin.create({
          data: {
            email: mockEmail,
            name: mockName,
            role: AdminRole.SUPER_ADMIN,
            active: true,
            passwordHash: '', // Google users have empty password hash
          }
        });
        console.log('Created development admin user:', adminUser);
      } else {
        // Update existing user
        adminUser = await prisma.admin.update({
          where: { email: mockEmail },
          data: {
            name: mockName,
            active: true,
          }
        });
        console.log('Updated development admin user:', adminUser);
      }
      
      return NextResponse.json({
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          active: adminUser.active
        }
      });
    }
    
    // In production, we would:
    // 1. Verify the Google access token
    // 2. Extract user information from the token
    // 3. Check if the email domain is allowed
    // 4. Create or update the admin user in the database
    
    // For now, we'll simulate this process with a mock implementation
    // In a real implementation, you would use the Google API to verify the token
    
    // Mock verification - in production, replace with actual Google token verification
    const mockUserInfo = {
      email: 'admin@edenclinic.co.uk',
      name: 'Admin User',
      picture: 'https://example.com/profile.jpg'
    };
    
    // Check if the email domain is allowed
    const emailDomain = mockUserInfo.email.split('@')[1];
    if (!ALLOWED_DOMAINS.includes(emailDomain)) {
      console.error('Unauthorized email domain:', emailDomain);
      return NextResponse.json(
        { message: `Only ${ALLOWED_DOMAINS.join(' or ')} email addresses are allowed` },
        { status: 403 }
      );
    }
    
    // Find or create the admin user
    let adminUser = await prisma.admin.findUnique({
      where: { email: mockUserInfo.email }
    });
    
    if (!adminUser) {
      // Create new admin user
      adminUser = await prisma.admin.create({
        data: {
          email: mockUserInfo.email,
          name: mockUserInfo.name,
          role: AdminRole.ADMIN, // Default role for new users
          active: true,
          passwordHash: '', // Google users have empty password hash
        }
      });
      console.log('Created new admin user:', adminUser);
    } else {
      // Update existing user
      adminUser = await prisma.admin.update({
        where: { email: mockUserInfo.email },
        data: {
          name: mockUserInfo.name,
          lastLogin: new Date(),
        }
      });
      console.log('Updated existing admin user:', adminUser);
    }
    
    return NextResponse.json({
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        active: adminUser.active
      }
    });
  } catch (error: any) {
    console.error('Error in Google authentication:', error);
    return NextResponse.json(
      { message: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
};

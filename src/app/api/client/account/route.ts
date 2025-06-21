import { NextRequest, NextResponse } from 'next/server';
// Direct import of PrismaClient
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
import { getClientSession } from '../../../../lib/auth/client';
import bcrypt from 'bcryptjs';
import { getSupabaseClient } from '../../../../lib/supabase-client';
import { jwtVerify } from 'jose';

// Get the Supabase client singleton
const supabase = getSupabaseClient();

// Using named export for compatibility with Netlify
export const GET = async (req: NextRequest) => {
  try {
    console.log('Client account API: Checking session...');
    
    // Get the patient token directly from cookies
    const patientToken = req.cookies.get('eden_patient_token')?.value;
    console.log('Patient token present in API:', !!patientToken);
    
    let userId;
    
    // Development mode bypass for easier testing
    if (process.env.NODE_ENV === 'development' && !patientToken) {
      console.log('Client account API: Development mode, bypassing authentication');
      // Use a sample client ID for development
      const sampleClient = await prisma.clientUser.findFirst({
        where: { isSample: true },
        select: { id: true }
      });
      
      if (sampleClient) {
        userId = sampleClient.id;
        console.log('Client account API: Using sample client ID:', userId);
      } else {
        console.log('Client account API: No sample client found, using first client');
        const firstClient = await prisma.clientUser.findFirst({
          select: { id: true }
        });
        
        if (!firstClient) {
          console.log('Client account API: No clients found in database');
          return NextResponse.json({ error: 'No clients found in database' }, { status: 404 });
        }
        
        userId = firstClient.id;
        console.log('Client account API: Using first client ID:', userId);
      }
    } else if (patientToken) {
      // Verify the token directly
      try {
        const { payload } = await jwtVerify(
          patientToken,
          new TextEncoder().encode(process.env.JWT_SECRET || '')
        );
        
        console.log('API token verification result:', { 
          success: !!payload,
          role: payload?.role,
          email: payload?.email,
          id: payload?.id
        });
        
        if (
          typeof payload !== 'object' ||
          !payload ||
          !('role' in payload) ||
          String(payload.role) !== 'PATIENT' ||
          !('id' in payload)
        ) {
          console.log('Client account API: Invalid token payload');
          return NextResponse.json({ error: 'Unauthorized', details: 'Invalid token' }, { status: 401 });
        }
        
        userId = String(payload.id);
        console.log('Client account API: Valid token for user:', userId);
      } catch (error) {
        console.error('Client token verification failed:', error);
        return NextResponse.json({ error: 'Unauthorized', details: 'Token verification failed' }, { status: 401 });
      }
    } else {
      console.log('Client account API: No token found, returning 401');
      return NextResponse.json({ error: 'Unauthorized', details: 'No token found' }, { status: 401 });
    }

    // Get client details with comprehensive information
    const client = await prisma.clientUser.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        email: true,
        dateOfBirth: true,
        mobile: true,
        createdAt: true,
        // Include addresses
        addresses: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        // Include orders with blood test details and test results
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
          select: {
            id: true,
            testName: true,
            status: true,
            createdAt: true,
            bloodTest: {
              select: {
                name: true,
                description: true,
              },
            },
            testResults: {
              select: {
                id: true,
                status: true,
                resultUrl: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Split name into first and last name
    const [firstName, ...lastNameParts] = client.name.split(' ');
    const lastName = lastNameParts.join(' ');
    
    // Get default shipping address if available
    const defaultShippingAddress = client.addresses.find(
      (address: any) => address.type === 'SHIPPING' && address.isDefault
    ) || client.addresses.find((address: any) => address.type === 'SHIPPING');

    return NextResponse.json({
      ...client,
      firstName,
      lastName,
      defaultAddress: defaultShippingAddress || null,
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Using named export for compatibility with Netlify
export const PUT = async (req: NextRequest) => {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { firstName, lastName, email, mobile, dateOfBirth } = data;

    // Combine first and last name
    const name = `${firstName} ${lastName}`.trim();

    // Update email in Supabase if it changed
    const currentClient = await prisma.clientUser.findUnique({
      where: { id: session.id },
      select: { email: true },
    });

    if (currentClient && email !== currentClient.email) {
      const { error: supabaseError } = await supabase.auth.admin.updateUserById(
        session.id,
        { email }
      );

      if (supabaseError) {
        return NextResponse.json(
          { error: 'Failed to update email' },
          { status: 400 }
        );
      }
    }

    // Update client details in database
    const updatedClient = await prisma.clientUser.update({
      where: {
        id: session.id,
      },
      data: {
        name,
        email,
        mobile,
        dateOfBirth,
      },
      select: {
        name: true,
        email: true,
        dateOfBirth: true,
        mobile: true,
      },
    });

    // Split name into first and last name for response
    const [updatedFirstName, ...updatedLastNameParts] = updatedClient.name.split(' ');
    const updatedLastName = updatedLastNameParts.join(' ');

    return NextResponse.json({
      ...updatedClient,
      firstName: updatedFirstName,
      lastName: updatedLastName,
    });
  } catch (error) {
    console.error('Error updating client details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const PATCH = async (req: NextRequest) => {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { currentPassword, newPassword } = data;

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session.email,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      session.id,
      { password: newPassword }
    );

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 400 }
      );
    }

    // Update password hash in database
    await prisma.clientUser.update({
      where: {
        id: session.id,
      },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 10), // Use bcrypt for password hashing
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

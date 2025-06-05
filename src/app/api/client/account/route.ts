import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getClientSession } from '../../../../lib/auth/client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.clientUser.findUnique({
      where: {
        id: session.id,
      },
      select: {
        name: true,
        email: true,
        dateOfBirth: true,
        mobile: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Split name into first and last name
    const [firstName, ...lastNameParts] = client.name.split(' ');
    const lastName = lastNameParts.join(' ');

    return NextResponse.json({
      ...client,
      firstName,
      lastName,
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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

export async function PATCH(req: NextRequest) {
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
        passwordHash: await supabase.auth.admin.generateHash(newPassword),
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

import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyPassword, hashPassword } from '../../../../lib/utils/password';
import { getPatientFromToken } from '../../../../lib/auth';

export async function POST(request: Request) {
  console.log('=== CHANGE PASSWORD DEBUG ===');
  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Get patient from session token
    console.log('Attempting to get patient from token...');
    const patient = await getPatientFromToken();
    console.log('Patient from token:', { found: !!patient, id: patient?.id });
    if (!patient) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current password hash
    console.log('Looking up patient in database:', { id: patient.id });
    const dbPatient = await prisma.clientUser.findUnique({
      where: { id: patient.id },
      select: {
        passwordHash: true,
        resetToken: true,
        resetTokenExpires: true
      }
    });

    if (!dbPatient) {
      return NextResponse.json(
        { message: 'Patient not found' },
        { status: 404 }
      );
    }

    // Verify current password
    console.log('Verifying current password...');
    const isValid = await verifyPassword(currentPassword, dbPatient.passwordHash);
    console.log('Password verification result:', { isValid });
    if (!isValid) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password and clear reset token
    console.log('Updating password in database...');
    await prisma.clientUser.update({
      where: { id: patient.id },
      data: {
        passwordHash: newPasswordHash,
        resetToken: null,
        resetTokenExpires: null
      }
    });

    console.log('Password updated successfully');
    return NextResponse.json({ 
      success: true,
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { message: 'An error occurred while changing password' },
      { status: 500 }
    );
  }
}

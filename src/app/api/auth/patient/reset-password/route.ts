import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { hashPassword } from '../../../../../lib/utils/password';

export const dynamic = 'force-dynamic';

// Using named export for compatibility with Netlify
export const POST = async (request: NextRequest) => {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { message: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Find patient with valid reset token
    const patient = await prisma.clientUser.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: {
          gt: new Date() // Token must not be expired
        }
      }
    });

    if (!patient) {
      return NextResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update patient's password and clear reset token
    await prisma.clientUser.update({
      where: { id: patient.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpires: null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: 'An error occurred while resetting password' },
      { status: 500 }
    );
  }
}
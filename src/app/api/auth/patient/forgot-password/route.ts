import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { generateSecurePassword } from '../../../../../lib/utils/password';
import { sendPasswordResetEmail } from '../../../../../lib/services/email';
import { generateSessionToken } from '../../../../../lib/auth';
import { randomBytes } from 'crypto';

// Using named export for compatibility with Netlify
export const POST = async (request) => { {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the patient
    const patient = await prisma.clientUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        active: true
      }
    });

    // For security reasons, don't reveal if the user exists or not
    if (!patient || !patient.active) {
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions shortly.'
      });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // Token expires in 1 hour

    // Update patient with reset token
    await prisma.clientUser.update({
      where: { id: patient.id },
      data: {
        resetToken,
        resetTokenExpires
      }
    });

    // Send password reset email
    await sendPasswordResetEmail({
      to: patient.email,
      name: patient.name,
      resetToken
    });

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions shortly.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}

}
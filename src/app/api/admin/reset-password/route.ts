import { NextRequest, NextResponse } from 'next/server';
import { generatePasswordResetToken, resetPassword } from '../../../../lib/services/admin';
import { sendPasswordResetEmail } from '../../../../lib/services/email';
import { z } from 'zod';

const requestResetSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

// Request password reset
// Using named export for compatibility with Netlify
export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { email } = requestResetSchema.parse(body);

    const resetToken = await generatePasswordResetToken(email);
    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Send password reset email
    await sendPasswordResetEmail({
      to: email,
      name: 'Admin', // Default name for admin
      resetToken: resetToken
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset instructions sent to your email',
    });
  } catch (error) {
    console.error('Error requesting password reset:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}

// Reset password with token
// Using named export for compatibility with Netlify
export const PUT = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const success = await resetPassword(token, password);
    if (!success) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password successfully reset',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
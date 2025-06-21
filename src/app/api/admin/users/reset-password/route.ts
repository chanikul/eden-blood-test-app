export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '../../../../../lib/auth';
import { generatePasswordResetToken } from '../../../../../lib/services/admin';
import { sendEmail } from '../../../../../lib/services/email';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

export const POST = async (request) => { {
  try {
    // Verify admin authentication
    const cookieStore = cookies();
    const token = cookieStore.get('eden_admin_token')?.value;
    if (!token || !verifySessionToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate request data
    const body = await request.json();
    const { email } = resetPasswordSchema.parse(body);

    // Generate reset token
    const resetToken = await generatePasswordResetToken(email);
    if (!resetToken) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    // Send reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/reset-password?token=${resetToken}`;
    await sendEmail({
      to: email,
      subject: 'Eden Clinic Admin Password Reset',
      text: `Click the following link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.`,
      html: `
        <p>Click the following link to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error initiating password reset:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to initiate password reset' },
      { status: 500 }
    );
  }
}

}
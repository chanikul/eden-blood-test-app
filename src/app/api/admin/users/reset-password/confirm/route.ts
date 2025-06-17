import { NextResponse } from 'next/server';
import { resetPassword } from '@/lib/services/admin';
import { z } from 'zod';

const confirmResetSchema = z.object({
  token: z.string().uuid(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = confirmResetSchema.parse(body);

    const success = await resetPassword(token, password);
    if (!success) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error confirming password reset:', error);
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

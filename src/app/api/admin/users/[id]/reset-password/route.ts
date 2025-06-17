import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateRandomPassword } from '@/lib/utils';
import { sendEmail } from '@/lib/services/email';
import bcrypt from 'bcryptjs';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const admin = await prisma.admin.findUnique({ where: { id } });

    if (!admin) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate a secure random password
    const newPassword = generateRandomPassword();

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update admin's password in the database
    await prisma.admin.update({
      where: { id },
      data: { passwordHash }
    });

    // Send password reset email
    await sendEmail({
      to: admin.email,
      subject: 'Your Password Has Been Reset',
      text: `Your password has been reset by an administrator. Your new password is: ${newPassword}`,
      html: `
        <div>
          <h2>Password Reset</h2>
          <p>Your password has been reset by an administrator.</p>
          <p>Your new password is: <strong>${newPassword}</strong></p>
          <p>Please log in with this password and change it immediately for security.</p>
        </div>
      `
    });

    // Log the password reset (for debugging)
    console.log(`Password reset for admin ${admin.id} by ${session.user.email}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

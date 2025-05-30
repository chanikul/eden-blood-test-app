import { prisma } from '../src/lib/prisma';
import * as bcrypt from 'bcryptjs';

async function verifyAdmin() {
  try {
    const admin = await prisma.admin.findUnique({
      where: { email: 'admin@edenclinic.co.uk' },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        role: true,
        active: true,
      },
    });

    if (!admin) {
      console.log('Admin user not found');
      return;
    }

    console.log('Admin user found:', {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      active: admin.active,
    });

    // Test password
    const testPassword = 'Admin123!';
    const isValid = await bcrypt.compare(testPassword, admin.passwordHash);
    console.log('Password check:', { isValid });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdmin();

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://postgres.dlzfhnnwyvddaokirung:DNE8ytm_uyw1jbc*qbr@aws-0-eu-west-2.pooler.supabase.com:5432/postgres"
    }
  }
});

async function verifyAdmin() {
  try {
    // First check if admin exists
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
      console.log('Admin user not found. Creating admin user...');
      
      // Create admin if not exists
      const passwordHash = await bcrypt.hash('Admin123!', 10);
      const newAdmin = await prisma.admin.create({
        data: {
          email: 'admin@edenclinic.co.uk',
          name: 'Admin User',
          passwordHash,
          role: 'SUPER_ADMIN',
          active: true,
        },
      });
      
      console.log('Created new admin user:', {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
        active: newAdmin.active,
      });
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

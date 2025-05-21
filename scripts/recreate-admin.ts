import { PrismaClient, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// For schema changes and migrations, we need to use DIRECT_URL
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: "postgresql://postgres.dlzfhnnwyvddaoikrung:DNE8ytm_uyw1jbc*qbr@aws-0-eu-west-2.pooler.supabase.com:5432/postgres"
    }
  }
});

async function recreateAdmin() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();

    // Delete existing admin if exists
    console.log('Deleting existing admin...');
    await prisma.admin.deleteMany({
      where: { email: 'admin@edenclinic.co.uk' }
    });

    // Generate password hash
    console.log('Generating password hash...');
    const password = 'Admin123!';
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new admin
    console.log('Creating new admin...');
    const admin = await prisma.admin.create({
      data: {
        email: 'admin@edenclinic.co.uk',
        name: 'Admin User',
        passwordHash,
        role: AdminRole.SUPER_ADMIN,
        active: true
      }
    });

    console.log('Admin created successfully:', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      active: admin.active
    });

    // Verify password works
    console.log('\nVerifying password...');
    const foundAdmin = await prisma.admin.findUnique({
      where: { email: 'admin@edenclinic.co.uk' },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        active: true
      }
    });

    if (foundAdmin) {
      const isValid = await bcrypt.compare(password, foundAdmin.passwordHash);
      console.log('Password verification:', {
        found: true,
        passwordValid: isValid,
        role: foundAdmin.role,
        active: foundAdmin.active
      });
    } else {
      console.log('Admin not found after creation!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recreateAdmin();

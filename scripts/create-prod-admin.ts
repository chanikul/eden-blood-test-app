import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Use the direct connection URL to avoid connection pooling issues
// Use the direct connection URL for schema changes
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: "postgresql://postgres.dlzfhnnwyvddaokirung:DNE8ytm_uyw1jbc*qbr@aws-0-eu-west-2.pooler.supabase.com:5432/postgres?connection_limit=1"
    }
  }
});

async function createAdmin() {
  try {
    // First delete any existing admin user
    await prisma.admin.deleteMany({
      where: {
        email: 'admin@edenclinic.co.uk'
      }
    });

    // Create new admin user
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    const admin = await prisma.admin.create({
      data: {
        email: 'admin@edenclinic.co.uk',
        name: 'Admin User',
        passwordHash,
        role: 'SUPER_ADMIN',
        active: true,
      },
    });

    console.log('Created admin user:', {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      active: admin.active
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.dlzfhnnwyvddaoikrung:DNE8ytm_uyw1jbc*qbr@aws-0-eu-west-2.pooler.supabase.com:5432/postgres"
    }
  }
});

async function recreateAdmin() {
  try {
    console.log('Connecting to database...');
    
    // First delete existing admin
    console.log('Deleting existing admin...');
    await prisma.$executeRaw`DELETE FROM "Admin" WHERE email = 'admin@edenclinic.co.uk'`;
    
    // Create new admin
    console.log('Creating new admin...');
    await prisma.$executeRaw`
      INSERT INTO "Admin" (
        id,
        email,
        name,
        "passwordHash",
        role,
        active,
        "createdAt",
        "updatedAt"
      ) VALUES (
        'cln1234567890',
        'admin@edenclinic.co.uk',
        'Admin User',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'SUPER_ADMIN',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `;
    
    console.log('Admin user created successfully');
    
    // Verify the admin exists
    const admin = await prisma.admin.findUnique({
      where: { email: 'admin@edenclinic.co.uk' },
      select: {
        id: true,
        email: true,
        role: true,
        active: true,
        passwordHash: true
      }
    });
    
    console.log('Verification result:', admin);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recreateAdmin();

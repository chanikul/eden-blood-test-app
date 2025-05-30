import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.dlzfhnnwyvddaoikrung:DNE8ytm_uyw1jbc*qbr@aws-0-eu-west-2.pooler.supabase.com:5432/postgres"
    }
  }
});

async function updateAdminWithFreshHash() {
  try {
    // Generate a fresh hash
    const password = 'Admin123!';
    console.log('Generating fresh hash for password:', password);
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    console.log('Generated hash:', hash);

    // Update admin with new hash
    console.log('Updating admin with new hash...');
    const updatedAdmin = await prisma.admin.update({
      where: { email: 'admin@edenclinic.co.uk' },
      data: { passwordHash: hash },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        active: true
      }
    });

    console.log('Admin updated:', updatedAdmin);

    // Verify the password works
    console.log('Verifying password...');
    const isValid = await bcrypt.compare(password, updatedAdmin.passwordHash);
    console.log('Password verification:', { isValid });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminWithFreshHash();

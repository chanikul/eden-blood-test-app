import { PrismaClient, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Check for existing admins
    const admins = await prisma.admin.findMany();
    console.log('Current admins:', admins);

    if (admins.length === 0) {
      // Create a default admin
      const passwordHash = await bcrypt.hash('admin123', 10);
      const admin = await prisma.admin.create({
        data: {
          email: 'admin@edenclinic.com',
          name: 'Admin',
          passwordHash,
          role: AdminRole.ADMIN,
          active: true
        }
      });
      console.log('Created default admin:', admin);
    } else {
      console.log('Existing admins found:', admins.map(a => ({ email: a.email, active: a.active })));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

import { createAdmin } from '../src/lib/services/admin';
import { AdminRole } from '@prisma/client';

async function main() {
  try {
    const admin = await createAdmin({
      email: 'admin2@eden-clinic.com',
      name: 'Admin',
      password: 'Admin123!',
      role: AdminRole.SUPER_ADMIN
    });
    
    console.log('Admin user created:', admin);
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

main();

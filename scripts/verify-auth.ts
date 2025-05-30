import { validateAdminPassword } from '../src/lib/services/admin';

async function verifyAuth() {
  console.log('Verifying admin authentication...');
  const admin = await validateAdminPassword('admin@edenclinic.co.uk', 'Admin123!');
  console.log('Auth result:', admin);
}

verifyAuth().catch(console.error);

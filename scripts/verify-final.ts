import { validateAdminPassword } from '../src/lib/services/admin';
import * as bcrypt from 'bcryptjs';

async function verifyAuth() {
  console.log('Verifying admin authentication...');
  
  // Test the password hash directly
  const testPassword = 'Admin123!';
  const testHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
  
  console.log('Testing bcrypt hash directly...');
  const hashValid = await bcrypt.compare(testPassword, testHash);
  console.log('Hash test result:', { hashValid });
  
  console.log('Testing full authentication...');
  const admin = await validateAdminPassword('admin@edenclinic.co.uk', 'Admin123!');
  console.log('Auth result:', admin);
}

verifyAuth().catch(console.error);

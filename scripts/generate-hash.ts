import * as bcrypt from 'bcryptjs';

async function generateHash() {
  try {
    const password = 'Admin123!';
    console.log('Generating hash for password:', password);
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash:', hash);
    
    // Verify the hash works
    const isValid = await bcrypt.compare(password, hash);
    console.log('Verification test:', isValid);
    
    // Generate SQL
    console.log('\nSQL to update admin:');
    console.log(`UPDATE "Admin" SET "passwordHash" = '${hash}', "updatedAt" = CURRENT_TIMESTAMP WHERE email = 'admin@edenclinic.co.uk';`);
  } catch (error) {
    console.error('Error:', error);
  }
}

generateHash();

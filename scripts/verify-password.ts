import * as bcrypt from 'bcryptjs';

const password = 'Admin123!';
const hash = '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa';

async function verifyPassword() {
  try {
    console.log('Verifying password...');
    const isValid = await bcrypt.compare(password, hash);
    console.log('Password valid?', isValid);
  } catch (error) {
    console.error('Error verifying password:', error);
  }
}

verifyPassword();

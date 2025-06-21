// This file serves as a wrapper to re-export the welcome email template
// to avoid ESM import issues with .tsx files

// Re-export the generateWelcomeEmail function
export { generateWelcomeEmail } from './welcome';

// Define the props interface here to avoid import issues
export interface WelcomeEmailProps {
  name: string;
  email: string;
  password: string;
  orderId?: string;
  testName?: string;
}

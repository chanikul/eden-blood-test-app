import { Order } from '@prisma/client';
import { renderAsync } from '@react-email/render';
import WelcomeEmail from './welcome-email';

interface WelcomeEmailProps {
  order: Order;
  email: string;
  password?: string;
  name: string;
}

export async function generateWelcomeEmail({
  order,
  email,
  password,
  name,
}: WelcomeEmailProps): Promise<{ html: string; subject: string }> {
  const html = await renderAsync(
    WelcomeEmail({
      name,
      email,
      tempPassword: password,
      order,
    })
  );

  return {
    html,
    subject: 'Welcome to Eden Clinic - Your Account is Ready',
  };
}

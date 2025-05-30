import { Order } from '@prisma/client';
import { renderAsync } from '@react-email/render';
import WelcomeEmail from './welcome-email';
import { EmailTemplateResponse, WelcomeEmailProps } from './types';

export async function generateWelcomeEmail(props: WelcomeEmailProps): Promise<EmailTemplateResponse> {
  const { name, email, password, order } = props;

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

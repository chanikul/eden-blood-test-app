import { Order } from '@prisma/client';
import { renderAsync } from '@react-email/render';
import WelcomeEmail from './welcome-email';
import { EmailTemplateResponse, WelcomeEmailProps } from './types';

export async function generateWelcomeEmail(props: WelcomeEmailProps): Promise<EmailTemplateResponse> {
  const { name, email, password, orderId, testName } = props;

  const html = await renderAsync(
    WelcomeEmail({
      name,
      email,
      tempPassword: password,
      orderId,
      testName,
    })
  );

  return {
    html,
    subject: 'Welcome to Eden Clinic - Your Account is Ready',
  };
}

// Make sure this function is properly exported
export default { generateWelcomeEmail };

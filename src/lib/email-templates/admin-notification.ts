import { renderAsync } from '@react-email/render';
import AdminNotificationEmail from './admin-notification-email';
import { AdminNotificationEmailProps, EmailTemplateResponse } from './types';

export async function generateAdminNotificationEmail(props: AdminNotificationEmailProps): Promise<EmailTemplateResponse> {
  const {
    name,
    email,
    orderId,
    testName,
    shippingAddress,
    notes,
    paymentStatus = 'pending'
  } = props;

  const orderDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const html = await renderAsync(
    AdminNotificationEmail({
      name,
      email,
      orderId,
      testName,
      shippingAddress,
      notes,
      orderDate,
      paymentStatus
    })
  );

  return {
    subject: `New Order Notification - Eden Clinic #${orderId}`,
    html
  };
}

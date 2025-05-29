import { renderAsync } from '@react-email/render';
import AdminNotificationEmail from './admin-notification-email';

export async function generateAdminNotificationEmail({
  name,
  email,
  orderId,
  testName,
  shippingAddress,
  notes,
  paymentStatus = 'pending',
}: {
  name: string;
  email: string;
  orderId: string;
  testName: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  };
  notes?: string;
  paymentStatus?: string;
}) {
  const orderDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return await renderAsync(
    AdminNotificationEmail({
      name,
      email,
      orderId,
      testName,
      shippingAddress,
      notes,
      orderDate,
      paymentStatus,
    })
  );
}

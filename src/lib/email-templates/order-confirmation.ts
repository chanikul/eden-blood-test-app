interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postal_code: string;
  country: string;
}

export const formatShippingAddress = (shippingAddress?: string): string => {
  if (!shippingAddress) return '';
  try {
    const address = JSON.parse(shippingAddress) as ShippingAddress;
    return `
      ${address.name}
      ${address.line1}
      ${address.line2 ? `${address.line2}\n` : ''}
      ${address.city}${address.state ? `, ${address.state}` : ''} ${address.postal_code}
      ${address.country}
    `.trim().replace(/\n\s+/g, '\n');
  } catch (error) {
    console.error('Error parsing shipping address:', error);
    return '';
  }
}

import { renderAsync } from '@react-email/render';
import OrderConfirmationEmail from './order-confirmation-email';

export async function generateOrderConfirmationEmail({
  name,
  orderId,
  testName,
  shippingAddress,
  orderStatus = 'Confirmed',
  orderDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
}: {
  name: string;
  orderId: string;
  testName: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  };
  orderStatus?: string;
  orderDate?: string;
}) {
  return await renderAsync(
    OrderConfirmationEmail({
      name,
      orderId,
      testName,
      shippingAddress,
      orderStatus,
      orderDate,
    })
  );
}

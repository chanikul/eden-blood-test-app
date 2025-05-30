import { EmailTemplateResponse, OrderConfirmationEmailProps } from './types';

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

export const generateOrderConfirmationEmail = async ({
  name,
  orderId,
  testName,
  shippingAddress,
  orderStatus = 'Confirmed',
  orderDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}: OrderConfirmationEmailProps): Promise<EmailTemplateResponse> => {
  const html = await renderAsync(
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

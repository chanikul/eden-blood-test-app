interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postal_code: string;
  country: string;
}

const formatShippingAddress = (shippingAddress?: string): string => {
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
};

export const generateOrderConfirmationEmailHtml = ({
  fullName,
  testName,
  orderId,
  shippingAddress,
}: {
  fullName: string;
  testName: string;
  orderId: string;
  shippingAddress?: string;
}) => {
  const formattedAddress = formatShippingAddress(shippingAddress);
  const shippingAddressHtml = formattedAddress ? `
    <div style="margin-bottom: 24px; padding: 16px; background-color: #f8fafc; border-radius: 8px;">
      <h2 style="color: #2d3748; font-size: 18px; margin-bottom: 12px;">Shipping Address</h2>
      <div style="font-family: 'Courier New', monospace; white-space: pre-wrap;">
        ${formattedAddress}
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2 {
            color: #2d3748;
            margin-bottom: 24px;
          }
          .content {
            background-color: #f7fafc;
            padding: 24px;
            border-radius: 8px;
          }
          .shipping-address {
            background-color: #fff;
            padding: 16px;
            border-radius: 4px;
            margin-bottom: 24px;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="content">
          <h2>Thank You for Your Order</h2>
          <p>Dear ${fullName},</p>
          <p>Thank you for choosing Eden Clinic. Your order has been successfully processed.</p>

          <div style="margin-bottom: 24px;">
            <h2 style="color: #2d3748; font-size: 18px; margin-bottom: 12px;">Order Details</h2>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="margin-bottom: 8px;">Order ID: ${orderId}</li>
              <li style="margin-bottom: 8px;">Test Type: ${testName}</li>
            </ul>
          </div>

          ${shippingAddress ? `
          <div style="margin-bottom: 24px;">
            <h2 style="color: #2d3748; font-size: 18px; margin-bottom: 12px;">Shipping Address</h2>
            <div class="shipping-address">
              ${formatShippingAddress(shippingAddress)}
            </div>
          </div>` : ''}

          <h3>Next Steps</h3>
          <ol>
            <li>You will receive a separate email with instructions for your blood test appointment.</li>
            <li>Please bring a valid ID to your appointment.</li>
            <li>Make sure to follow any pre-test instructions provided for your specific test.</li>
          </ol>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
        </div>
      </body>
    </html>
  `;
};

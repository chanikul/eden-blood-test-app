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
  isHomeKit = false,
}: {
  fullName: string;
  testName: string;
  orderId: string;
  shippingAddress?: string;
  isHomeKit?: boolean;
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

  const nextStepsHtml = isHomeKit ? `
    <h3 style="color: #2d3748; font-size: 20px; margin-bottom: 16px;">What Happens Next</h3>
    <ol style="padding-left: 24px; margin-bottom: 24px;">
      <li style="margin-bottom: 12px;"><strong>Book a phlebotomy appointment</strong> with a trained professional.</li>
      <li style="margin-bottom: 12px;"><strong>Prepare for your test</strong> – drink water, follow pre-test instructions.</li>
      <li style="margin-bottom: 12px;"><strong>Attend your appointment</strong> – your blood will be collected by the phlebotomist.</li>
      <li style="margin-bottom: 12px;"><strong>Return your sample</strong> – drop it at Royal Mail Post Office before 11AM (Mon–Thu). Don't post on Fridays or bank holidays.</li>
    </ol>
  ` : `
    <h3 style="color: #2d3748; font-size: 20px; margin-bottom: 16px;">Next Steps</h3>
    <ol style="padding-left: 24px; margin-bottom: 24px;">
      <li style="margin-bottom: 12px;">You will receive a separate email with instructions for your blood test appointment.</li>
      <li style="margin-bottom: 12px;">Please bring a valid ID to your appointment.</li>
      <li style="margin-bottom: 12px;">Make sure to follow any pre-test instructions provided for your specific test.</li>
    </ol>
  `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap');
          
          body {
            font-family: 'Open Sans', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
          }
          
          .header {
            background-color: #1e40af;
            color: white;
            padding: 24px;
            border-radius: 8px 8px 0 0;
            text-align: center;
            margin-bottom: 0;
          }
          
          .content {
            background-color: #f7fafc;
            padding: 32px 24px;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          h1, h2, h3 {
            color: #2d3748;
            margin-bottom: 24px;
            font-weight: 600;
          }
          
          .order-details {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .shipping-address {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 24px;
            line-height: 1.5;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .support-section {
            background-color: #ebf4ff;
            padding: 20px;
            border-radius: 8px;
            margin-top: 24px;
          }
          
          .cta-button {
            display: inline-block;
            background-color: #1e40af;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            margin-top: 16px;
            font-weight: 600;
          }
          
          .footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
          }
          
          @media (max-width: 600px) {
            body {
              padding: 12px;
            }
            .content {
              padding: 20px 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color: white; margin: 0;">Thank you for your order, ${fullName}!</h1>
        </div>
        
        <div class="content">
          <div class="order-details">
            <h2 style="margin-top: 0;">${isHomeKit ? 'Test Kit Summary' : 'Order Details'}</h2>
            ${isHomeKit ? `<p style="margin-bottom: 16px;">You've ordered a Home Blood Testing Kit (Venous Sampling).</p>` : ''}
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="margin-bottom: 8px;">Order ID: ${orderId}</li>
              <li style="margin-bottom: 8px;">${isHomeKit ? 'Test' : 'Test Type'}: ${testName}</li>
            </ul>
          </div>

          ${shippingAddressHtml}
          
          ${nextStepsHtml}
          
          <div class="support-section">
            <h3 style="margin-top: 0; color: #2d3748;">Support</h3>
            <p>For help, email <a href="mailto:support@edenclinic.co.uk" style="color: #1e40af;">support@edenclinic.co.uk</a> or call <a href="tel:07980125810" style="color: #1e40af;">07980 125810</a>.</p>
            ${isHomeKit ? `<p>Scan your kit's leaflet or visit <a href="https://edenclinic.co.uk" style="color: #1e40af;">edenclinic.co.uk</a> for a video guide.</p>` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://edenclinic.co.uk'}/order/${orderId}" class="cta-button">Track My Order</a>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Eden Clinic. All rights reserved.</p>
            <p>Follow us @edenclinicformen</p>
            <p>This email was sent to confirm your order. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

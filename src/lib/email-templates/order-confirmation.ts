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
}): string => {
  const formattedAddress = formatShippingAddress(shippingAddress);
  const shippingAddressHtml = formattedAddress ? `
    <div style="margin-bottom: 24px; padding: 16px; background-color: #f8fafc; border-radius: 8px;">
      <h2 style="color: #2d3748; font-size: 18px; margin-bottom: 12px;">Shipping Address</h2>
      <div style="font-family: 'Courier New', monospace; white-space: pre-wrap;">
        ${formattedAddress}
      </div>
    </div>
  ` : '';

  const nextStepsHtml: string = isHomeKit ? `
    <div class="section" style="margin-bottom: 32px;">
      <h3 style="color: #2d3748; font-size: 20px; margin-bottom: 16px;">What Happens Next</h3>
      <ol style="padding-left: 24px; margin-bottom: 24px;">
        <li style="margin-bottom: 12px;"><strong>Book a phlebotomy appointment</strong> with a trained professional.</li>
        <li style="margin-bottom: 12px;"><strong>Prepare for your test</strong> – drink water, follow pre-test instructions.</li>
      </ol>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - Eden Clinic</title>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://edenclinic.co.uk/logo.png" alt="Eden Clinic" height="48" />
            <h1>Order Confirmation</h1>
          </div>

          <div class="order-details" style="margin-bottom: 32px; padding: 24px; background-color: #f8fafc; border-radius: 8px;">
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
            <p>&copy; ${new Date().getFullYear()} Eden Clinic. All rights reserved.</p>
            <p>Follow us @edenclinicformen</p>
            <p>This email was sent to confirm your order. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
          </div>
        </div>
      </body>
    </html>
  `;
}

interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

export const generateOrderNotificationEmailHtml = ({
  fullName,
  email,
  dateOfBirth,
  testName,
  notes,
  orderId,
  shippingAddress,
}: {
  fullName: string;
  email: string;
  dateOfBirth: string;
  testName: string;
  notes?: string;
  orderId: string;
  shippingAddress?: string;
}) => {
  // Format shipping address if provided
  let formattedAddress = '';
  if (shippingAddress) {
    try {
      // Check if shippingAddress is already an object or needs parsing
      const address = typeof shippingAddress === 'string' ? JSON.parse(shippingAddress) : shippingAddress;
      formattedAddress = `
        <div class="order-details">
          <h2>Shipping Address</h2>
          <p>
            ${address.line1}<br>
            ${address.line2 ? `${address.line2}<br>` : ''}
            ${address.city}${address.state ? `, ${address.state}` : ''} ${address.postal_code || address.postcode}<br>
            ${address.country}
          </p>
        </div>
      `;
    } catch (error) {
      console.error('Error formatting shipping address:', error);
      formattedAddress = '';
    }
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Blood Test Order</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
            background-color: #f9fafb;
          }
          .order-details {
            background-color: white;
            border: 1px solid #e5e7eb;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 20px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #6b7280;
            font-size: 14px;
          }
          h1, h2 {
            color: #1f2937;
          }
          p {
            margin-bottom: 10px;
          }
          .highlight {
            font-weight: bold;
            color: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Blood Test Order</h1>
          </div>
          <div class="content">
            <p>A new blood test order has been received with the following details:</p>
            
            <div class="order-details">
              <h2>Order Information</h2>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Test:</strong> ${testName}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="order-details">
              <h2>Patient Information</h2>
              <p><strong>Name:</strong> ${fullName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Date of Birth:</strong> ${dateOfBirth}</p>
              ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            </div>
            
            ${formattedAddress}
            
            <p>Please log in to the admin dashboard to process this order.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Eden Clinic.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

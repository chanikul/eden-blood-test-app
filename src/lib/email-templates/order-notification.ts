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
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Order Notification - Eden Clinic</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 5px;
          }
          .order-details, .shipping-address {
            background-color: #fff;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }
          .shipping-address {
            white-space: pre-line;
          }
            margin: 20px 0;
          }
          .order-details table {
            width: 100%;
            border-collapse: collapse;
          }
          .order-details th, .order-details td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          .notes {
            margin-top: 20px;
            padding: 10px;
            background-color: #fff;
            border-left: 4px solid #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>New Order Notification</h1>
        </div>
        <div class="content">
          <h2>Order Details</h2>
          <div class="order-details">
            <table>
              <tr>
                <th>Order ID:</th>
                <td>${orderId}</td>
              </tr>
              <tr>
                <th>Test Type:</th>
                <td>${testName}</td>
              </tr>

              <tr>
                <th>Patient Name:</th>
                <td>${fullName}</td>
              </tr>
              <tr>
                <th>Email:</th>
                <td>${email}</td>
              </tr>
              <tr>
                <th>Date of Birth:</th>
                <td>${dateOfBirth}</td>
              </tr>
            </table>
          </div>
          ${shippingAddress ? `
            <div class="shipping-address" style="margin: 20px 0; padding: 15px; background-color: #fff; border-radius: 4px; border-left: 4px solid #4a90e2;">
              <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Shipping Address:</h3>
              ${(() => {
                const address = JSON.parse(shippingAddress);
                return `
                  <p style="margin: 0; line-height: 1.5;">
                    ${address.line1}<br>
                    ${address.line2 ? `${address.line2}<br>` : ''}
                    ${address.city}, ${address.postal_code}<br>
                    ${address.state ? `${address.state}<br>` : ''}
                    ${address.country}
                  </p>
                `;
              })()}
            </div>
          ` : ''}
          ${notes ? `
            <div class="notes">
              <h3>Additional Notes:</h3>
              <p>${notes}</p>
            </div>
          ` : ''}
          <p>Please process this order and prepare the blood test kit for shipping.</p>
        </div>
      </body>
    </html>
  `;
};

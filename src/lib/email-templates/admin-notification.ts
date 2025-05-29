import { Order } from '@prisma/client';
import { generateEmailLayout } from './layout';
import { formatShippingAddress } from './order-confirmation';

interface OrderWithAmount extends Order {
  amount?: number;
}

interface AdminNotificationProps {
  order: OrderWithAmount;
  customerEmail: string;
  customerName: string;
  shippingAddress?: string;
  accountCreated?: boolean;
}

export function generateAdminNotificationEmail({
  order,
  customerEmail,
  customerName,
  shippingAddress,
  accountCreated,
}: AdminNotificationProps): { html: string; subject: string } {
  const subject = `New Blood Test Order - ${order.testName}`;

  const amount = order.amount ?? 0;

  const content = `
    <div class="section">
      <h2>🩺 New Blood Test Order</h2>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Test:</strong> ${order.testName}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p><strong>Amount:</strong> £${(amount / 100).toFixed(2)}</p>
      <p><strong>Created:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
    </div>

    <div class="section">
      <h2>👤 Customer Details</h2>
      <p><strong>Name:</strong> ${customerName}</p>
      <p><strong>Email:</strong> ${customerEmail}</p>
      ${accountCreated ? '<p><strong>✅ New account created</strong></p>' : ''}
    </div>

    ${shippingAddress ? `
      <div class="section">
        <h2>📍 Shipping Address</h2>
        <div class="monospace">
          ${formatShippingAddress(shippingAddress)}
        </div>
      </div>
    ` : ''}

    <div class="section">
      <h2>📝 Notes</h2>
      <p>${order.notes || 'No additional notes'}</p>
    </div>
  `;

  const html = generateEmailLayout({
    subject,
    content,
    showDashboardButton: true,
  });

  return {
    subject,
    html,
  };
}

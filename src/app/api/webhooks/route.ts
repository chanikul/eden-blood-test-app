import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import sgMail from '@sendgrid/mail';
import { OrderStatus } from '@prisma/client';

// Type definitions
interface Order {
  id: string;
  testName: string;
  patientName: string;
  patientEmail: string;
  patientDateOfBirth: string;
  patientMobile: string | null;
  notes: string | null;
  shippingAddress: any;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  dispatchedAt: Date | null;
  dispatchedBy: string | null;
}

interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  postal_code: string;
  country: string;
}

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'
});

// Track processed session IDs to prevent duplicate processing
const processedSessions = new Set<string>();

// Helper functions for email formatting
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const formatShippingAddress = (addressJson: any) => {
  if (!addressJson) return 'Not provided';
  const addr = JSON.parse(addressJson) as ShippingAddress;
  const parts = [
    addr.line1,
    addr.line2,
    addr.city,
    addr.postal_code,
    addr.country
  ].filter(Boolean);
  return parts.join('\n');
};

export async function POST(request: Request) {
  const allowedEvents = ['checkout.session.completed'];
  
  console.log('Webhook request received');

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature') || '';

  console.log('Webhook received:', {
    hasSignature: !!signature,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasSendGridKey: !!process.env.SENDGRID_API_KEY,
    supportEmail: process.env.SUPPORT_EMAIL
  });

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing signature or webhook secret:', {
      hasSignature: !!signature,
      signatureValue: signature,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10)
    });
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('Webhook event type:', event.type);

    // Only process allowed events
    if (!allowedEvents.includes(event.type)) {
      console.log('Skipping event type:', event.type);
      return NextResponse.json({ received: true });
    }
  } catch (err) {
    const error = err as Error;
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    console.log('Processing checkout session:', {
      sessionId: session.id,
      orderId,
      hasOrderId: !!orderId,
      customerEmail: session.customer_details?.email
    });

    if (!orderId) {
      console.error('No order ID in session metadata');
      return NextResponse.json(
        { error: 'No order ID in session metadata' },
        { status: 400 }
      );
    }

    try {
      // Get shipping address from session
      const shippingAddress = session.customer_details?.address ? JSON.stringify({
        line1: String(session.customer_details.address.line1 || ''),
        line2: String(session.customer_details.address.line2 || ''),
        city: String(session.customer_details.address.city || ''),
        postal_code: String(session.customer_details.address.postal_code || ''),
        country: String(session.customer_details.address.country || '')
      } as ShippingAddress) : null;

      // Update order status
      const order: Order = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          shippingAddress: shippingAddress as any
        }
      });

      console.log('Updated order:', {
        orderId: order.id,
        status: order.status,
        patientEmail: order.patientEmail
      });

      // Check if we've already processed this session
      if (processedSessions.has(session.id)) {
        console.log('Session already processed, skipping emails:', session.id);
        return NextResponse.json({ received: true });
      }
      processedSessions.add(session.id);

      // Send confirmation email to customer
      const customerMsg = {
        to: order.patientEmail,
        from: process.env.SUPPORT_EMAIL!,
        subject: 'Your Eden Clinic Blood Test Order – Confirmed',
        text: `Thank you for your order with Eden Clinic!

Order Details:
Test: ${order.testName}
Order ID: ${String(order.id)}
Order Date: ${new Date().toLocaleDateString()}

Patient Details:
Name: ${order.patientName}
Email: ${order.patientEmail}
Date of Birth: ${order.patientDateOfBirth}
${order.patientMobile ? `Mobile: ${order.patientMobile}` : ''}

Shipping Address:
${formatShippingAddress(order.shippingAddress)}

Next Steps:
1. Book an appointment with a phlebotomist
2. Follow preparation instructions
3. Ensure proper sample labeling
4. Return sample before 11 AM (avoid weekends)

You will receive another email confirmation once we receive your blood sample.
        `,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            @media (prefers-color-scheme: dark) {
              .email-container { background-color: #1a1a1a !important; color: #ffffff !important; }
              .card { background-color: #2d2d2d !important; border-color: #404040 !important; }
              .highlight-box { background-color: #1e3a5f !important; }
            }
            @media only screen and (max-width: 600px) {
              .steps-container { flex-direction: column !important; }
              .step-card { width: 100% !important; margin: 10px 0 !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Open Sans', Arial, sans-serif;">
          <div class="email-container" style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #333333;">
            <!-- Header Section -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c5282; margin: 0;">Thank you for your order with Eden Clinic!</h1>
              <p style="margin-top: 10px;">We're excited to help you on your health journey.</p>
            </div>

            <!-- Order Details Section -->
            <div class="card" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #2c5282; margin-top: 0;">📝 Order Details</h2>
              <p style="margin: 5px 0;"><strong>Test:</strong> ${String(order.testName)}</p>
              <p style="margin: 5px 0;"><strong>Order ID:</strong> ${String(order.id)}</p>
              <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
              
              <div style="margin-top: 15px;">
                <h3 style="color: #2c5282; margin-bottom: 10px;">Patient Information</h3>
                <p style="margin: 5px 0;"><strong>Name:</strong> ${order.patientName}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${order.patientEmail}</p>
                <p style="margin: 5px 0;"><strong>Date of Birth:</strong> ${order.patientDateOfBirth}</p>
                ${order.patientMobile ? `<p style="margin: 5px 0;"><strong>Mobile:</strong> ${order.patientMobile}</p>` : ''}
              </div>

              ${order.shippingAddress ? `
                <div style="margin-top: 15px;">
                  <h3 style="color: #2c5282; margin-bottom: 10px;">Shipping Address</h3>
                  ${(() => {
                    const addr = JSON.parse(order.shippingAddress) as ShippingAddress;
                    return `
                      <p style="margin: 5px 0;">${String(addr.line1)}</p>
                      ${addr.line2 ? `<p style="margin: 5px 0;">${String(addr.line2)}</p>` : ''}
                      <p style="margin: 5px 0;">${String(addr.city)}</p>
                      <p style="margin: 5px 0;">${String(addr.postal_code)}</p>
                      <p style="margin: 5px 0;">${String(addr.country)}</p>
                    `;
                  })()}
                </div>
              ` : ''}
            </div>

            <!-- Instructions Reminder -->
            <div class="highlight-box" style="background-color: #ebf8ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #2c5282; margin-top: 0;">📖 Important Instructions</h2>
              <p style="margin: 5px 0;">Please refer to the leaflet included in your test kit for full instructions on collection, return, and results. Following these instructions carefully ensures accurate test results.</p>
            </div>

            <!-- Blood Sample Process Section -->
            <div style="margin-bottom: 20px;">
              <h2 style="color: #2c5282;">🧪 Blood Sample Process</h2>
              <div class="steps-container" style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                <div class="step-card" style="width: 22%; min-width: 200px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 10px;">
                  <p style="font-size: 24px; margin: 0;">📦</p>
                  <h3 style="color: #2c5282; margin: 10px 0;">Step 1</h3>
                  <p style="margin: 0;">Arrange Your Blood Collection – Find local phlebotomist</p>
                </div>
                <div class="step-card" style="width: 22%; min-width: 200px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 10px;">
                  <p style="font-size: 24px; margin: 0;">💧</p>
                  <h3 style="color: #2c5282; margin: 10px 0;">Step 2</h3>
                  <p style="margin: 0;">Prepare for Appointment – Stay hydrated, avoid exercise</p>
                </div>
                <div class="step-card" style="width: 22%; min-width: 200px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 10px;">
                  <p style="font-size: 24px; margin: 0;">🧪</p>
                  <h3 style="color: #2c5282; margin: 10px 0;">Step 3</h3>
                  <p style="margin: 0;">Collect Your Sample – Sample must be labeled</p>
                </div>
                <div class="step-card" style="width: 22%; min-width: 200px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 10px;">
                  <p style="font-size: 24px; margin: 0;">📮</p>
                  <h3 style="color: #2c5282; margin: 10px 0;">Step 4</h3>
                  <p style="margin: 0;">Return It – Drop off before 11AM, avoid weekends</p>
                </div>
              </div>
            </div>

            <!-- Support Info Section -->
            <div style="text-align: right; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <h2 style="color: #2c5282;">💬 Need Help?</h2>
              <p style="margin: 5px 0;">📞 07980 125810</p>
              <p style="margin: 5px 0;">📧 support@edenclinic.co.uk</p>
              <p style="margin: 5px 0;">🌐 www.edenclinic.co.uk</p>
            </div>
          </div>
        </body>
        </html>
        `
      };

      const adminEmail = {
        to: process.env.SUPPORT_EMAIL!,
        from: process.env.SUPPORT_EMAIL!,
        subject: 'New Blood Test Order',
        text: `
New Blood Test Order

Test: ${order.testName}
Order ID: ${String(order.id)}

Patient Details:
Name: ${order.patientName}
Email: ${order.patientEmail}
Date of Birth: ${order.patientDateOfBirth}
Mobile: ${order.patientMobile || 'Not provided'}

Notes: ${order.notes || 'None'}

Shipping Address:
${formatShippingAddress(order.shippingAddress)}
`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: 'Open Sans', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            .header { background: #2c5282; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .button { display: inline-block; background: #2c5282; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
            .info-row { display: flex; margin-bottom: 10px; }
            .label { font-weight: bold; width: 140px; }
            .value { flex: 1; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">New Blood Test Order</h1>
              <p style="margin: 10px 0 0 0;">A new order has been received and requires your attention.</p>
            </div>

            <div class="card">
              <h2 style="color: #2c5282; margin-top: 0;">Order Details</h2>
              <div class="info-row">
                <div class="label">Test:</div>
                <div class="value">${String(order.testName)}</div>
              </div>
              <div class="info-row">
                <div class="label">Order ID:</div>
                <div class="value">${String(order.id)}</div>
              </div>
              <div class="info-row">
                <div class="label">Order Date:</div>
                <div class="value">${new Date().toLocaleDateString()}</div>
              </div>
            </div>

            <div class="card">
              <h2 style="color: #2c5282; margin-top: 0;">Patient Information</h2>
              <div class="info-row">
                <div class="label">Name:</div>
                <div class="value">${order.patientName}</div>
              </div>
              <div class="info-row">
                <div class="label">Email:</div>
                <div class="value">${order.patientEmail}</div>
              </div>
              <div class="info-row">
                <div class="label">Date of Birth:</div>
                <div class="value">${order.patientDateOfBirth}</div>
              </div>
              ${order.patientMobile ? `
              <div class="info-row">
                <div class="label">Mobile:</div>
                <div class="value">${order.patientMobile}</div>
              </div>` : ''}
              ${order.notes ? `
              <div class="info-row">
                <div class="label">Notes:</div>
                <div class="value">${order.notes}</div>
              </div>` : ''}
            </div>

            ${order.shippingAddress ? `
            <div class="card">
              <h2 style="color: #2c5282; margin-top: 0;">Shipping Address</h2>
              ${(() => {
                interface ShippingAddress {
                  line1: string;
                  line2?: string;
                  city: string;
                  postal_code: string;
                  country: string;
                }
                const addr = JSON.parse(order.shippingAddress) as ShippingAddress;
                return `
                  <div class="info-row">
                    <div class="label">Address Line 1:</div>
                    <div class="value">${String(addr.line1)}</div>
                  </div>
                  ${addr.line2 ? `
                  <div class="info-row">
                    <div class="label">Address Line 2:</div>
                    <div class="value">${String(addr.line2)}</div>
                  </div>` : ''}
                  <div class="info-row">
                    <div class="label">City:</div>
                    <div class="value">${String(addr.city)}</div>
                  </div>
                  <div class="info-row">
                    <div class="label">Postal Code:</div>
                    <div class="value">${String(addr.postal_code)}</div>
                  </div>
                  <div class="info-row">
                    <div class="label">Country:</div>
                    <div class="value">${String(addr.country)}</div>
                  </div>
                `;
              })()}
            </div>` : ''}

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://edenclinic.netlify.app/admin/orders" class="button">View Order in Admin Dashboard →</a>
            </div>
          </div>
        </body>
        </html>
        `
      };

    console.log('Sending confirmation emails to:', {
      customer: order.patientEmail,
      admin: process.env.SUPPORT_EMAIL
    });

    try {
      const emailPromises = [];
      
      // Only send customer email if it exists (not a duplicate session)
      if (customerMsg) {
        emailPromises.push(sgMail.send(customerMsg));
      }
        
        // Always send admin email
        emailPromises.push(sgMail.send(adminEmail));
        
        const responses = await Promise.all(emailPromises);
        
        console.log('Email sending results:', {
          customerSent: !!customerMsg,
          adminSent: true,
          responses: responses.map(r => r[0].statusCode)
        });


      } catch (emailError: any) {
        console.error('Failed to send emails:', {
          error: emailError.message,
          response: emailError.response?.body
        });
        // Don't return error response - we still want to acknowledge the webhook
      }

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('Error processing order:', {
        error: error.message,
        code: error.code,
        stack: error.stack,
        orderId,
        sessionId: session.id,
        customerEmail: session.customer_email
      });
      return NextResponse.json(
        { error: 'Error processing order', details: error.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

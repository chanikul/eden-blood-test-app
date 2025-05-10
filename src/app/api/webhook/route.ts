import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { BloodTest } from '@/types/schema';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.error('No order ID found in session metadata');
      return NextResponse.json(
        { error: 'No order ID found' },
        { status: 400 }
      );
    }

    try {
      // Update order status
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          paymentId: session.payment_intent as string,
        },
        include: {
          tests: true,
        },
      });

      // Send confirmation email to patient
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: order.email,
        subject: 'Blood Test Order Confirmation',
        html: `
          <h1>Order Confirmation</h1>
          <p>Dear ${order.patientName},</p>
          <p>Thank you for your order. Your payment has been successfully processed.</p>
          <h2>Order Details:</h2>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Total Amount:</strong> £${order.totalAmount.toFixed(2)}</p>
          <h3>Selected Tests:</h3>
          <ul>
            ${order.tests.map((test: BloodTest) => `<li>${test.name}</li>`).join('')}
          </ul>
          <p>We will contact you shortly with instructions for your blood test appointment.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>Eden Clinic Team</p>
        `,
      });

      return NextResponse.json({ status: 'success' });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return NextResponse.json(
        { error: 'Error processing webhook' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

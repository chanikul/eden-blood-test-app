import { NextResponse } from 'next/server';
import { bloodTestOrderSchema } from '@/types/schema';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
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
  try {
    const body = await request.json();
    const validatedData = bloodTestOrderSchema.parse(body);

    // Get the selected tests from the database
    const selectedTests = await prisma.bloodTest.findMany({
      where: {
        id: {
          in: validatedData.tests,
        },
      },
    });

    const totalAmount = selectedTests.reduce((sum, test) => sum + test.price, 0);

    // Create the order in the database
    const order = await prisma.order.create({
      data: {
        patientName: validatedData.patientName,
        patientEmail: validatedData.email,
        patientMobile: validatedData.phoneNumber,
        patientDateOfBirth: validatedData.dateOfBirth.toISOString().split('T')[0],
        testName: selectedTests[0].name,
        bloodTestId: selectedTests[0].id,
        status: 'PENDING',
      },
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: selectedTests.map((test) => ({
        price_data: {
          currency: 'gbp',
          product_data: {
            name: test.name,
            description: test.description,
          },
          unit_amount: Math.round(test.price * 100),
        },
        quantity: 1,
      })),
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: {
        orderId: order.id,
      },
    });

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    // Send confirmation email to admin
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Blood Test Order',
      html: `
        <h1>New Blood Test Order</h1>
        <p><strong>Patient:</strong> ${validatedData.patientName}</p>
        <p><strong>Email:</strong> ${validatedData.email}</p>
        <p><strong>Phone:</strong> ${validatedData.phoneNumber}</p>
        <p><strong>Date of Birth:</strong> ${validatedData.dateOfBirth.toLocaleDateString()}</p>
        <p><strong>Total Amount:</strong> £${totalAmount.toFixed(2)}</p>
        <h2>Selected Tests:</h2>
        <ul>
          ${selectedTests.map((test) => `<li>${test.name} - £${test.price.toFixed(2)}</li>`).join('')}
        </ul>
      `,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Order submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process order' },
      { status: 500 }
    );
  }
}

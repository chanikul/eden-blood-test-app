import { NextResponse } from 'next/server';
import { getPatientFromToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const patient = await getPatientFromToken();
    
    if (!patient) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const clientUser = await prisma.clientUser.findUnique({
      where: { id: patient.id },
      select: {
        name: true,
        stripeCustomerId: true,
        orders: {
          where: {
            status: { in: ['PAID', 'DISPATCHED'] }
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            testName: true,
            status: true,
            createdAt: true,
            bloodTest: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Get active payment methods from Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const paymentMethods = clientUser?.stripeCustomerId ? 
      await stripe.paymentMethods.list({
        customer: clientUser.stripeCustomerId,
        type: 'card'
      }) : null;

    if (!clientUser) {
      return NextResponse.json(
        { message: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      firstName: clientUser.name,
      recentTests: clientUser.orders.map(order => ({
        id: order.id,
        testName: order.bloodTest.name,
        status: order.status,
        date: order.createdAt
      })),
      hasActivePaymentMethod: paymentMethods?.data.length > 0 || false
    });
  } catch (error) {
    console.error('Error fetching client data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

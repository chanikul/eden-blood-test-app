import { NextResponse } from 'next/server';
import { getPatientFromToken } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const patient = await getPatientFromToken();
    
    if (!patient) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use a type assertion to handle the complex return type
    const clientUser = await prisma.clientUser.findUnique({
      where: { id: patient.id },
      select: {
        name: true,
        stripeCustomerId: true,
        orders: {
          where: {
            status: { in: ['PAID', 'DISPATCHED', 'READY'] }
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            testName: true,
            status: true,
            // @ts-ignore - pdf_url field might be added in a migration
            pdf_url: true,
            createdAt: true,
            bloodTest: {
              select: {
                name: true
              }
            },
            testResults: {
              select: {
                id: true,
                status: true,
                resultUrl: true
              },
              orderBy: { createdAt: 'desc' },
              take: 1
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

    // Type assertion for clientUser to include orders
    const typedClientUser = clientUser as any;
    
    return NextResponse.json({
      firstName: clientUser.name,
      recentTests: typedClientUser.orders.map((order: any) => ({
        id: order.id,
        testName: order.bloodTest.name,
        status: order.status,
        date: order.createdAt,
        pdf_url: order.pdf_url,
        testResult: order.testResults && order.testResults.length > 0 ? {
          id: order.testResults[0].id,
          status: order.testResults[0].status,
          resultUrl: order.testResults[0].resultUrl
        } : null
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

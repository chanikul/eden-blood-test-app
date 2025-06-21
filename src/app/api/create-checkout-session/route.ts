import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Direct import of Prisma without path aliases
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
}) as Stripe;

const requestSchema = z.object({
  // Patient info can be optional when using profile data
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.string().optional(),
  testSlug: z.string(),
  testName: z.string(),
  price: z.number(),
  stripePriceId: z.string(),
  productId: z.string(),
  notes: z.string().optional(),
  mobile: z.string().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  createAccount: z.boolean().default(false),
  password: z.string().optional(),
  shippingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string().optional(),
    postalCode: z.string(),
    country: z.string()
  }),
  // New fields for logged-in clients
  clientId: z.string().optional(),
  useProfileData: z.boolean().optional().default(false)
});

type CheckoutSessionData = z.infer<typeof requestSchema>;

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY environment variable');
    return NextResponse.json(
      { error: 'Stripe configuration missing' },
      { status: 500 }
    );
  }

  try {
    const data: CheckoutSessionData = requestSchema.parse(await request.json());
    
    // If using profile data, fetch client information
    let clientData = {
      fullName: data.fullName,
      email: data.email,
      dateOfBirth: data.dateOfBirth,
      mobile: data.mobile
    };
    
    if (data.useProfileData && data.clientId) {
      try {
        // Fetch client data from the database
        const client = await prisma.clientUser.findUnique({
          where: { id: data.clientId },
          select: {
            name: true,
            email: true,
            dateOfBirth: true,
            mobile: true
          }
        });
        
        if (client) {
          console.log('Using client profile data for order:', {
            clientId: data.clientId,
            email: client.email
          });
          
          // Override with client data
          clientData = {
            fullName: client.name,
            email: client.email,
            dateOfBirth: client.dateOfBirth,
            mobile: client.mobile || data.mobile
          };
        } else {
          console.error('Client not found with ID:', data.clientId);
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
      }
    }

    // Log blood test details (dynamic price ID)
    console.log('Creating checkout for blood test:', {
      name: data.testName,
      testSlug: data.testSlug,
      price: data.price,
      stripePriceId: data.stripePriceId,
      productId: data.productId,
      timestamp: new Date().toISOString()
    });

    // Create an order record
    let order;
    try {
      // Standardize shipping address format to ensure consistency
      const standardizedShippingAddress = {
        line1: data.shippingAddress.line1,
        line2: data.shippingAddress.line2 || null,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state || null,
        postal_code: data.shippingAddress.postalCode, // Ensure consistent naming (postal_code)
        country: data.shippingAddress.country
      };

      console.log('Creating order with standardized shipping address:', standardizedShippingAddress);
      
      // First, check if we need to create a BloodTest record for this Stripe product
      let bloodTest;
      try {
        // Try to find an existing BloodTest with the same Stripe product ID
        bloodTest = await prisma.bloodTest.findFirst({
          where: {
            stripeProductId: data.productId
          }
        });
        
        // If no BloodTest exists for this Stripe product, create one
        if (!bloodTest) {
          console.log('Creating new BloodTest record for Stripe product:', data.productId);
          bloodTest = await prisma.bloodTest.create({
            data: {
              name: data.testName,
              slug: data.testSlug,
              description: 'Imported from Stripe',
              price: data.price,
              stripeProductId: data.productId,
              stripePriceId: data.stripePriceId,
              isActive: true
            }
          });
        }
      } catch (error) {
        console.error('Error finding or creating BloodTest record:', error);
        throw error;
      }
      
      // Now create the order with the BloodTest ID
      const orderData = {
        patientName: clientData.fullName,
        patientEmail: clientData.email,
        patientDateOfBirth: clientData.dateOfBirth,
        patientMobile: clientData.mobile,
        testName: data.testName,
        notes: data.notes,
        bloodTestId: bloodTest.id, // Use the actual BloodTest ID
        createAccount: data.createAccount,
        shippingAddress: standardizedShippingAddress
      };
      
      // If this is a logged-in client, associate the order with their account
      if (data.clientId) {
        order = await prisma.order.create({
          data: {
            ...orderData,
            clientUser: {
              connect: { id: data.clientId }
            }
          }
        });
      } else {
        order = await prisma.order.create({
          data: orderData
        });
      }

      console.log('Order created successfully:', {
        orderId: order.id,
        patientEmail: order.patientEmail,
        createAccount: order.createAccount
      });
    } catch (error: any) {
      console.error('Error creating order:', error);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Log account creation data
    console.log('=== DEBUG: CHECKOUT SESSION ACCOUNT DATA ===');
    console.log('Account creation details:', {
      createAccount: data.createAccount,
      hasPassword: !!data.password,
      email: clientData.email,
      name: clientData.fullName,
      isLoggedInClient: !!data.clientId
    });

    // Create Stripe checkout session
    try {
      const params: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        customer_email: clientData.email,
        line_items: [
          {
            price: data.stripePriceId,
            quantity: 1
          }
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || `http://${request.headers.get('host') || 'localhost:3000'}`}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: data.cancelUrl,
        shipping_address_collection: {
          allowed_countries: ['GB']
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: { amount: 0, currency: 'gbp' },
              display_name: 'Free shipping',
              delivery_estimate: {
                minimum: { unit: 'business_day', value: 3 },
                maximum: { unit: 'business_day', value: 5 }
              }
            }
          }
        ],
        metadata: {
          orderId: order.id.toString(),
          fullName: clientData.fullName || null,
          email: clientData.email || null,
          dateOfBirth: clientData.dateOfBirth || null, // Add dateOfBirth for client user creation
          priceId: data.stripePriceId,
          testName: data.testName,
          testSlug: data.testSlug,
          notes: data.notes || '',
          mobile: clientData.mobile || '',
          orderCreatedAt: new Date().toISOString(),
          createAccount: data.createAccount.toString(),
          password: data.createAccount && data.password ? data.password : '',
          clientId: data.clientId || ''
        }
      };

      console.log('Creating Stripe session with metadata:', params.metadata);
      const session = await stripe.checkout.sessions.create(params);
      console.log('Stripe session created:', {
        id: session.id,
        metadata: session.metadata
      });

      if (!session.url) {
        return NextResponse.json(
          { error: 'Failed to create checkout session' },
          { status: 500 }
        );
      }

      // Update order with session ID
      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id }
      });

      return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      let errorMessage = 'Failed to create checkout session';

      if (error instanceof Error) {
        errorMessage = `${errorMessage}: ${error.message}`;
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      } else {
        console.error('Unknown error type:', error);
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Error in request:', error);
    let errorMessage = 'Invalid request data';

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error('Unknown error type:', error);
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }


}
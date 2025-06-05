import { NextRequest, NextResponse } from 'next/server';
// Direct import of PrismaClient
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
import { createClientUser } from '../../../../lib/services/client-user';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  dateOfBirth: z.string(),
  orderId: z.string()
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = {
      email: formData.get('email'),
      password: formData.get('password'),
      name: formData.get('name'),
      dateOfBirth: formData.get('dateOfBirth'),
      orderId: formData.get('orderId'),
    };

    // Validate input
    const validatedData = registerSchema.parse(data);

    // Create client user
    const client = await createClientUser({
      email: validatedData.email,
      password: validatedData.password,
      name: validatedData.name,
      dateOfBirth: validatedData.dateOfBirth,
    });

    // Associate order with client
    await prisma.order.update({
      where: { id: validatedData.orderId },
      data: { clientId: client.id }
    });

    // Redirect to client dashboard
    return NextResponse.redirect(`/client/account/orders/${validatedData.orderId}`);
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 400 }
    );
  }
}

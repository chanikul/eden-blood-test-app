import { NextRequest, NextResponse } from 'next/server';
// Direct import of PrismaClient
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
import { getClientSession } from '../../../../lib/auth/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: {
        clientId: session.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { type, name, line1, line2, city, postcode, country, isDefault } = data;

    // If setting as default, unset any existing default of the same type
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          clientId: session.id,
          type: type,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const address = await prisma.address.create({
      data: {
        type,
        name,
        line1,
        line2,
        city,
        postcode,
        country,
        isDefault,
        clientId: session.id,
      },
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { id, type, name, line1, line2, city, postcode, country, isDefault } = data;

    // Verify the address belongs to the client
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        clientId: session.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // If setting as default, unset any existing default of the same type
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          clientId: session.id,
          type: type,
          isDefault: true,
          NOT: {
            id: id,
          },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        type,
        name,
        line1,
        line2,
        city,
        postcode,
        country,
        isDefault,
      },
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getClientSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Address ID is required' },
        { status: 400 }
      );
    }

    // Verify the address belongs to the client and is not default
    const existingAddress = await prisma.address.findFirst({
      where: {
        id,
        clientId: session.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    if (existingAddress.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default address' },
        { status: 400 }
      );
    }

    await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

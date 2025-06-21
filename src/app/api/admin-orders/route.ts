import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromToken } from '@/lib/auth';
import { OrderStatus } from '@/types';

// GET handler for fetching orders
export async function GET(request: Request) {
  try {
    // Check authentication
    const admin = await getAdminFromToken();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status');
    const testType = url.searchParams.get('testType');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // If ID is provided, fetch a specific order
    if (id) {
      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      return NextResponse.json(order);
    }

    // Otherwise, build where clause for filtering orders
    const where: any = {};

    if (search) {
      where.OR = [
        { patientName: { contains: search, mode: 'insensitive' } },
        { patientEmail: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (testType) {
      where.testName = { contains: testType, mode: 'insensitive' };
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.createdAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.createdAt = {
        lte: new Date(endDate),
      };
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// PATCH handler for updating order details
export async function PATCH(request: Request) {
  try {
    // Check authentication
    const admin = await getAdminFromToken();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { id, status, internalNotes } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status provided' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      
      // If status is being set to DISPATCHED, record dispatch info
      if (status === OrderStatus.DISPATCHED) {
        updateData.dispatchedAt = new Date();
        updateData.dispatchedBy = admin.email;
      }
    }
    
    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes;
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// POST handler for sending dispatch notification
export async function POST(request: Request) {
  try {
    // Check authentication
    const admin = await getAdminFromToken();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Handle different actions
    if (action === 'dispatch-notification') {
      // Send dispatch notification email
      try {
        // Mock implementation - replace with actual email sending
        console.log(`Sending dispatch notification for order ${id}`);
        
        return NextResponse.json({ success: true });
      } catch (emailError) {
        console.error('Error sending dispatch notification email:', emailError);
        return NextResponse.json(
          { error: 'Failed to send dispatch notification email' },
          { status: 500 }
        );
      }
    } else if (action === 'test-result') {
      // Fetch associated test result
      const testResult = await prisma.testResult.findFirst({
        where: {
          orderId: id,
        },
      });

      return NextResponse.json({ result: testResult || null });
    }

    return NextResponse.json(
      { error: 'Invalid action specified' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

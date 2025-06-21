export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminFromToken } from '@/lib/auth';
import { OrderStatus } from '@/types';

// GET handler for fetching a specific order by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const admin = await getAdminFromToken();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin role is already verified by getAdminFromToken

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH handler for updating order details
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('PATCH request received for order:', params.id);
  
  try {
    // Check authentication
    const admin = await getAdminFromToken();
    console.log('Admin authentication result:', admin ? 'Authenticated' : 'Unauthorized');
    
    if (!admin) {
      console.log('Admin authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    console.log('Request body:', body);
    
    const { status, internalNotes } = body;
    console.log('Extracted status:', status, 'internalNotes:', internalNotes);

    // Validate status if provided
    if (status && !Object.values(OrderStatus).includes(status)) {
      console.log('Invalid status provided:', status, 'Valid statuses:', Object.values(OrderStatus));
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
    console.log('Updating order with data:', updateData);
    console.log('Order ID:', params.id);
    
    try {
      const updatedOrder = await prisma.order.update({
        where: { id: params.id },
        data: updateData,
      });
      
      console.log('Order updated successfully:', updatedOrder);
      return NextResponse.json(updatedOrder);
    } catch (dbError: any) {
      console.error('Database error updating order:', dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError?.message || 'Unknown database error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

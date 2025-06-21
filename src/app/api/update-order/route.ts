export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@/types';

// A simplified order update endpoint that doesn't require authentication for testing
export async function POST(request: Request) {
  console.log('⭐ POST /api/update-order - Request received');
  
  try {
    // Parse request body
    const requestText = await request.text();
    console.log('Raw request body:', requestText);
    
    let body;
    try {
      body = JSON.parse(requestText);
      console.log('Parsed request body:', body);
    } catch (parseError) {
      console.error('Failed to parse request body as JSON:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { id, status, internalNotes } = body;
    
    console.log('Update order request parameters:', { id, status, internalNotes });
    
    // Validate required fields
    if (!id) {
      console.warn('Missing required field: id');
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    // Validate status if provided
    if (status && !Object.values(OrderStatus).includes(status)) {
      console.warn(`Invalid status provided: ${status}`);
      return NextResponse.json({ 
        error: `Invalid status provided: ${status}. Valid values are: ${Object.values(OrderStatus).join(', ')}` 
      }, { status: 400 });
    }
    
    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });
    
    if (!existingOrder) {
      console.warn(`Order not found with ID: ${id}`);
      return NextResponse.json({ error: `Order not found with ID: ${id}` }, { status: 404 });
    }
    
    console.log('Found existing order:', existingOrder);
    
    // Prepare update data
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      
      // If status is being set to DISPATCHED, record dispatch info
      if (status === OrderStatus.DISPATCHED) {
        updateData.dispatchedAt = new Date();
        updateData.dispatchedBy = 'admin@example.com'; // Hardcoded for testing
        console.log('Setting dispatch information:', { dispatchedAt: updateData.dispatchedAt, dispatchedBy: updateData.dispatchedBy });
      }
    }
    
    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes;
    }
    
    console.log('Updating order with data:', updateData);
    
    // Update the order
    try {
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: updateData,
      });
      
      console.log('Order updated successfully:', updatedOrder);
      
      // Send dispatch notification if needed
      if (status === OrderStatus.DISPATCHED && existingOrder.status !== OrderStatus.DISPATCHED) {
        console.log('Sending dispatch notification for order:', id);
        // In a real implementation, you would send an email notification here
      }
      
      return NextResponse.json(updatedOrder);
    } catch (dbError: any) {
      console.error('Database error updating order:', dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError?.message || 'Unknown database error'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ 
      error: `Failed to update order: ${error?.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}

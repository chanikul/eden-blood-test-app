import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@/types';

export async function POST(request: Request) {
  console.log('⭐ POST /api/admin/update-status - Request received');
  
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
    
    const { id, status } = body;
    
    console.log('Update status request parameters:', { id, status });
    
    // Validate required fields
    if (!id) {
      console.warn('Missing required field: id');
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    if (!status) {
      console.warn('Missing required field: status');
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }
    
    // Validate status
    const validStatuses = Object.values(OrderStatus);
    console.log('Valid order statuses:', validStatuses);
    
    if (!validStatuses.includes(status)) {
      console.warn(`Invalid status provided: ${status}`);
      return NextResponse.json({ 
        error: `Invalid status provided: ${status}. Valid values are: ${validStatuses.join(', ')}` 
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
    console.log(`Updating order status from ${existingOrder.status} to ${status}`);
    
    // Prepare update data
    const updateData: any = {};
    
    // Convert string status to Prisma enum value (no conversion needed for string enums)
    updateData.status = status;
    console.log('Setting status to:', status);
    
    // If status is being set to DISPATCHED, record dispatch info
    if (status === OrderStatus.DISPATCHED) {
      updateData.dispatchedAt = new Date();
      // Use hardcoded admin email for testing
      updateData.dispatchedBy = 'admin@example.com';
      console.log('Setting dispatch information:', { 
        dispatchedAt: updateData.dispatchedAt, 
        dispatchedBy: updateData.dispatchedBy 
      });
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
      
      return NextResponse.json({
        success: true,
        message: 'Order status updated successfully',
        order: updatedOrder
      });
    } catch (dbError: any) {
      console.error('Database error updating order:', dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError?.message || 'Unknown database error'}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ 
      error: `Failed to update order status: ${error?.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}

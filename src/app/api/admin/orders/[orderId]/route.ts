import { prisma } from '../../../../../lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { sendResultReadyEmail } from '../../../../../lib/email-templates/result-ready-email'
// Using string literal for status since our OrderStatus enum doesn't include 'READY'

export const PATCH = async (request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    const { status, internalNotes } = await request.json()

    // Fetch the current order to check if status is changing to 'ready'
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        patientName: true,
        patientEmail: true,
        testName: true
      }
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Update the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status,
        internalNotes,
        ...(status === 'DISPATCHED' && {
          dispatchedAt: new Date(),
        }),
      },
    })

    // Send email notification if status is changed to 'ready' and wasn't already 'ready'
    if (status === 'READY' && currentOrder.status !== 'READY') {
      try {
        console.log(`Sending result ready notification for order ${orderId} to ${currentOrder.patientEmail}`)
        
        await sendResultReadyEmail({
          email: currentOrder.patientEmail,
          name: currentOrder.patientName,
          testName: currentOrder.testName
        })
        
        console.log('Result ready notification sent successfully')
      } catch (emailError) {
        console.error('Failed to send result ready notification:', emailError)
        // Continue with the response even if email fails
      }
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

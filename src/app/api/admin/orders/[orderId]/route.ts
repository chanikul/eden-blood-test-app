import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    const { status, internalNotes } = await request.json()

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        internalNotes,
        ...(status === 'DISPATCHED' && {
          dispatchedAt: new Date(),
        }),
      },
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

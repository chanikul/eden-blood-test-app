import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

export async function GET() {
  try {
    const [totalOrders, pendingDispatch, dispatched] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: {
          status: OrderStatus.PAID
        },
      }),
      prisma.order.count({
        where: {
          status: OrderStatus.DISPATCHED
        },
      }),
    ])

    return NextResponse.json({
      totalOrders,
      pendingDispatch,
      dispatched,
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json({
      totalOrders: 0,
      pendingDispatch: 0,
      dispatched: 0,
    })
  }
}

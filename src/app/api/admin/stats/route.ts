import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySessionToken } from '../../../../lib/auth'
import { OrderStatus } from '@prisma/client'
import { getPrismaClient } from '../../../../lib/prisma-edge'

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export const GET = async () => {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('eden_admin_token')?.value;
    if (!token || !verifySessionToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the appropriate Prisma client based on the environment
    const prisma = getPrismaClient();
    
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

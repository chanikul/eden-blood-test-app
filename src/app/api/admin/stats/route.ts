import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySessionToken } from '../../../../lib/auth'
// Direct import of PrismaClient
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
import { OrderStatus } from '@prisma/client'

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export const GET = async () {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('eden_admin_token')?.value;
    if (!token || !verifySessionToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
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

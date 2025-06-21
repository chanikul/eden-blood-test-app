'use server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
import { Order } from '@prisma/client'
import { OrdersTable } from '@/components/admin/OrdersTable'
import { OrderFiltersWrapper } from '@/components/admin/OrderFiltersWrapper'
import type { OrderFilters as OrderFiltersType } from '@/components/admin/OrderFilters'
import { startOfDay, endOfDay, parse as parseDate } from 'date-fns'

async function getOrders(filters: OrderFiltersType) {
  const { search, testType, status, dateRange } = filters

  const where: any = {}

  if (search?.trim()) {
    const searchTerm = search.trim()
    where.OR = [
      { patientName: { contains: searchTerm, mode: 'insensitive' } },
      { patientEmail: { contains: searchTerm, mode: 'insensitive' } },
    ]
  }

  if (testType?.trim()) {
    where.testName = { contains: testType.trim(), mode: 'insensitive' }
  }

  if (status?.trim()) {
    where.status = status.trim() // Status is an enum, no need for case-insensitive comparison
  }

  if (dateRange.start && dateRange.end) {
    where.createdAt = {
      gte: startOfDay(dateRange.start),
      lte: endOfDay(dateRange.end),
    }
  }

  const rawOrders = await prisma.order.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
  })

  const orders = rawOrders.map(order => {
    let parsedShippingAddress = null;
    if (order.shippingAddress) {
      try {
        console.log('Raw shipping address for order', order.id, ':', order.shippingAddress);
        if (typeof order.shippingAddress === 'object') {
          parsedShippingAddress = order.shippingAddress;
        } else {
          parsedShippingAddress = JSON.parse(order.shippingAddress as string);
        }
      } catch (e) {
        console.error('Error parsing shipping address for order', order.id, ':', e);
        console.error('Raw value:', order.shippingAddress);
      }
    }
    return {
      ...order,
      shippingAddress: parsedShippingAddress
    };
  });
  
  console.log('Found orders:', orders.length);
  return orders;
}

function parseQueryParams(searchParams: URLSearchParams): OrderFiltersType {
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  return {
    search: searchParams.get('search') || '',
    testType: searchParams.get('testType') || '',
    status: searchParams.get('status') || '',
    dateRange: {
      start: startDate ? parseDate(startDate, 'yyyy-MM-dd', new Date()) : null,
      end: endDate ? parseDate(endDate, 'yyyy-MM-dd', new Date()) : null,
    },
  }
}

function buildQueryString(filters: OrderFiltersType): string {
  const params = new URLSearchParams()

  if (filters.search) params.set('search', filters.search)
  if (filters.testType) params.set('testType', filters.testType)
  if (filters.status) params.set('status', filters.status)
  if (filters.dateRange.start) {
    params.set(
      'startDate',
      filters.dateRange.start.toISOString().split('T')[0]
    )
  }
  if (filters.dateRange.end) {
    params.set('endDate', filters.dateRange.end.toISOString().split('T')[0])
  }

  return params.toString()
}

const defaultFilters: OrderFiltersType = {
  search: '',
  testType: '',
  status: '',
  dateRange: {
    start: null,
    end: null,
  },
}

type SearchParams = { [key: string]: string | string[] | undefined }


export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = searchParams
  const filters = {
    search: params.search as string || '',
    testType: params.testType as string || '',
    status: params.status as string || '',
    dateRange: {
      start: params.startDate ? parseDate(params.startDate as string, 'yyyy-MM-dd', new Date()) : null,
      end: params.endDate ? parseDate(params.endDate as string, 'yyyy-MM-dd', new Date()) : null,
    },
  }

  console.log('Fetching orders with filters:', filters);
  const orders = await getOrders(filters)
  console.log('Found orders:', orders.length);

  // Get all unique test types from the database
  const allTestTypes = await prisma.order.findMany({
    select: { testName: true },
    distinct: ['testName'],
    orderBy: { testName: 'asc' },
  })
  const testTypes = allTestTypes.map(order => order.testName)
  console.log('Test types:', testTypes);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-800">Orders</h1>
      </div>
      <OrderFiltersWrapper
        testTypes={testTypes}
        initialFilters={filters}
      />
      {orders.length > 0 ? (
        <OrdersTable orders={orders} />
      ) : (
        <div className="bg-white shadow-sm rounded-lg p-8 text-center">
          <p className="text-gray-600 text-lg">
            No orders found. Try adjusting your filters.
          </p>
        </div>
      )}
    </div>
  )
}

import { SyncStripeButton } from '@/components/admin/SyncStripeButton'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { Order, OrderStatus } from '@prisma/client'

type RecentOrder = Pick<Order, 'id' | 'patientName' | 'testName' | 'status' | 'createdAt'>

export const metadata = {
  title: 'Admin Dashboard | Eden Clinic',
  description: 'Admin dashboard for managing blood test orders and users'
}

// This ensures fresh data on each request
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getRecentOrders() {
  return await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      patientName: true,
      testName: true,
      status: true,
      createdAt: true
    }
  })
}

async function getBloodTestStats() {
  const stats = await prisma.order.groupBy({
    by: ['status'],
    _count: true
  })
  
  return stats.reduce((acc, curr) => {
    acc[curr.status] = curr._count
    return acc
  }, {} as Record<string, number>)
}

async function getUserCount() {
  // Since we're using Stripe for authentication, we'll count orders with unique emails
  const uniqueUsers = await prisma.order.groupBy({
    by: ['patientEmail'],
    _count: true
  })
  return uniqueUsers.length
}

export default async function AdminDashboard() {
  const [recentOrders, bloodTestStats, userCount] = await Promise.all([
    getRecentOrders(),
    getBloodTestStats(),
    getUserCount()
  ])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-800">Dashboard</h1>
        <SyncStripeButton />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {recentOrders.map((order: RecentOrder) => (
              <div key={order.id} className="text-sm border-b pb-2">
                <div className="flex justify-between">
                  <span className="font-medium">{order.patientName}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>{order.status}</span>
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  {order.testName} • {format(new Date(order.createdAt), 'MMM d, yyyy')}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Blood Tests</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="font-medium">{bloodTestStats['PENDING'] || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Paid</span>
              <span className="font-medium">{bloodTestStats['PAID'] || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Dispatched</span>
              <span className="font-medium">{bloodTestStats['DISPATCHED'] || 0}</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Users</h3>
          <div className="text-3xl font-bold text-gray-700">{userCount}</div>
          <p className="text-sm text-gray-500 mt-1">Total registered users</p>
        </div>
      </div>
    </div>
  )
}

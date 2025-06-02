// Dynamic product loading from Stripe via /api/products - no manual sync needed
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
  try {
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
  } catch (error) {
    console.error('Error fetching recent orders:', error)
    return []
  }
}

async function getBloodTestStats() {
  try {
    const stats = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    })
    
    return stats.reduce((acc, curr) => {
      acc[curr.status] = curr._count
      return acc
    }, {} as Record<string, number>)
  } catch (error) {
    console.error('Error fetching blood test stats:', error)
    return {}
  }
}

async function getUserCount() {
  try {
    const uniqueUsers = await prisma.order.groupBy({
      by: ['patientEmail'],
      _count: true
    })
    return uniqueUsers.length
  } catch (error) {
    console.error('Error fetching user count:', error)
    return 0
  }
}

export default async function AdminDashboard() {
  try {
    const [recentOrders, stats, userCount] = await Promise.all([
      getRecentOrders(),
      getBloodTestStats(),
      getUserCount(),
    ])

    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Total Orders</h2>
            <p className="text-3xl font-bold">
              {Object.values(stats).reduce((a, b) => a + b, 0)}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Active Users</h2>
            <p className="text-3xl font-bold">{userCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">ID</th>
                    <th className="text-left py-2">Patient</th>
                    <th className="text-left py-2">Test</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">{order.id}</td>
                      <td className="py-2">{order.patientName}</td>
                      <td className="py-2">{order.testName}</td>
                      <td className="py-2">
                        <span className={`inline-block px-2 py-1 rounded text-sm ${
                          order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2">{format(order.createdAt, 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No orders yet. They will appear here when customers place orders.</p>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in AdminDashboard:', error)
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    )
  }
}

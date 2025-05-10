import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

export default async function AdminDashboard() {
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

  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-gray-700 text-sm font-medium">Total Orders</h3>
          <p className="text-3xl font-semibold text-gray-800 mt-2">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-gray-700 text-sm font-medium">Pending Dispatch</h3>
          <p className="text-3xl font-semibold text-orange-700 mt-2">{pendingDispatch}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-gray-700 text-sm font-medium">Dispatched</h3>
          <p className="text-3xl font-semibold text-green-700 mt-2">{dispatched}</p>
        </div>
      </div>
    </div>
  )
}

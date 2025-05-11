'use client'

import { useEffect, useState } from 'react'
import { OrderStatus } from '@prisma/client'

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingDispatch: 0,
    dispatched: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-gray-700 text-sm font-medium">Total Orders</h3>
        <p className="text-3xl font-semibold text-gray-800 mt-2">{stats.totalOrders}</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-gray-700 text-sm font-medium">Pending Dispatch</h3>
        <p className="text-3xl font-semibold text-orange-700 mt-2">{stats.pendingDispatch}</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-gray-700 text-sm font-medium">Dispatched</h3>
        <p className="text-3xl font-semibold text-green-700 mt-2">{stats.dispatched}</p>
      </div>
    </div>
  )
}

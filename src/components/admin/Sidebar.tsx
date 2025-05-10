'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-50 shadow-md">
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-900">Eden Clinic</h2>
        <p className="text-sm text-gray-800 font-medium">Admin Dashboard</p>
      </div>
      <nav className="mt-6">
        <Link
          href="/admin"
          className={`flex items-center px-6 py-3 text-gray-800 font-medium ${
            pathname === '/admin'
              ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700 font-semibold'
              : 'hover:bg-gray-50'
          }`}
        >
          <span className="mx-4">Dashboard</span>
        </Link>
        <Link
          href="/admin/orders"
          className={`flex items-center px-6 py-3 text-gray-800 font-medium ${
            pathname === '/admin/orders'
              ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700 font-semibold'
              : 'hover:bg-gray-50'
          }`}
        >
          <span className="mx-4">Orders</span>
        </Link>
      </nav>
    </aside>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Logout failed')
      }

      window.location.href = '/admin/login'
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <aside className="w-64 bg-gray-50 shadow-md flex flex-col h-screen">
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-900">Eden Clinic</h2>
        <p className="text-sm text-gray-800 font-medium">Admin Dashboard</p>
      </div>
      <nav className="flex-1">
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
        <Link
          href="/admin/users"
          className={`flex items-center px-6 py-3 text-gray-800 font-medium ${
            pathname === '/admin/users'
              ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700 font-semibold'
              : 'hover:bg-gray-50'
          }`}
        >
          <span className="mx-4">Users</span>
        </Link>
        <Link
          href="/admin/test-results"
          className={`flex items-center px-6 py-3 text-gray-800 font-medium ${
            pathname && pathname.startsWith('/admin/test-results')
              ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700 font-semibold'
              : 'hover:bg-gray-50'
          }`}
        >
          <span className="mx-4">Test Results</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 shadow-sm"
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </aside>
  )
}

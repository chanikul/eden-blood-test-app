'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/storage'

type UserInfo = {
  email: string;
  name?: string;
  role?: string;
}

export function Sidebar() {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  // Fetch user info on component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // In development mode, use a placeholder
        if (process.env.NODE_ENV === 'development') {
          setUserInfo({
            email: 'admin@edenclinicformen.com',
            name: 'Admin User',
            role: 'SUPER_ADMIN'
          })
          return
        }

        const response = await fetch('/api/auth/check')
        if (!response.ok) return
        
        const data = await response.json()
        if (data.user) {
          setUserInfo(data.user)
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
      }
    }

    fetchUserInfo()
  }, [])

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    try {
      // Sign out from Supabase (for Google auth)
      const supabaseClient = getSupabaseClient()
      await supabaseClient.auth.signOut()
      
      // Also sign out from our custom auth system
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

  // Format email for display
  const formatEmail = (email: string) => {
    if (email.length > 20) {
      return email.substring(0, 17) + '...'
    }
    return email
  }

  return (
    <aside className="w-64 bg-gray-50 shadow-md flex flex-col h-screen">
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-900">Eden Clinic</h2>
        <p className="text-sm text-gray-800 font-medium">Admin Dashboard</p>
      </div>
      
      {/* User info section */}
      {userInfo && (
        <div className="px-6 py-3 border-b border-gray-200 mb-2">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
              {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : userInfo.email.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              {userInfo.name && <p className="text-sm font-medium truncate">{userInfo.name}</p>}
              <p className="text-xs text-gray-500 truncate" title={userInfo.email}>
                {formatEmail(userInfo.email)}
              </p>
            </div>
          </div>
          {userInfo.role && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {userInfo.role.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
      )}
      
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
        
        {/* Only show Google Users link for SUPER_ADMIN users */}
        {userInfo?.role === 'SUPER_ADMIN' && (
          <Link
            href="/admin/google-users"
            className={`flex items-center px-6 py-3 text-gray-800 font-medium ${
              pathname === '/admin/google-users'
                ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700 font-semibold'
                : 'hover:bg-gray-50'
            }`}
          >
            <span className="mx-4">Google Users</span>
          </Link>
        )}
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

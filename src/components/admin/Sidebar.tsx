'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getSupabaseClient } from '../../lib/supabase-client'

// Vitalis Nexus brand colors
const VITALIS_BLUE = '#0057B8'
const NEXUS_AQUA = '#00ADEF'
const CLOUD_GREY = '#F5F7FA'

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
    <aside className="w-64 bg-white shadow-md flex flex-col h-screen">
      <div className="p-6" style={{ backgroundColor: VITALIS_BLUE, color: 'white' }}>
        <h2 className="text-2xl font-semibold">Eden Clinic</h2>
        <p className="text-sm font-medium opacity-90">Admin Dashboard</p>
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
        {/* Primary Navigation Group */}
        <div>
          <Link
            href="/admin"
            className={`flex items-center px-6 py-3 text-gray-800 font-medium ${
              pathname === '/admin'
                ? `bg-${CLOUD_GREY} border-r-4 border-[${VITALIS_BLUE}] text-[${VITALIS_BLUE}] font-semibold`
                : 'hover:bg-gray-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Dashboard</span>
          </Link>
          
          <Link
            href="/admin/orders"
            className={`flex items-center px-6 py-3 text-gray-800 font-medium ${
              pathname === '/admin/orders'
                ? `bg-${CLOUD_GREY} border-r-4 border-[${VITALIS_BLUE}] text-[${VITALIS_BLUE}] font-semibold`
                : 'hover:bg-gray-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>Orders</span>
          </Link>
          
          <Link
            href="/admin/test-results"
            className={`flex items-center px-6 py-3 text-gray-800 font-medium ${
              pathname && pathname.startsWith('/admin/test-results')
                ? `bg-${CLOUD_GREY} border-r-4 border-[${VITALIS_BLUE}] text-[${VITALIS_BLUE}] font-semibold`
                : 'hover:bg-gray-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Test Results</span>
          </Link>
          
          <Link
            href="/admin/clients"
            className={`flex items-center px-6 py-3 text-gray-800 font-medium ${
              pathname && pathname.startsWith('/admin/clients')
                ? `bg-${CLOUD_GREY} border-r-4 border-[${VITALIS_BLUE}] text-[${VITALIS_BLUE}] font-semibold`
                : 'hover:bg-gray-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Clients</span>
          </Link>

          <Link
            href="/admin/audit-logs"
            className={`flex items-center px-6 py-3 text-gray-800 font-medium ${
              pathname === '/admin/audit-logs'
                ? `bg-${CLOUD_GREY} border-r-4 border-[${VITALIS_BLUE}] text-[${VITALIS_BLUE}] font-semibold`
                : 'hover:bg-gray-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Audit Logs</span>
          </Link>
        </div>

        {/* Divider */}
        <div className="my-2 border-t border-gray-200"></div>

        {/* Secondary Navigation Group */}
        <div>
          <Link
            href="/admin/users"
            className={`flex items-center px-6 py-3 text-gray-800 font-medium ${
              pathname === '/admin/users'
                ? `bg-${CLOUD_GREY} border-r-4 border-[${VITALIS_BLUE}] text-[${VITALIS_BLUE}] font-semibold`
                : 'hover:bg-gray-50'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Users</span>
          </Link>
          
          {/* Only show Google Users link for SUPER_ADMIN users */}
          {userInfo?.role === 'SUPER_ADMIN' && (
            <Link
              href="/admin/google-users"
              className={`flex items-center px-6 py-3 text-gray-800 font-medium ${
                pathname === '/admin/google-users'
                  ? `bg-${CLOUD_GREY} border-r-4 border-[${VITALIS_BLUE}] text-[${VITALIS_BLUE}] font-semibold`
                  : 'hover:bg-gray-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span>Google Users</span>
            </Link>
          )}
        </div>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </aside>
  )
}

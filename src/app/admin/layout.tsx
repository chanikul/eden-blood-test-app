'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/admin/Sidebar'
import { usePathname, useRouter } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function checkAuth() {
      if (pathname === '/admin/login') {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/check', {
          // Prevent caching of the auth check
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })

        if (!response.ok) {
          throw new Error('Not authenticated')
        }

        if (mounted) {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        if (mounted && pathname !== '/admin/login') {
          router.replace('/admin/login')
        }
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      mounted = false
    }
  }, [pathname, router])

  // Return children directly for login page
  if (pathname === '/admin/login') {
    return children
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <div className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <h1 className="text-xl font-semibold text-gray-900">
                      Eden Clinic Admin
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}

'use client'

import { Sidebar } from '@/components/admin/Sidebar'
import { usePathname } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Return children directly for login page
  if (pathname === '/admin/login') {
    return children
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

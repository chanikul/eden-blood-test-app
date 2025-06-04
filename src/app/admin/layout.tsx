'use client'

import { Sidebar } from '@/components/admin/Sidebar'
import { usePathname } from 'next/navigation'

// Admin layout with simplified structure to avoid rendering issues
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Return login page without any layout wrapper
  if (pathname === '/admin/login') {
    return <>{children}</>
  }
  
  // Simplified layout structure
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        {/* Sidebar navigation */}
        <Sidebar />
        
        {/* Main content area - simplified structure */}
        <div className="flex-1 overflow-auto p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Eden Clinic Admin</h1>
          <div className="container">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

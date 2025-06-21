'use client'

import { Sidebar } from '@/components/admin/Sidebar'
import { usePathname } from 'next/navigation'
import { SafeAuthGuard } from '@/components/admin/SafeAuthGuard'
import DebugBanner from '@/components/admin/DebugBanner'
// Vitalis Nexus brand colors
const VITALIS_BLUE = '#0057B8'
const NEXUS_AQUA = '#00ADEF'
const CLOUD_GREY = '#F5F7FA'

// Admin layout with SafeAuthGuard to prevent React crashes when session is null
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Return login page without any layout wrapper or auth guard
  if (pathname === '/admin/login') {
    return <>{children}</>
  }
  
  // Wrap all other admin pages with SafeAuthGuard
  return (
    <SafeAuthGuard>
      <div className="min-h-screen" style={{ backgroundColor: CLOUD_GREY }}>
        <DebugBanner isAdmin={true} />
        <div className="flex h-screen">
          {/* Sidebar navigation */}
          <Sidebar />
          
          {/* Main content area - simplified structure */}
          <div className="flex-1 overflow-auto p-6">
            <h1 className="text-2xl font-semibold mb-6" style={{ color: VITALIS_BLUE }}>Eden Clinic Admin</h1>
            <div className="container">
              {children}
            </div>
          </div>
        </div>
      </div>
    </SafeAuthGuard>
  )
}

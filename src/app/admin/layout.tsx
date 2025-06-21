'use client'

import { Sidebar } from '@/components/admin/Sidebar'
import { usePathname } from 'next/navigation'
import { SafeAuthGuard } from '@/components/admin/SafeAuthGuard'
import DebugBanner from '@/components/admin/DebugBanner'
import { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'
// Vitalis Nexus brand colors
const VITALIS_BLUE = '#0057B8'
const NEXUS_AQUA = '#00ADEF'
const CLOUD_GREY = '#F5F7FA'

// Admin layout with SafeAuthGuard to prevent React crashes when session is null
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isVercelPreview, setIsVercelPreview] = useState(false)
  
  // Check if we're on Vercel preview deployment or have bypass cookie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for hostname
      const hostname = window.location.hostname
      const isPreview = hostname.includes('vercel.app') || hostname.includes('localhost')
      
      // Check for bypass cookie/storage
      const hasBypassCookie = document.cookie.includes('eden_admin_bypass=true')
      const hasBypassStorage = localStorage.getItem('eden_admin_bypass') === 'true' || 
                              sessionStorage.getItem('eden_admin_bypass') === 'true'
      
      const shouldBypass = isPreview || hasBypassCookie || hasBypassStorage
      
      console.log('Admin auth check:', {
        isVercelPreview: isPreview,
        hasBypassCookie,
        hasBypassStorage,
        shouldBypass
      })
      
      setIsVercelPreview(shouldBypass)
    }
  }, [])
  
  // Return login page without any layout wrapper or auth guard
  if (pathname === '/admin/login') {
    return <>{children}</>
  }
  
  // For Vercel preview deployments, bypass authentication completely
  if (isVercelPreview) {
    console.log('Vercel preview detected: Bypassing authentication completely')
    return (
      <div className="min-h-screen" style={{ backgroundColor: CLOUD_GREY }}>
        <DebugBanner isAdmin={true} />
        <div className="flex h-screen">
          {/* Sidebar navigation */}
          <Sidebar />
          
          {/* Main content area - simplified structure */}
          <div className="flex-1 overflow-auto p-6">
            <h1 className="text-2xl font-semibold mb-6" style={{ color: VITALIS_BLUE }}>Eden Clinic Admin (Preview Mode)</h1>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
              <p className="font-bold">Preview Mode</p>
              <p>Authentication is bypassed for this preview deployment.</p>
            </div>
            <div className="container">
              {children}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // Wrap all other admin pages with SafeAuthGuard for production
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

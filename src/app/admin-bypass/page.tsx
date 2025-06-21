'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminBypass() {
  const router = useRouter()
  const [message, setMessage] = useState('Initializing admin bypass...')
  
  useEffect(() => {
    // Create a session cookie or localStorage item to indicate bypass
    try {
      localStorage.setItem('eden_admin_bypass', 'true')
      sessionStorage.setItem('eden_admin_bypass', 'true')
      document.cookie = 'eden_admin_bypass=true; path=/; max-age=3600'
      setMessage('Admin bypass activated. Redirecting to admin dashboard...')
      
      // Short delay to ensure cookie is set
      setTimeout(() => {
        router.push('/admin')
      }, 1000)
    } catch (error) {
      console.error('Failed to set bypass:', error)
      setMessage('Error setting admin bypass. Please try again.')
    }
  }, [router])
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">Eden Clinic Admin Bypass</h1>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <p className="text-blue-700">{message}</p>
        </div>
        <p className="text-gray-600 mb-4">
          This page sets up a temporary admin bypass for development and testing purposes.
        </p>
        <button 
          onClick={() => router.push('/admin')}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Go to Admin Dashboard
        </button>
      </div>
    </div>
  )
}

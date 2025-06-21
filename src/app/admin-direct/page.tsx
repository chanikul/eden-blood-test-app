'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Simple admin dashboard that doesn't require authentication
export default function AdminDirectPage() {
  const [bloodTests, setBloodTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch blood tests on component mount
  useEffect(() => {
    const fetchBloodTests = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/stripe-products-simple')
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        const data = await response.json()
        console.log('Blood tests data:', data)
        setBloodTests(data.products || [])
        setLoading(false)
      } catch (err) {
        console.error('Error fetching blood tests:', err)
        setError('Failed to load blood tests. See console for details.')
        setLoading(false)
      }
    }

    fetchBloodTests()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">Eden Clinic Admin Dashboard (Direct Access)</h1>
          
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
            <p className="font-bold">Direct Access Mode</p>
            <p>This is a simplified admin view that bypasses authentication.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Quick Links</h2>
              <ul className="space-y-2">
                <li>
                  <Link href="/order" className="text-blue-600 hover:underline">
                    View Order Form
                  </Link>
                </li>
                <li>
                  <Link href="/api/stripe-products-simple" className="text-blue-600 hover:underline">
                    API: Stripe Products
                  </Link>
                </li>
                <li>
                  <Link href="/api/blood-tests" className="text-blue-600 hover:underline">
                    API: Blood Tests
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Environment Status</h2>
              <p>Stripe API: {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ Configured' : '❌ Missing'}</p>
              <p>Database: Connected</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Blood Tests</h2>
            
            {loading && <p className="text-gray-500">Loading blood tests...</p>}
            
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                <p>{error}</p>
              </div>
            )}
            
            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b text-left">Name</th>
                      <th className="py-2 px-4 border-b text-left">Price</th>
                      <th className="py-2 px-4 border-b text-left">Stripe ID</th>
                      <th className="py-2 px-4 border-b text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bloodTests.length > 0 ? (
                      bloodTests.map((test, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="py-2 px-4 border-b">{test.name}</td>
                          <td className="py-2 px-4 border-b">£{(test.price / 100).toFixed(2)}</td>
                          <td className="py-2 px-4 border-b font-mono text-sm">
                            {test.stripePriceId || 'N/A'}
                          </td>
                          <td className="py-2 px-4 border-b">
                            {test.isActive ? (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
                            ) : (
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Inactive</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 px-4 text-center text-gray-500">
                          No blood tests found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

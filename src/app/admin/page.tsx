// Dynamic product loading from Stripe via /api/products - no manual sync needed
import { prisma } from '@/lib/prisma'
import { format, startOfMonth } from 'date-fns'
import { Order, OrderStatus } from '@prisma/client'
import { withDevFallback, MOCK_DATA } from '@/lib/dev-fallback'

// Vitalis Nexus brand colors
const VITALIS_BLUE = '#0057B8'
const NEXUS_AQUA = '#00ADEF'
const CLOUD_GREY = '#F5F7FA'
const GRAPHITE_SLATE = '#4A5568'
const INSIGHT_GOLD = '#F6AD55'

// Using Inter font via CSS class instead of next/font

type RecentOrder = Pick<Order, 'id' | 'patientName' | 'testName' | 'status' | 'createdAt'>

export const metadata = {
  title: 'Admin Dashboard | Eden Clinic',
  description: 'Admin dashboard for managing blood test orders and users'
}

// This ensures fresh data on each request
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getRecentOrders() {
  try {
    return await withDevFallback(
      async () => prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          patientName: true,
          testName: true,
          status: true,
          createdAt: true
        }
      }),
      MOCK_DATA.orders
    );
  } catch (error) {
    console.error('Error fetching recent orders:', error)
    return []
  }
}

async function getBloodTestStats() {
  try {
    return await withDevFallback(
      async () => {
        const stats = await prisma.order.groupBy({
          by: ['status'],
          _count: true
        })
        
        return stats.reduce((acc, curr) => {
          acc[curr.status] = curr._count
          return acc
        }, {} as Record<string, number>)
      },
      { bloodTests: MOCK_DATA.stats.bloodTests }
    )
  } catch (error) {
    console.error('Error fetching blood test stats:', error)
    return {}
  }
}

async function getMonthlyOrders() {
  try {
    return await withDevFallback(
      async () => {
        const startOfCurrentMonth = startOfMonth(new Date());
        
        return await prisma.order.count({
          where: {
            createdAt: {
              gte: startOfCurrentMonth,
            },
          },
        });
      },
      MOCK_DATA.stats.monthlyOrders
    );
  } catch (error) {
    console.error('Error fetching monthly orders:', error);
    return 0;
  }
}

async function getTestsInProgress() {
  try {
    return await withDevFallback(
      async () => {
        return await prisma.testResult.count({
          where: {
            status: 'processing',
          },
        });
      },
      MOCK_DATA.stats.testsInProgress
    );
  } catch (error) {
    console.error('Error fetching tests in progress:', error);
    return 0;
  }
}

async function getCompletedTests() {
  try {
    return await withDevFallback(
      async () => {
        return await prisma.testResult.count({
          where: {
            status: 'ready',
          },
        });
      },
      MOCK_DATA.stats.completedTests
    );
  } catch (error) {
    console.error('Error fetching completed tests:', error);
    return 0;
  }
}

async function getPendingActions() {
  try {
    return await withDevFallback(
      async () => {
        // Orders that need kit dispatch
        const pendingDispatch = await prisma.order.findMany({
          where: {
            status: 'PAID'
          },
          select: {
            id: true,
            patientName: true,
            testName: true,
            createdAt: true
          },
          take: 3,
          orderBy: { createdAt: 'asc' }
        })
        
        // Test results that need review
        const pendingReview = await prisma.testResult.findMany({
          where: {
            status: 'processing'
          },
          select: {
            id: true,
            clientId: true,
            orderId: true,
            createdAt: true,
            client: {
              select: {
                name: true
              }
            },
            order: {
              select: {
                testName: true
              }
            }
          },
          take: 3,
          orderBy: { createdAt: 'asc' }
        })
        
        return {
          pendingDispatch,
          pendingReview
        }
      },
      {
        pendingDispatch: MOCK_DATA.stats.pendingActions.pendingDispatch,
        pendingReview: MOCK_DATA.stats.pendingActions.pendingReview
      }
    )
  } catch (error) {
    console.error('Error fetching pending actions:', error)
    return { pendingDispatch: [], pendingReview: [] }
  }
}

async function getUserCount() {
  try {
    return await withDevFallback(
      async () => {
        const uniqueUsers = await prisma.order.groupBy({
          by: ['patientEmail'],
          _count: true
        })
        return uniqueUsers.length
      },
      MOCK_DATA.stats.userCount
    )
  } catch (error) {
    console.error('Error fetching user count:', error)
    return 0
  }
}

export default async function AdminDashboard() {
  try {
    const [
      recentOrders, 
      stats, 
      userCount, 
      monthlyOrders, 
      testsInProgress, 
      completedTests,
      pendingActions
    ] = await Promise.all([
      getRecentOrders(),
      getBloodTestStats(),
      getUserCount(),
      getMonthlyOrders(),
      getTestsInProgress(),
      getCompletedTests(),
      getPendingActions()
    ])

    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8" style={{ color: VITALIS_BLUE }}>Admin Dashboard</h1>
        
        {/* Three Primary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Monthly Orders Card */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100" style={{ borderRadius: '16px' }}>
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full" style={{ backgroundColor: CLOUD_GREY }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={VITALIS_BLUE} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold ml-3" style={{ color: GRAPHITE_SLATE }}>Monthly Orders</h2>
            </div>
            <p className="text-3xl font-bold" style={{ color: VITALIS_BLUE }}>
              {monthlyOrders}
            </p>
            <p className="text-sm mt-2 text-gray-500">New orders this month</p>
          </div>
          
          {/* Tests in Progress Card */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100" style={{ borderRadius: '16px' }}>
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full" style={{ backgroundColor: CLOUD_GREY }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={NEXUS_AQUA} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold ml-3" style={{ color: GRAPHITE_SLATE }}>Tests in Progress</h2>
            </div>
            <p className="text-3xl font-bold" style={{ color: NEXUS_AQUA }}>
              {testsInProgress}
            </p>
            <p className="text-sm mt-2 text-gray-500">Kits dispatched, awaiting results</p>
          </div>
          
          {/* Completed Tests Card */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100" style={{ borderRadius: '16px' }}>
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full" style={{ backgroundColor: CLOUD_GREY }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="#4CAF50" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold ml-3" style={{ color: GRAPHITE_SLATE }}>Completed Tests</h2>
            </div>
            <p className="text-3xl font-bold" style={{ color: '#4CAF50' }}>
              {completedTests}
            </p>
            <p className="text-sm mt-2 text-gray-500">Results reviewed or approved</p>
          </div>
        </div>

        {/* Two-column layout for To-Do Panel and Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* To-Do Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 mb-8">
              <h2 className="text-xl font-semibold mb-4" style={{ color: GRAPHITE_SLATE }}>To-Do Panel</h2>
              
              {/* Pending Dispatches */}
              {pendingActions.pendingDispatch.length > 0 ? (
                <div className="space-y-4 mb-6">
                  <h3 className="text-md font-medium text-gray-700">Kits to Dispatch</h3>
                  {pendingActions.pendingDispatch.map((order: any) => (
                    <div key={order.id} className="border-l-4 pl-4 py-2" style={{ borderColor: INSIGHT_GOLD }}>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke={INSIGHT_GOLD} strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span className="font-medium">Dispatch kit to {order.patientName}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{order.testName}</div>
                      <div className="text-xs text-gray-400 mt-1">Ordered {format(order.createdAt, 'MMM d, yyyy')}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-6 text-gray-500">No kits pending dispatch</div>
              )}
              
              {/* Results to Review */}
              {pendingActions.pendingReview.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-700">Results to Review</h3>
                  {pendingActions.pendingReview.map((result: any) => (
                    <div key={result.id} className="border-l-4 pl-4 py-2" style={{ borderColor: '#4CAF50' }}>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="#4CAF50" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium">Review results for {result.client?.name}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{result.order?.testName}</div>
                      <div className="text-xs text-gray-400 mt-1">Uploaded {format(result.createdAt, 'MMM d, yyyy')}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No results pending review</div>
              )}
            </div>
          </div>
          
          {/* Recent Orders Table */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100" style={{ backgroundColor: CLOUD_GREY }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: GRAPHITE_SLATE }}>Recent Orders</h2>
              {recentOrders.length > 0 ? (
                <div className="overflow-x-auto bg-white rounded-xl">
                  <table className="min-w-full">
                    <thead>
                      <tr style={{ backgroundColor: CLOUD_GREY }}>
                        <th className="text-left py-3 px-4 font-medium" style={{ color: GRAPHITE_SLATE }}>ID</th>
                        <th className="text-left py-3 px-4 font-medium" style={{ color: GRAPHITE_SLATE }}>Patient</th>
                        <th className="text-left py-3 px-4 font-medium" style={{ color: GRAPHITE_SLATE }}>Test</th>
                        <th className="text-left py-3 px-4 font-medium" style={{ color: GRAPHITE_SLATE }}>Status</th>
                        <th className="text-left py-3 px-4 font-medium" style={{ color: GRAPHITE_SLATE }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order: any) => (
                        <tr key={order.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{order.id}</td>
                          <td className="py-3 px-4">{order.patientName}</td>
                          <td className="py-3 px-4">{order.testName}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                              order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'DISPATCHED' ? 'bg-blue-400 text-white' :
                              order.status === 'READY' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`} style={order.status === 'DISPATCHED' ? { backgroundColor: NEXUS_AQUA } : {}}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">{format(order.createdAt, 'MMM d, yyyy')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 bg-white p-4 rounded-xl">No orders yet. They will appear here when customers place orders.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error in AdminDashboard:', error)
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    )
  }
}

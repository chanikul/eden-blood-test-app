import { SyncStripeButton } from '@/components/admin/SyncStripeButton'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { Order, OrderStatus } from '@prisma/client'

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
    return await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        patientName: true,
        testName: true,
        status: true,
        createdAt: true
      }
    })
  } catch (error) {
    console.error('Error fetching recent orders:', error)
    return []
  }
}

async function getBloodTestStats() {
  try {
    // Use the correct Prisma syntax for grouping and counting
    const stats = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })
    
    console.log('Order stats by status:', stats)
    
    return stats.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status
      return acc
    }, {} as Record<string, number>)
  } catch (error) {
    console.error('Error fetching blood test stats:', error)
    return {}
  }
}

async function getUserCount() {
  try {
    // Use countDistinct for more reliable unique user counting
    const uniqueUsers = await prisma.order.findMany({
      distinct: ['patientEmail'],
      select: {
        patientEmail: true
      }
    })
    
    console.log('Unique users count:', uniqueUsers.length)
    return uniqueUsers.length
  } catch (error) {
    console.error('Error fetching user count:', error)
    return 0
  }
}

export default async function AdminDashboard() {
  // Fetch data with individual error handling for each source
  let recentOrders: RecentOrder[] = [];
  let stats: Record<string, number> = {};
  let userCount = 0;
  let errorMessages: string[] = [];
  
  try {
    // Verify database connection is working
    console.log('Verifying database connection...');
    try {
      await prisma.$queryRaw`SELECT 1 as connection_test`;
      console.log('✅ Database connection verified for admin dashboard');
    } catch (connError) {
      const errorMessage = connError instanceof Error 
        ? `Database connection error: ${connError.message}` 
        : 'Unknown database connection error';
      console.error('❌ ' + errorMessage, connError);
      errorMessages.push(errorMessage);
      throw connError; // Re-throw to skip data fetching
    }

    // Fetch recent orders
    try {
      recentOrders = await getRecentOrders();
      console.log('Successfully fetched recent orders:', recentOrders.length);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `Error fetching recent orders: ${error.message}` 
        : 'Unknown error fetching recent orders';
      console.error('❌ ' + errorMessage, error);
      errorMessages.push(errorMessage);
    }
    
    // Fetch blood test stats
    try {
      stats = await getBloodTestStats();
      console.log('Successfully fetched blood test stats:', stats);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `Error fetching blood test stats: ${error.message}` 
        : 'Unknown error fetching blood test stats';
      console.error('❌ ' + errorMessage, error);
      errorMessages.push(errorMessage);
    }
    
    // Fetch user count
    try {
      userCount = await getUserCount();
      console.log('Successfully fetched user count:', userCount);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `Error fetching user count: ${error.message}` 
        : 'Unknown error fetching user count';
      console.error('❌ ' + errorMessage, error);
      errorMessages.push(errorMessage);
    }

    // If we have errors but have gotten this far, display them in console
    if (errorMessages.length > 0) {
      console.error('Dashboard loaded with errors:', errorMessages);
    }
    
    // Render dashboard with available data (some sections may show default values if errors occurred)
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        {errorMessages.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 mb-6 rounded-lg">
            <h3 className="font-semibold mb-2">Dashboard Errors</h3>
            <ul className="list-disc pl-5">
              {errorMessages.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Total Orders</h2>
            <p className="text-3xl font-bold">
              {Object.values(stats).reduce((a: number, b: number) => a + b, 0)}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Active Users</h2>
            <p className="text-3xl font-bold">{userCount}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Sync Stripe Data</h2>
            <SyncStripeButton />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">ID</th>
                    <th className="text-left py-2">Patient</th>
                    <th className="text-left py-2">Test</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">{order.id}</td>
                      <td className="py-2">{order.patientName}</td>
                      <td className="py-2">{order.testName}</td>
                      <td className="py-2">
                        <span className={`inline-block px-2 py-1 rounded text-sm ${
                          order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2">{format(order.createdAt, 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No orders yet. They will appear here when customers place orders.</p>
          )}
        </div>
      </div>
    );
  } catch (error) {
    // Catch-all error handler for critical errors that prevent dashboard loading
    const errorMessage = error instanceof Error 
      ? `Critical dashboard error: ${error.message}` 
      : 'Unknown critical error in dashboard';
    console.error('❌ ' + errorMessage, error);
    
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 mb-6 rounded-lg">
          <h3 className="font-semibold mb-2">Error Loading Dashboard</h3>
          <p>{errorMessage}</p>
          <p className="mt-2">Please check the console for more details or try again later.</p>
        </div>
      </div>
    );
  }
}

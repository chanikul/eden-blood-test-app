import DashboardStats from './dashboard-stats'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Dashboard</h1>
      <DashboardStats />
    </div>
  )
}

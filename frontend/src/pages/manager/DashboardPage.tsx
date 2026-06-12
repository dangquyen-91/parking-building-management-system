import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { KpiCards } from '../../components/dashboard/KpiCards';
import { OccupancyChart } from '../../components/dashboard/OccupancyChart';
import { RecentBookings } from '../../components/dashboard/RecentBookings';
import { RecentSessions } from '../../components/dashboard/RecentSessions';
import { ZoneChart } from '../../components/dashboard/ZoneChart';
import { dashboardData } from '../../data/mockDashboard';

export default function DashboardPage() {
  return (
    <AdminLayout
      eyebrow={dashboardData.meta.eyebrow}
      title={dashboardData.meta.title}
      subtitle={dashboardData.meta.subtitle}
      meta={
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300 backdrop-blur-xl">
          Cập nhật lần cuối: <span className="font-semibold text-white">{dashboardData.meta.lastUpdated}</span>
        </div>
      }
    >
      <div className="space-y-6">
        <KpiCards metrics={dashboardData.kpis} />

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.65fr)_minmax(380px,0.85fr)]">
          <OccupancyChart data={dashboardData.occupancy} />
          <ZoneChart data={dashboardData.zones} />
        </div>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
          <RecentSessions sessions={dashboardData.sessions} />
          <RecentBookings bookings={dashboardData.bookings} />
        </div>
      </div>
    </AdminLayout>
  );
}

import { Header } from '../../components/dashboard/Header';
import { KpiCards } from '../../components/dashboard/KpiCards';
import { OccupancyChart } from '../../components/dashboard/OccupancyChart';
import { RecentBookings } from '../../components/dashboard/RecentBookings';
import { RecentSessions } from '../../components/dashboard/RecentSessions';
import { Sidebar } from '../../components/dashboard/Sidebar';
import { ZoneChart } from '../../components/dashboard/ZoneChart';
import { dashboardData } from '../../data/mockDashboard';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#070B14] text-white">
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute left-[14%] top-[-18%] h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[8%] top-[16%] h-[380px] w-[380px] rounded-full bg-purple-500/18 blur-[120px]" />
        <div className="absolute bottom-[-12%] left-[44%] h-[320px] w-[320px] rounded-full bg-cyan-500/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.055),transparent_32%)]" />
      </div>

      <Sidebar />

      <div className="relative lg:pl-[280px]">
        <Header />
        <main className="px-4 py-6 sm:px-6 xl:px-8">
          <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-300">{dashboardData.meta.eyebrow}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
                {dashboardData.meta.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {dashboardData.meta.subtitle}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300 backdrop-blur-xl">
              Last updated: <span className="font-semibold text-white">{dashboardData.meta.lastUpdated}</span>
            </div>
          </div>

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
        </main>
      </div>
    </div>
  );
}

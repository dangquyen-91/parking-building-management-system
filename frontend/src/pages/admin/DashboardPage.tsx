import { useEffect, useMemo, useState } from 'react';
import {
  Banknote, CalendarCheck, Car, CircleCheckBig, SquareParking,
} from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { ZoneChart } from '../../components/dashboard/ZoneChart';
import { FloorOccupancyBars } from '../../components/dashboard/FloorOccupancyBars';
import {
  StatCard, ReportCard, useAsync, fmtNum, fmtShort,
  ChartSkeleton, ErrorBox, EmptyState,
} from '../../components/reports/shared';
import { reportService } from '../../services/report.service';
import { getActiveSessions } from '../../services/kiosk.service';
import { bookingService, type BookingStatus } from '../../services/booking.service';
import type { ZoneUsage } from '../../types/dashboard';
import { cn } from '../../lib/utils';

const REFRESH_MS = 30_000;
const ZONE_COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

const fmtTime = (v: string) => new Date(v).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const fmtClock = (d: Date) => d.toLocaleTimeString('vi-VN');

const bookingStatusStyle: Record<BookingStatus, { label: string; cls: string }> = {
  pending: { label: 'Chờ duyệt', cls: 'border-amber-400/20 bg-amber-400/10 text-amber-300' },
  confirmed: { label: 'Đã xác nhận', cls: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' },
  cancelled: { label: 'Đã hủy', cls: 'border-red-400/20 bg-red-400/10 text-red-300' },
  expired: { label: 'Hết hạn', cls: 'border-slate-400/20 bg-slate-400/10 text-slate-300' },
};

export default function DashboardPage() {
  const [tick, setTick] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const summary = useAsync(() => reportService.getDashboard(), [tick]);
  const occupancy = useAsync(() => reportService.getOccupancy(), [tick]);
  const sessions = useAsync(() => getActiveSessions({ limit: 6 }), [tick]);
  const bookings = useAsync(() => bookingService.getAll({ limit: 6 }), [tick]);

  useEffect(() => {
    if (!summary.loading) setLastUpdated(new Date());
  }, [summary.loading, summary.data]);

  const s = summary.data;
  const floors = occupancy.data ?? [];

  const occAgg = useMemo(() => {
    const occupied = floors.reduce((a, f) => a + f.occupied, 0);
    const available = floors.reduce((a, f) => a + f.available, 0);
    const total = occupied + available;
    return { occupied, available, total, rate: total > 0 ? Math.round((occupied / total) * 100) : 0 };
  }, [floors]);

  const zones: ZoneUsage[] = floors.map((f, i) => ({
    name: `Tầng ${f.floorNumber}`,
    value: f.occupancyRate,
    color: ZONE_COLORS[i % ZONE_COLORS.length],
  }));

  return (
    <AdminLayout
      eyebrow="Bảng điều khiển"
      title="Tổng quan vận hành"
      subtitle="Tình hình bãi đỗ ngay lúc này — tự động cập nhật mỗi 30 giây."
      meta={
        <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          Trực tiếp · {fmtClock(lastUpdated)}
        </div>
      }
    >
      {summary.error ? (
        <ErrorBox message={summary.error} />
      ) : (
        <div className="space-y-6">
          {/* KPI */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              icon={Car} tone="blue" label="Xe đang trong bãi"
              value={s ? fmtNum(s.activeSessions.total) : '…'}
              sub={s ? <>🏍️ {fmtNum(s.activeSessions.motorcycle)} · 🚙 {fmtNum(s.activeSessions.car)}</> : undefined}
            />
            <StatCard
              icon={Banknote} tone="green" label="Doanh thu hôm nay"
              value={s ? fmtShort(s.revenueToday.total) : '…'}
              sub={s ? <>Vé lượt {fmtShort(s.revenueToday.fromSessions)} · Đặt chỗ {fmtShort(s.revenueToday.fromBookings)} · Thuê bao {fmtShort(s.revenueToday.fromSubscriptions)}</> : undefined}
            />
            <StatCard
              icon={CircleCheckBig} tone="purple" label="Phiên hoàn tất hôm nay"
              value={s ? fmtNum(s.completedSessionsToday) : '…'}
            />
            <StatCard
              icon={CalendarCheck} tone="amber" label="Đặt chỗ hôm nay"
              value={s ? fmtNum(s.bookingsToday.pending + s.bookingsToday.confirmed) : '…'}
              sub={s ? <>Chờ duyệt {fmtNum(s.bookingsToday.pending)} · Đã xác nhận {fmtNum(s.bookingsToday.confirmed)}</> : undefined}
            />
            <StatCard
              icon={SquareParking} tone="cyan" label="Tỷ lệ lấp đầy toàn bãi"
              value={occupancy.loading && floors.length === 0 ? '…' : `${occAgg.rate}%`}
              sub={<>{fmtNum(occAgg.available)} chỗ trống / {fmtNum(occAgg.total)}</>}
            />
          </div>

          {/* Occupancy */}
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,0.9fr)]">
            <ReportCard
              title="Tỷ lệ lấp đầy theo tầng"
              hint="Thời gian thực · /reports/occupancy"
              action={
                occAgg.rate >= 85 ? (
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                    Bãi gần đầy
                  </span>
                ) : undefined
              }
            >
              {occupancy.loading && floors.length === 0 ? <ChartSkeleton height={260} /> : occupancy.error ? <ErrorBox message={occupancy.error} /> : floors.length === 0 ? <EmptyState /> : (
                <FloorOccupancyBars floors={floors} />
              )}
            </ReportCard>

            {floors.length > 0 ? <ZoneChart data={zones} /> : <div className="rounded-[24px] border border-white/10 bg-[#0F172A]/80 p-5"><ChartSkeleton height={300} /></div>}
          </div>

          {/* Recent activity */}
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
            <ReportCard title="Phiên gửi xe đang hoạt động" hint="Mới nhất">
              {sessions.loading && !sessions.data ? <ChartSkeleton height={200} /> : sessions.error ? <ErrorBox message={sessions.error} /> : (sessions.data?.data ?? []).length === 0 ? <EmptyState label="Không có phiên nào đang hoạt động" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                        <th className="py-2">Biển số</th><th className="py-2">Khách</th><th className="py-2">Vị trí</th><th className="py-2">Giờ vào</th><th className="py-2 text-right">Loại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(sessions.data?.data ?? []).map((v) => (
                        <tr key={v.id} className="border-t border-white/5">
                          <td className="py-2.5 font-semibold tracking-wide text-white">{v.licensePlate}</td>
                          <td className="py-2.5 text-slate-300">{v.user?.fullName ?? 'Khách vãng lai'}</td>
                          <td className="py-2.5 text-slate-400">{v.slot?.slotCode ?? v.row?.rowCode ?? '--'}</td>
                          <td className="py-2.5 text-slate-400 tabular-nums">{fmtTime(v.entryTime)}</td>
                          <td className="py-2.5 text-right text-slate-400">{v.vehicleType === 'car' ? 'Ô tô' : 'Xe máy'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ReportCard>

            <ReportCard title="Đặt chỗ gần đây" hint="Mới nhất">
              {bookings.loading && !bookings.data ? <ChartSkeleton height={200} /> : bookings.error ? <ErrorBox message={bookings.error} /> : (bookings.data?.bookings ?? []).length === 0 ? <EmptyState label="Chưa có đặt chỗ nào" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                        <th className="py-2">Biển số</th><th className="py-2">Khách</th><th className="py-2">Thời gian</th><th className="py-2 text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(bookings.data?.bookings ?? []).map((b) => {
                        const st = bookingStatusStyle[b.status];
                        return (
                          <tr key={b.id} className="border-t border-white/5">
                            <td className="py-2.5 font-semibold tracking-wide text-white">{b.licensePlate}</td>
                            <td className="py-2.5 text-slate-300">{b.customerName || b.user?.fullName || '--'}</td>
                            <td className="py-2.5 text-slate-400 tabular-nums">{fmtTime(b.startTime)}</td>
                            <td className="py-2.5 text-right"><span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', st.cls)}>{st.label}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </ReportCard>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

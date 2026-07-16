import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Banknote,
  Bike,
  CalendarCheck,
  Car,
  CheckCircle2,
  CircleCheckBig,
  Clock3,
  ReceiptText,
  ShieldCheck,
  SquareParking,
  type LucideIcon,
} from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { FloorOccupancyBars } from '../../components/dashboard/FloorOccupancyBars';
import {
  ReportCard,
  useAsync,
  fmtNum,
  fmtShort,
  ChartSkeleton,
  ErrorBox,
  EmptyState,
} from '../../components/reports/shared';
import { reportService } from '../../services/report.service';
import { getActiveSessions } from '../../services/kiosk.service';
import { bookingService, type BookingStatus } from '../../services/booking.service';
import { cn } from '../../lib/utils';

const REFRESH_MS = 30_000;

const fmtTime = (v: string) => new Date(v).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
const fmtClock = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const bookingStatusStyle: Record<BookingStatus, { label: string; cls: string }> = {
  pending: { label: 'Chờ duyệt', cls: 'border-amber-400/20 bg-amber-400/10 text-amber-300' },
  confirmed: { label: 'Đã xác nhận', cls: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' },
  cancelled: { label: 'Đã hủy', cls: 'border-red-400/20 bg-red-400/10 text-red-300' },
  expired: { label: 'Hết hạn', cls: 'border-slate-400/20 bg-slate-400/10 text-slate-300' },
};

type Tone = 'blue' | 'green' | 'purple' | 'amber' | 'cyan' | 'rose';

const toneClasses: Record<Tone, { icon: string; soft: string; ring: string }> = {
  blue: { icon: 'bg-blue-500/15 text-blue-300', soft: 'text-blue-200', ring: 'border-blue-400/20 bg-blue-400/10' },
  green: { icon: 'bg-emerald-500/15 text-emerald-300', soft: 'text-emerald-200', ring: 'border-emerald-400/20 bg-emerald-400/10' },
  purple: { icon: 'bg-purple-500/15 text-purple-300', soft: 'text-purple-200', ring: 'border-purple-400/20 bg-purple-400/10' },
  amber: { icon: 'bg-amber-500/15 text-amber-300', soft: 'text-amber-200', ring: 'border-amber-400/20 bg-amber-400/10' },
  cyan: { icon: 'bg-cyan-500/15 text-cyan-300', soft: 'text-cyan-200', ring: 'border-cyan-400/20 bg-cyan-400/10' },
  rose: { icon: 'bg-rose-500/15 text-rose-300', soft: 'text-rose-200', ring: 'border-rose-400/20 bg-rose-400/10' },
};

function getFloorTotal(floor: {
  vehicleType: 'motorcycle' | 'car';
  totalSlots?: number;
  totalCapacity?: number;
  occupied: number;
  reserved?: number;
  available: number;
}) {
  return (floor.vehicleType === 'car' ? floor.totalSlots : floor.totalCapacity)
    ?? floor.occupied + (floor.reserved ?? 0) + floor.available;
}

function MetricCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <article className="rounded-[26px] border border-white/10 bg-[#0F172A]/80 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:scale-[1.01]">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
        <Icon className={cn('h-5 w-5', toneClasses[tone].soft)} />
      </div>
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <div className="mt-2 text-3xl font-bold text-white tabular-nums">{value}</div>
      {sub && <div className="mt-2 text-xs text-slate-500">{sub}</div>}
    </article>
  );
}

function AlertItem({
  icon: Icon,
  tone,
  title,
  desc,
}: {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  desc: string;
}) {
  return (
    <div className={cn('flex gap-3 rounded-lg border p-3', toneClasses[tone].ring)}>
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', toneClasses[tone].soft)} />
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs text-slate-400">{desc}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const summary = useAsync(() => reportService.getDashboard(), [tick]);
  const occupancy = useAsync(() => reportService.getOccupancy(), [tick]);
  const sessions = useAsync(() => getActiveSessions({ limit: 6 }), [tick]);
  const bookings = useAsync(() => bookingService.getAll({ limit: 6 }), [tick]);

  const s = summary.data;
  const floors = useMemo(() => occupancy.data ?? [], [occupancy.data]);
  const activeSessions = sessions.data?.data ?? [];
  const recentBookings = bookings.data?.bookings ?? [];
  const lastUpdated = new Date();

  const occAgg = useMemo(() => {
    const used = floors.reduce((a, f) => a + f.occupied + (f.reserved ?? 0), 0);
    const reserved = floors.reduce((a, f) => a + (f.reserved ?? 0), 0);
    const available = floors.reduce((a, f) => a + f.available, 0);
    const total = floors.reduce((a, f) => a + getFloorTotal(f), 0);
    const rate = total > 0 ? Math.round((used / total) * 100) : 0;
    return { used, reserved, available, total, rate };
  }, [floors]);

  const attentionFloors = useMemo(
    () => floors
      .map((floor) => ({
        ...floor,
        used: floor.occupied + (floor.reserved ?? 0),
        total: getFloorTotal(floor),
      }))
      .filter((floor) => floor.total > 0 && floor.available <= Math.max(2, Math.ceil(floor.total * 0.1)))
      .sort((a, b) => a.available - b.available)
      .slice(0, 3),
    [floors],
  );

  const pendingBookings = s?.bookingsToday.pending ?? 0;
  const confirmedBookings = s?.bookingsToday.confirmed ?? 0;
  const hasAlerts = attentionFloors.length > 0 || pendingBookings > 0 || occAgg.reserved > 0;

  return (
    <AdminLayout
      eyebrow="Bảng điều khiển"
      title="Tổng quan vận hành"
      subtitle="Theo dõi sức chứa, phương tiện, booking và doanh thu trong một màn hình."
      meta={
        <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
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
        <div className="space-y-5">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                <MetricCard
                  icon={Car}
                  tone="blue"
                  label="Xe trong bãi"
                  value={s ? fmtNum(s.activeSessions.total) : '...'}
                  sub={s ? (
                    <span className="inline-flex flex-wrap gap-x-3 gap-y-1">
                      <span className="inline-flex items-center gap-1"><Bike className="h-3.5 w-3.5" />{fmtNum(s.activeSessions.motorcycle)}</span>
                      <span className="inline-flex items-center gap-1"><Car className="h-3.5 w-3.5" />{fmtNum(s.activeSessions.car)}</span>
                    </span>
                  ) : undefined}
                />
                <MetricCard
                  icon={SquareParking}
                  tone={occAgg.available <= 5 ? 'rose' : 'cyan'}
                  label="Chỗ còn trống"
                  value={occupancy.loading && floors.length === 0 ? '...' : fmtNum(occAgg.available)}
                  sub={`${fmtNum(occAgg.used)}/${fmtNum(occAgg.total)} chỗ đang dùng`}
                />
                <MetricCard
                  icon={Banknote}
                  tone="green"
                  label="Doanh thu"
                  value={s ? fmtShort(s.revenueToday.total) : '...'}
                  sub={s ? `Vé ${fmtShort(s.revenueToday.fromSessions)} · Booking ${fmtShort(s.revenueToday.fromBookings)}` : undefined}
                />
                <MetricCard
                  icon={CircleCheckBig}
                  tone="purple"
                  label="Phiên hoàn tất"
                  value={s ? fmtNum(s.completedSessionsToday) : '...'}
                  sub="Đã check-out hôm nay"
                />
                <MetricCard
                  icon={CalendarCheck}
                  tone={pendingBookings > 0 ? 'amber' : 'green'}
                  label="Booking hôm nay"
                  value={s ? fmtNum(pendingBookings + confirmedBookings) : '...'}
                  sub={s ? `Chờ ${fmtNum(pendingBookings)} · Xác nhận ${fmtNum(confirmedBookings)}` : undefined}
                />
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.75fr)]">
            <ReportCard
              title="Sức chứa theo tầng"
              hint="Đang dùng = xe đang đậu + chỗ booking đang giữ"
              action={
                occAgg.rate >= 85 ? (
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                    Bãi gần đầy
                  </span>
                ) : (
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    Còn {fmtNum(occAgg.available)} chỗ
                  </span>
                )
              }
            >
              {occupancy.loading && floors.length === 0 ? <ChartSkeleton height={260} /> : occupancy.error ? <ErrorBox message={occupancy.error} /> : floors.length === 0 ? <EmptyState /> : (
                <FloorOccupancyBars floors={floors} />
              )}
            </ReportCard>

            <div>
              <ReportCard title="Cảnh báo vận hành" hint="Các điểm cần kiểm tra nhanh">
                <div className="space-y-3">
                  {!hasAlerts && (
                    <AlertItem icon={CheckCircle2} tone="green" title="Vận hành ổn định" desc="Chưa có tầng gần đầy hoặc booking chờ xử lý." />
                  )}
                  {attentionFloors.map((floor) => (
                    <AlertItem
                      key={floor.floorId}
                      icon={AlertTriangle}
                      tone={floor.available === 0 ? 'rose' : 'amber'}
                      title={`Tầng ${floor.floorNumber} còn ${fmtNum(floor.available)} chỗ`}
                      desc={`${floor.floorType === 'resident' ? 'Cư dân' : 'Vãng lai'} · đang dùng ${fmtNum(floor.used)}/${fmtNum(floor.total)} chỗ`}
                    />
                  ))}
                  {pendingBookings > 0 && (
                    <AlertItem icon={CalendarCheck} tone="amber" title={`${fmtNum(pendingBookings)} booking chờ xử lý`} desc="Nên kiểm tra để tránh khách giữ chỗ quá lâu." />
                  )}
                  {occAgg.reserved > 0 && (
                    <AlertItem icon={Clock3} tone="cyan" title={`${fmtNum(occAgg.reserved)} chỗ đang được giữ`} desc="Các chỗ này đã có booking, không tính là còn trống." />
                  )}
                </div>
              </ReportCard>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
            <ReportCard
              title="Phiên gửi xe đang hoạt động"
              hint="Các xe mới nhất đang ở trong bãi"
              action={<Link to="/admin/parking-sessions" className="text-xs font-semibold text-blue-300 hover:text-blue-200">Xem tất cả</Link>}
            >
              {sessions.loading && !sessions.data ? <ChartSkeleton height={220} /> : sessions.error ? <ErrorBox message={sessions.error} /> : activeSessions.length === 0 ? <EmptyState label="Không có phiên nào đang hoạt động" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                        <th className="py-2">Biển số</th>
                        <th className="py-2">Khách</th>
                        <th className="py-2">Vị trí</th>
                        <th className="py-2">Giờ vào</th>
                        <th className="py-2 text-right">Loại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSessions.map((v) => (
                        <tr key={v.id} className="border-t border-white/5 transition hover:bg-white/[0.03]">
                          <td className="py-3 font-semibold tracking-wide text-white">{v.licensePlate}</td>
                          <td className="py-3 text-slate-300">{v.user?.fullName ?? 'Khách vãng lai'}</td>
                          <td className="py-3 text-slate-400">{v.slot?.slotCode ?? v.row?.rowCode ?? '--'}</td>
                          <td className="py-3 text-slate-400 tabular-nums">{fmtTime(v.entryTime)}</td>
                          <td className="py-3 text-right text-slate-400">{v.vehicleType === 'car' ? 'Ô tô' : 'Xe máy'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ReportCard>

            <ReportCard
              title="Booking gần đây"
              hint="Theo dõi trạng thái đặt chỗ mới nhất"
              action={<Link to="/admin/bookings" className="text-xs font-semibold text-blue-300 hover:text-blue-200">Xem tất cả</Link>}
            >
              {bookings.loading && !bookings.data ? <ChartSkeleton height={220} /> : bookings.error ? <ErrorBox message={bookings.error} /> : recentBookings.length === 0 ? <EmptyState label="Chưa có đặt chỗ nào" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                        <th className="py-2">Biển số</th>
                        <th className="py-2">Khách</th>
                        <th className="py-2">Thời gian</th>
                        <th className="py-2 text-right">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((b) => {
                        const st = bookingStatusStyle[b.status];
                        return (
                          <tr key={b.id} className="border-t border-white/5 transition hover:bg-white/[0.03]">
                            <td className="py-3 font-semibold tracking-wide text-white">{b.licensePlate}</td>
                            <td className="py-3 text-slate-300">{b.customerName || b.user?.fullName || '--'}</td>
                            <td className="py-3 text-slate-400 tabular-nums">{fmtTime(b.startTime)}</td>
                            <td className="py-3 text-right">
                              <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', st.cls)}>{st.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </ReportCard>
          </section>

          <ReportCard title="Doanh thu hôm nay" hint="Tách theo nguồn thu để admin đối soát nhanh">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <ReceiptText className="h-4 w-4 text-emerald-300" />
                  Vé lượt
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">{s ? fmtShort(s.revenueToday.fromSessions) : '...'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <CalendarCheck className="h-4 w-4 text-blue-300" />
                  Booking
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">{s ? fmtShort(s.revenueToday.fromBookings) : '...'}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-purple-300" />
                  Thuê bao
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">{s ? fmtShort(s.revenueToday.fromSubscriptions) : '...'}</p>
              </div>
            </div>
          </ReportCard>
        </div>
      )}
    </AdminLayout>
  );
}

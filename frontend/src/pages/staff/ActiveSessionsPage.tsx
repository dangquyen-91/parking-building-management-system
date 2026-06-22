import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Car,
  Clock3,
  Loader2,
  LogOut,
  MapPin,
  Motorbike,
  RefreshCw,
  Search,
  UserRound,
} from 'lucide-react';
import { KioskLayout } from '../../components/kiosk/KioskLayout';
import { useKioskHotkeys } from '../../hooks/useKioskHotkeys';
import { getActiveSessions } from '../../services/kiosk.service';
import { cn } from '../../lib/utils';
import type { ActiveSessionApiItem } from '../../types/kiosk';

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatDuration = (iso: string) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${remainingMinutes} phút`;
  if (!remainingMinutes) return `${hours} giờ`;
  return `${hours} giờ ${remainingMinutes} phút`;
};

const formatLocation = (session: ActiveSessionApiItem): { label: string; sublabel?: string } => {
  // Ô tô cư dân: gắn slot cố định
  if (session.slot?.slotCode) {
    const floor = session.slot.floor;
    const parts: string[] = [session.slot.slotCode];
    if (floor?.floorNumber) parts.push(`Tầng ${floor.floorNumber}`);
    if (floor?.building?.name) parts.push(floor.building.name);
    return { label: parts.join(' · '), sublabel: 'Slot cố định' };
  }

  // Xe máy: gắn theo hàng (row)
  if (session.row?.rowCode) {
    const floor = session.row.floor;
    const parts: string[] = [session.row.rowCode];
    if (floor?.floorNumber) parts.push(`Tầng ${floor.floorNumber}`);
    if (floor?.building?.name) parts.push(floor.building.name);
    return { label: parts.join(' · '), sublabel: 'Hàng xe máy' };
  }

  // Ô tô vãng lai: chỉ có floorId, đếm theo tầng
  if (session.floorId) {
    return { label: `Tầng #${session.floorId}`, sublabel: 'Đếm theo tầng' };
  }

  return { label: '--' };
};

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState<ActiveSessionApiItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getActiveSessions({
        page,
        limit: 20,
        search: search.trim() || undefined,
      });
      setSessions(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách xe đang gửi.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useKioskHotkeys();

  const stats = useMemo(() => {
    const cars = sessions.filter((item) => item.vehicleType === 'car').length;
    const motorcycles = sessions.filter((item) => item.vehicleType === 'motorcycle').length;
    return { cars, motorcycles };
  }, [sessions]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (page === 1) loadSessions();
    else setPage(1);
  };

  return (
    <KioskLayout
      eyebrow="Staff Kiosk"
      title="Phiên Đang Hoạt Động"
      subtitle="Theo dõi xe đang trong bãi · Phím F3 mở trang này nhanh"
      headerRight={
        <button
          type="button"
          onClick={loadSessions}
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-slate-200 transition hover:border-blue-400/40 hover:text-white"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Làm mới
        </button>
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        {[
          { key: 'F1', label: 'Check-in' },
          { key: 'F2', label: 'Check-out' },
          { key: 'F3', label: 'Phiên đang gửi' },
          { key: 'F4', label: 'Sơ đồ bãi' },
        ].map(({ key, label }) => (
          <span key={key} className="flex items-center gap-1">
            <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-slate-500">
              {key}
            </kbd>
            <span className="text-slate-700">{label}</span>
          </span>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value.toUpperCase())}
              placeholder="Tìm biển số xe..."
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-12 pr-4 text-lg font-bold tracking-widest text-white outline-none transition placeholder:text-slate-600 focus:border-blue-400/60 focus:bg-white/[0.07]"
            />
          </div>
        </form>

        {[
          { label: 'Tổng phiên', value: total, icon: Activity, tone: 'text-blue-300 bg-blue-500/15' },
          { label: 'Ô tô trang này', value: stats.cars, icon: Car, tone: 'text-emerald-300 bg-emerald-500/15' },
          { label: 'Xe máy trang này', value: stats.motorcycles, icon: Motorbike, tone: 'text-amber-300 bg-amber-500/15' },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-white/10 bg-[#0F172A]/80 p-4 backdrop-blur-xl">
            <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', item.tone)}>
              <item.icon className="h-5 w-5" />
            </div>
            <p className="text-xs text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-black text-white">{item.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-5 flex gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[30px] border border-white/10 bg-[#0F172A]/80 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl"
      >
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-blue-300" />
            Đang tải phiên gửi xe...
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-slate-500">
              <Clock3 className="h-7 w-7" />
            </div>
            <p className="text-lg font-bold text-white">Chưa có phiên đang hoạt động</p>
            <p className="mt-1 text-sm text-slate-500">Thử đổi biển số tìm kiếm hoặc làm mới dữ liệu.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {sessions.map((session, index) => {
              const VehicleIcon = session.vehicleType === 'car' ? Car : Motorbike;
              return (
                <motion.article
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-blue-400/30 hover:bg-white/[0.055] lg:grid-cols-[minmax(180px,1.1fr)_minmax(180px,1fr)_minmax(160px,0.9fr)_auto]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
                      <VehicleIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xl font-black tracking-widest text-white">{session.licensePlate}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {session.vehicleType === 'car' ? 'Ô tô' : 'Xe máy'}
                      </p>
                    </div>
                  </div>

                  {(() => {
                    const loc = formatLocation(session);
                    const isCar = session.vehicleType === 'car';
                    const isVisitorCar = isCar && !session.slot && !session.row;
                    const isResidentCar = isCar && !!session.slot;
                    const isMoto = session.vehicleType === 'motorcycle';

                    const labelColor = isResidentCar
                      ? 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30'
                      : isMoto
                      ? 'text-amber-300 bg-amber-400/10 border-amber-400/30'
                      : 'text-blue-300 bg-blue-400/10 border-blue-400/30';
                    const labelText = isResidentCar ? 'Slot cư dân' : isMoto ? 'Hàng xe máy' : 'Tầng vãng lai';
                    const iconColor = isResidentCar ? 'text-emerald-300' : isMoto ? 'text-amber-300' : 'text-blue-300';

                    return (
                      <div className="flex items-center gap-3">
                        <MapPin className={cn('h-5 w-5 shrink-0', iconColor)} />
                        <div>
                          <span className={cn(
                            'inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide mb-1',
                            labelColor
                          )}>
                            {labelText}
                          </span>
                          <p className="text-base font-black text-white leading-tight">
                            {loc.label}
                          </p>
                          {isVisitorCar && (
                            <p className="text-xs text-slate-500 mt-0.5">Đếm theo tầng, không phân slot</p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-1">
                    <div className="flex items-center gap-3">
                      <Clock3 className="h-4 w-4 text-purple-300" />
                      <div>
                        <p className="text-xs text-slate-500">Giờ vào</p>
                        <p className="font-semibold text-slate-100">{formatDateTime(session.entryTime)}</p>
                        <p className="text-xs text-slate-500">{formatDuration(session.entryTime)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <UserRound className="h-4 w-4 text-emerald-300" />
                      <div>
                        <p className="text-xs text-slate-500">Nhân viên</p>
                        <p className="font-semibold text-slate-100">{session.staff?.fullName ?? '--'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center lg:justify-end">
                    <Link
                      to={`/staff/check-out?plate=${encodeURIComponent(session.licensePlate)}`}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500"
                    >
                      <LogOut className="h-4 w-4" />
                      Checkout
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm text-slate-500">
          <span>
            Trang {page}/{totalPages} · {total} phiên đang hoạt động
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="h-10 rounded-xl border border-white/10 px-4 font-semibold text-slate-300 transition hover:border-blue-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className="h-10 rounded-xl border border-white/10 px-4 font-semibold text-slate-300 transition hover:border-blue-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      </motion.section>
    </KioskLayout>
  );
}

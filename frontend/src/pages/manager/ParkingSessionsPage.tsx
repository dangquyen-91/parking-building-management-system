import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Building2,
  Car,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  MapPin,
  Motorbike,
  RefreshCw,
  Search,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { cn } from '../../lib/utils';
import { buildingService, type Building } from '../../services/building.service';
import { getActiveSessions } from '../../services/kiosk.service';
import type { ActiveSessionApiItem, VehicleType } from '../../types/kiosk';

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const formatDuration = (value: string) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days) return `${days} ngày ${hours % 24} giờ`;
  if (hours) return `${hours} giờ ${minutes % 60} phút`;
  return `${minutes} phút`;
};

const formatCurrency = (value: string | number | null | undefined) =>
  value == null ? '--' : `${Number(value).toLocaleString('vi-VN')} VND`;

const getPlace = (session: ActiveSessionApiItem) => session.slot ?? session.row;
const getPlaceCode = (session: ActiveSessionApiItem) => session.slot?.slotCode ?? session.row?.rowCode ?? '--';

export default function ParkingSessionsPage() {
  const [sessions, setSessions] = useState<ActiveSessionApiItem[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [buildingId, setBuildingId] = useState<number | ''>('');
  const [selectedSession, setSelectedSession] = useState<ActiveSessionApiItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      total: pagination.total,
      cars: sessions.filter((session) => session.vehicleType === 'car').length,
      motorcycles: sessions.filter((session) => session.vehicleType === 'motorcycle').length,
      prepaid: sessions.filter((session) => session.paymentStatus === 'paid').length,
    }),
    [pagination.total, sessions],
  );

  const loadSessions = async (page = pagination.page, resetFilters = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getActiveSessions({
        page,
        limit: 10,
        search: resetFilters ? undefined : search.trim() || undefined,
        vehicleType: resetFilters ? undefined : vehicleType || undefined,
        buildingId: resetFilters ? undefined : buildingId || undefined,
      });
      setSessions(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách phiên gửi xe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    Promise.all([
      getActiveSessions({ page: 1, limit: 10 }),
      buildingService.getBuildings({ page: 1, limit: 100, isActive: true }),
    ])
      .then(([sessionResult, buildingResult]) => {
        if (!active) return;
        setSessions(sessionResult.data);
        setPagination(sessionResult.pagination);
        setBuildings(buildingResult.buildings);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Không tải được dữ liệu phiên gửi xe');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleReset = () => {
    setSearch('');
    setVehicleType('');
    setBuildingId('');
    loadSessions(1, true);
  };

  return (
    <AdminLayout
      eyebrow="Giám sát vận hành"
      title="Phiên gửi xe đang hoạt động"
      subtitle="Theo dõi phương tiện hiện có trong bãi, vị trí, thời gian vào và trạng thái thanh toán."
      meta={
        <button
          type="button"
          onClick={() => loadSessions(pagination.page)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-400/10 px-4 py-3 text-sm font-semibold text-blue-200 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Làm mới
        </button>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Tổng phiên hoạt động', value: stats.total, icon: Activity, tone: 'text-blue-300' },
            { label: 'Ô tô trang này', value: stats.cars, icon: Car, tone: 'text-emerald-300' },
            { label: 'Xe máy trang này', value: stats.motorcycles, icon: Motorbike, tone: 'text-amber-300' },
            { label: 'Đã trả trước trang này', value: stats.prepaid, icon: WalletCards, tone: 'text-purple-300' },
          ].map((item) => (
            <motion.article
              key={item.label}
              whileHover={{ y: -4 }}
              className="rounded-[26px] border border-white/10 bg-[#0F172A]/80 p-5 shadow-2xl shadow-black/20"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <item.icon className={cn('h-5 w-5', item.tone)} />
              </div>
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{item.value}</p>
            </motion.article>
          ))}
        </section>

        <section className="rounded-[30px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20">
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-400">Phương tiện trong bãi</p>
            <h2 className="mt-1 text-xl font-bold text-white">Danh sách phiên đang hoạt động</h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_190px_220px_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') loadSessions(1);
                }}
                placeholder="Tìm theo biển số"
                className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm font-semibold tracking-wider text-white outline-none focus:border-blue-400/60"
              />
            </label>
            <select
              value={vehicleType}
              onChange={(event) => setVehicleType(event.target.value as VehicleType | '')}
              className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none"
            >
              <option value="">Tất cả phương tiện</option>
              <option value="car">Ô tô</option>
              <option value="motorcycle">Xe máy</option>
            </select>
            <select
              value={buildingId}
              onChange={(event) => setBuildingId(event.target.value ? Number(event.target.value) : '')}
              className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none"
            >
              <option value="">Tất cả tòa nhà</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>{building.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadSessions(1)}
                disabled={loading}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                Lọc
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300"
                title="Đặt lại bộ lọc"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-slate-500">
                  <th className="pb-3 font-semibold">Phương tiện</th>
                  <th className="pb-3 font-semibold">Vị trí</th>
                  <th className="pb-3 font-semibold">Thời gian vào</th>
                  <th className="pb-3 font-semibold">Nhân viên</th>
                  <th className="pb-3 font-semibold">Thanh toán</th>
                  <th className="pb-3 text-right font-semibold">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-sm text-slate-400">
                      <RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin text-blue-300" />
                      Đang tải phiên gửi xe...
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-sm text-slate-400">
                      Không có phiên đang hoạt động phù hợp.
                    </td>
                  </tr>
                ) : (
                  sessions.map((session, index) => {
                    const place = getPlace(session);
                    const VehicleIcon = session.vehicleType === 'car' ? Car : Motorbike;
                    return (
                      <motion.tr
                        key={session.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.025 }}
                        className="hover:bg-white/[0.03]"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
                              <VehicleIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold tracking-wider text-white">{session.licensePlate}</p>
                              <p className="mt-1 text-xs text-slate-500">Phiên #{session.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-slate-300">
                          <p>{getPlaceCode(session)}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {place?.floor?.building?.name ?? 'Chưa rõ tòa'} · Tầng {place?.floor?.floorNumber ?? '--'}
                          </p>
                        </td>
                        <td className="py-4 text-sm text-slate-300">
                          <p>{formatDateTime(session.entryTime)}</p>
                          <p className="mt-1 text-xs text-blue-300">{formatDuration(session.entryTime)}</p>
                        </td>
                        <td className="py-4 text-sm text-slate-300">{session.staff?.fullName ?? `#${session.staffId}`}</td>
                        <td className="py-4">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                              session.paymentStatus === 'paid'
                                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                                : 'border-amber-400/20 bg-amber-400/10 text-amber-200',
                            )}
                          >
                            {session.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedSession(session)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10 text-blue-200"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">
              Trang <span className="font-semibold text-white">{pagination.page}</span> /{' '}
              <span className="font-semibold text-white">{pagination.totalPages || 1}</span> · {pagination.total} phiên
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadSessions(Math.max(1, pagination.page - 1))}
                disabled={loading || pagination.page <= 1}
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 px-4 text-sm font-semibold text-slate-200 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Trước
              </button>
              <button
                type="button"
                onClick={() => loadSessions(Math.min(pagination.totalPages || 1, pagination.page + 1))}
                disabled={loading || pagination.page >= (pagination.totalPages || 1)}
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 px-4 text-sm font-semibold text-slate-200 disabled:opacity-40"
              >
                Sau <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#0F172A] p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-300">Phiên #{selectedSession.id}</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-wider text-white">{selectedSession.licensePlate}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSession(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Loại xe', value: selectedSession.vehicleType === 'car' ? 'Ô tô' : 'Xe máy', icon: Car },
                  { label: 'Vị trí', value: getPlaceCode(selectedSession), icon: MapPin },
                  { label: 'Tòa nhà', value: getPlace(selectedSession)?.floor?.building?.name ?? '--', icon: Building2 },
                  { label: 'Tầng', value: getPlace(selectedSession)?.floor?.floorNumber ?? '--', icon: Building2 },
                  { label: 'Giờ vào', value: formatDateTime(selectedSession.entryTime), icon: Clock3 },
                  { label: 'Thời gian đã gửi', value: formatDuration(selectedSession.entryTime), icon: Clock3 },
                  { label: 'Nhân viên check-in', value: selectedSession.staff?.fullName ?? `#${selectedSession.staffId}`, icon: UserRound },
                  { label: 'Booking', value: selectedSession.bookingId ? `#${selectedSession.bookingId}` : 'Không có', icon: Activity },
                  { label: 'Trả trước', value: formatCurrency(selectedSession.prepaidAmount), icon: WalletCards },
                  { label: 'Số giờ trả trước', value: selectedSession.prepaidHours ?? '--', icon: Clock3 },
                ].map((item) => (
                  <article key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      <item.icon className="h-4 w-4" /> {item.label}
                    </div>
                    <p className="break-words text-sm font-semibold text-white">{item.value}</p>
                  </article>
                ))}
              </div>

              {selectedSession.note && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ghi chú</p>
                  <p className="mt-2 text-sm text-slate-200">{selectedSession.note}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

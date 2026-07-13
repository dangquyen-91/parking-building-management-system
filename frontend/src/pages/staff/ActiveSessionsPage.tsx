import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Banknote,
  Car,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  LogOut,
  MapPin,
  Motorbike,
  RefreshCw,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import { KioskLayout } from '../../components/kiosk/KioskLayout';
import { useKioskHotkeys } from '../../hooks/useKioskHotkeys';
import { getActiveSessions, checkOut } from '../../services/kiosk.service';
import { floorService, type Floor } from '../../services/floor.service';
import { cn } from '../../lib/utils';
import type { ActiveSessionApiItem, PaymentMethod } from '../../types/kiosk';

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

const formatLocation = (
  session: ActiveSessionApiItem,
  floorMap: Map<number, Floor>
): { label: string; sublabel?: string } => {
  if (session.slot?.slotCode) {
    const floor = session.slot.floor;
    const parts: string[] = [session.slot.slotCode];
    if (floor?.floorNumber) parts.push(`Tầng ${floor.floorNumber}`);
    if (floor?.building?.name) parts.push(floor.building.name);
    return { label: parts.join(' · '), sublabel: 'Slot cố định' };
  }

  if (session.row?.rowCode) {
    const floor = session.row.floor;
    const parts: string[] = [session.row.rowCode];
    if (floor?.floorNumber) parts.push(`Tầng ${floor.floorNumber}`);
    if (floor?.building?.name) parts.push(floor.building.name);
    return { label: parts.join(' · '), sublabel: 'Hàng xe máy' };
  }

  if (session.floorId) {
    const floor = floorMap.get(session.floorId);
    if (floor) {
      const parts: string[] = [`Tầng ${floor.floorNumber}`];
      if (floor.building?.name) parts.push(floor.building.name);
      return { label: parts.join(' · '), sublabel: 'Đếm theo tầng' };
    }
    return { label: `Tầng ?`, sublabel: 'Đang tải...' };
  }

  return { label: '--' };
};

const formatVND = (amount: number | string) =>
  Number(amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

// ── Checkout Modal ────────────────────────────────────────────────────────────

interface CheckoutModalProps {
  session: ActiveSessionApiItem | null;
  locationLabel: string;
  onConfirm: (method: PaymentMethod) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function CheckoutModal({ session, locationLabel, onConfirm, onCancel, isSubmitting }: CheckoutModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('cash');

  if (!session) return null;

  return (
    <AnimatePresence>
      {session && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-[#0F172A] p-7 shadow-2xl shadow-black/60"
          >
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="absolute right-5 top-5 rounded-xl p-1.5 text-slate-500 hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20">
                <LogOut className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Xác nhận Checkout</h2>
                <p className="text-sm text-slate-500">Xe đang gửi trong bãi</p>
              </div>
            </div>

            {/* Vehicle info */}
            <div className="mb-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <p className="text-2xl font-black tracking-widest text-white mb-1">{session.licensePlate}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-blue-300 font-semibold">
                  {session.vehicleType === 'car' ? 'Ô tô' : 'Xe máy'}
                </span>
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-slate-400">
                  {locationLabel}
                </span>
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-slate-400">
                  {formatDuration(session.entryTime)} trong bãi
                </span>
              </div>
            </div>

            {/* Payment method */}
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Hình thức thanh toán
            </p>
            <div className="mb-5 grid gap-3 grid-cols-2">
              {([
                { value: 'cash' as PaymentMethod, icon: Banknote, label: 'Tiền mặt', desc: 'Thu tiền tại cổng' },
                { value: 'vnpay' as PaymentMethod, icon: CreditCard, label: 'VNPay', desc: 'Cổng thanh toán QR' },
              ] as const).map(({ value, icon: Icon, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMethod(value)}
                  disabled={isSubmitting}
                  className={cn(
                    'flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-left transition-all text-sm',
                    method === value
                      ? 'border-blue-400/60 bg-blue-500/15 text-white'
                      : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-blue-400/30'
                  )}
                >
                  <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', method === value ? 'text-blue-300' : 'text-slate-500')} />
                  <span>
                    <span className="block font-bold">{label}</span>
                    <span className="block text-xs text-slate-500">{desc}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 h-11 rounded-xl border border-white/10 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:text-white disabled:opacity-40"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => onConfirm(method)}
                disabled={isSubmitting}
                className={cn(
                  'flex-[2] h-11 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2',
                  'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500',
                  'shadow-lg shadow-orange-600/20 disabled:opacity-50'
                )}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý...</>
                ) : (
                  <><LogOut className="h-4 w-4" /> Checkout ngay</>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Success Toast ─────────────────────────────────────────────────────────────

interface ToastData {
  licensePlate: string;
  fee: number;
  durationMinutes?: number;
}

function SuccessToast({ data, onDismiss }: { data: ToastData | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [data, onDismiss]);

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/20 px-5 py-3.5 shadow-2xl backdrop-blur-lg"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <p className="text-sm font-bold text-white">
              Checkout thành công · <span className="tracking-widest">{data.licensePlate}</span>
            </p>
            <p className="text-xs text-emerald-300">
              Phí: {formatVND(data.fee)}
              {data.durationMinutes !== undefined && ` · ${Math.floor(data.durationMinutes / 60)}h${data.durationMinutes % 60}p`}
            </p>
          </div>
          <button onClick={onDismiss} className="ml-2 rounded-lg p-1 text-emerald-400 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState<ActiveSessionApiItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [floorMap, setFloorMap] = useState<Map<number, Floor>>(new Map());

  // Checkout modal state
  const [checkoutTarget, setCheckoutTarget] = useState<ActiveSessionApiItem | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<ToastData | null>(null);

  // Load floor lookup map once on mount
  useEffect(() => {
    floorService.getFloors({ limit: 200, isActive: true })
      .then(res => {
        const map = new Map<number, Floor>();
        res.floors.forEach(f => map.set(f.id, f));
        setFloorMap(map);
      })
      .catch(() => { /* non-critical */ });
  }, []);

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

  const handleCheckoutConfirm = useCallback(async (method: PaymentMethod) => {
    if (!checkoutTarget) return;

    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const result = await checkOut(checkoutTarget.id, { paymentMethod: method });

      // VNPay redirect
      if (result.paymentMethod === 'vnpay' && result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }

      // Success
      setCheckoutTarget(null);
      setSuccessToast({
        licensePlate: result.licensePlate,
        fee: result.fee,
        durationMinutes: result.durationMinutes,
      });

      // Remove session từ danh sách ngay lập tức
      setSessions(prev => prev.filter(s => s.id !== checkoutTarget.id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Không thể checkout. Vui lòng thử lại.');
    } finally {
      setIsCheckingOut(false);
    }
  }, [checkoutTarget]);

  const checkoutTargetLocation = useMemo(
    () => checkoutTarget ? formatLocation(checkoutTarget, floorMap).label : '--',
    [checkoutTarget, floorMap]
  );

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
      {/* Hotkey hints */}
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

      {/* Search + Stats */}
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

      {/* Checkout error banner */}
      {checkoutError && (
        <div className="mb-5 flex gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {checkoutError}
          <button onClick={() => setCheckoutError(null)} className="ml-auto text-red-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
              const loc = formatLocation(session, floorMap);
              const isCar = session.vehicleType === 'car';
              const isResidentCar = isCar && !!session.slot;
              const isVisitorCar = isCar && !session.slot && !session.row;
              const isMoto = session.vehicleType === 'motorcycle';

              const labelColor = isResidentCar
                ? 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30'
                : isMoto
                ? 'text-amber-300 bg-amber-400/10 border-amber-400/30'
                : 'text-blue-300 bg-blue-400/10 border-blue-400/30';
              const labelText = isResidentCar ? 'Slot cư dân' : isMoto ? 'Hàng xe máy' : 'Tầng vãng lai';
              const iconColor = isResidentCar ? 'text-emerald-300' : isMoto ? 'text-amber-300' : 'text-blue-300';

              return (
                <motion.article
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-blue-400/30 hover:bg-white/[0.055] lg:grid-cols-[minmax(180px,1.1fr)_minmax(180px,1fr)_minmax(160px,0.9fr)_auto]"
                >
                  {/* License plate */}
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

                  {/* Location */}
                  <div className="flex items-center gap-3">
                    <MapPin className={cn('h-5 w-5 shrink-0', iconColor)} />
                    <div>
                      <span className={cn(
                        'inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide mb-1',
                        labelColor
                      )}>
                        {labelText}
                      </span>
                      <p className="text-base font-black text-white leading-tight">{loc.label}</p>
                      {isVisitorCar && (
                        <p className="text-xs text-slate-500 mt-0.5">Đếm theo tầng, không phân slot</p>
                      )}
                    </div>
                  </div>

                  {/* Time info */}
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

                  {/* Checkout button */}
                  <div className="flex items-center lg:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setCheckoutError(null);
                        setCheckoutTarget(session);
                      }}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 px-4 text-sm font-bold text-white shadow-lg shadow-orange-600/20 transition hover:from-orange-500 hover:to-red-500"
                    >
                      <LogOut className="h-4 w-4" />
                      Checkout
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
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

      {/* Checkout modal */}
      <CheckoutModal
        session={checkoutTarget}
        locationLabel={checkoutTargetLocation}
        onConfirm={handleCheckoutConfirm}
        onCancel={() => !isCheckingOut && setCheckoutTarget(null)}
        isSubmitting={isCheckingOut}
      />

      {/* Success toast */}
      <SuccessToast data={successToast} onDismiss={() => setSuccessToast(null)} />
    </KioskLayout>
  );
}

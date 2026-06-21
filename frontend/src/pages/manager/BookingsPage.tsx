import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Mail,
  RefreshCw,
  Search,
  TimerOff,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { cn } from '../../lib/utils';
import {
  bookingService,
  type Booking,
  type BookingStatus,
} from '../../services/booking.service';

interface ManagerBookingListParams {
  status?: BookingStatus;
  licensePlate?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface ManagerBookingListResult {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const managerBookingService = bookingService as typeof bookingService & {
  getAll: (params?: ManagerBookingListParams) => Promise<ManagerBookingListResult>;
  expireBookings: () => Promise<{ pendingCancelled: number; expired: number }>;
};

const statusLabels: Record<BookingStatus, string> = {
  pending: 'Chờ thanh toán',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  expired: 'Đã hết hạn',
};

const statusClasses: Record<BookingStatus, string> = {
  pending: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
  confirmed: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  cancelled: 'border-slate-400/25 bg-slate-400/10 text-slate-300',
  expired: 'border-red-400/25 bg-red-400/10 text-red-200',
};

const formatCurrency = (value: string | number) =>
  Number(value).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [licensePlate, setLicensePlate] = useState('');
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [expiring, setExpiring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      total: pagination.total,
      pending: bookings.filter((booking) => booking.status === 'pending').length,
      confirmed: bookings.filter((booking) => booking.status === 'confirmed').length,
      revenue: bookings
        .filter((booking) => booking.status === 'confirmed')
        .reduce((sum, booking) => sum + Number(booking.amount), 0),
    }),
    [bookings, pagination.total],
  );

  const loadBookings = async (page = pagination.page, resetFilters = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await managerBookingService.getAll({
        page,
        limit: 10,
        licensePlate: resetFilters ? undefined : licensePlate.trim() || undefined,
        status: resetFilters ? undefined : status || undefined,
        startDate: !resetFilters && startDate ? new Date(`${startDate}T00:00:00`).toISOString() : undefined,
        endDate: !resetFilters && endDate ? new Date(`${endDate}T23:59:59`).toISOString() : undefined,
      });
      setBookings(result.bookings);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    managerBookingService
      .getAll({ page: 1, limit: 10 })
      .then((result) => {
        if (!active) return;
        setBookings(result.bookings);
        setPagination(result.pagination);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Không tải được danh sách booking');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleReset = () => {
    setLicensePlate('');
    setStatus('');
    setStartDate('');
    setEndDate('');
    loadBookings(1, true);
  };

  const handleCancel = async (booking: Booking) => {
    if (!window.confirm(`Hủy booking #${booking.id} của biển số ${booking.licensePlate}?`)) return;

    setCancellingId(booking.id);
    setError(null);
    setSuccess(null);
    try {
      await bookingService.cancelBooking(booking.id);
      setSuccess(`Đã hủy booking #${booking.id}`);
      setSelectedBooking(null);
      await loadBookings(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể hủy booking');
    } finally {
      setCancellingId(null);
    }
  };

  const handleExpire = async () => {
    setExpiring(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await managerBookingService.expireBookings();
      setSuccess(
        `Đã xử lý ${result.pendingCancelled} booking chờ thanh toán và ${result.expired} booking quá hạn`,
      );
      await loadBookings(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể quét booking quá hạn');
    } finally {
      setExpiring(false);
    }
  };

  return (
    <AdminLayout
      eyebrow="Vận hành đặt chỗ"
      title="Quản lý booking"
      subtitle="Theo dõi, lọc và xử lý các booking ô tô trong hệ thống."
      meta={
        <button
          type="button"
          onClick={handleExpire}
          disabled={expiring}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-200 transition hover:border-amber-300/50 hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <TimerOff className={cn('h-4 w-4', expiring && 'animate-pulse')} />
          {expiring ? 'Đang quét...' : 'Quét quá hạn'}
        </button>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Tổng booking', value: stats.total, icon: CalendarCheck, tone: 'text-blue-300' },
            { label: 'Chờ thanh toán trang này', value: stats.pending, icon: Clock3, tone: 'text-amber-300' },
            { label: 'Đã xác nhận trang này', value: stats.confirmed, icon: CheckCircle2, tone: 'text-emerald-300' },
            { label: 'Doanh thu trang này', value: formatCurrency(stats.revenue), icon: CalendarCheck, tone: 'text-purple-300' },
          ].map((item) => (
            <motion.article
              key={item.label}
              whileHover={{ y: -4, scale: 1.01 }}
              className="rounded-[26px] border border-white/10 bg-[#0F172A]/80 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <item.icon className={cn('h-5 w-5', item.tone)} />
              </div>
              <p className="text-sm font-medium text-slate-400">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
            </motion.article>
          ))}
        </section>

        <section className="rounded-[30px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="mb-5">
            <p className="text-sm font-medium text-slate-400">Tra cứu booking</p>
            <h2 className="mt-1 text-xl font-bold text-white">Danh sách đặt chỗ</h2>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_190px_170px_170px_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={licensePlate}
                onChange={(event) => setLicensePlate(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') loadBookings(1);
                }}
                placeholder="Tìm theo biển số"
                className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400/60"
              />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as BookingStatus | '')}
              className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60"
              title="Từ ngày"
            />
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60"
              title="Đến ngày"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadBookings(1)}
                disabled={loading}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                Lọc
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"
                title="Đặt lại bộ lọc"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-slate-500">
                  <th className="pb-3 font-semibold">Booking</th>
                  <th className="pb-3 font-semibold">Khách hàng</th>
                  <th className="pb-3 font-semibold">Thời gian</th>
                  <th className="pb-3 font-semibold">Tầng</th>
                  <th className="pb-3 font-semibold">Số tiền</th>
                  <th className="pb-3 font-semibold">Trạng thái</th>
                  <th className="pb-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-sm text-slate-400">
                      <RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin text-blue-300" />
                      Đang tải booking...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-sm text-slate-400">
                      Không có booking phù hợp.
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking, index) => (
                    <motion.tr
                      key={booking.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.025 }}
                      className="hover:bg-white/[0.03]"
                    >
                      <td className="py-4">
                        <p className="font-bold tracking-wider text-white">{booking.licensePlate}</p>
                        <p className="mt-1 text-xs text-slate-500">#{booking.id} · {booking.prepaidHours} giờ</p>
                      </td>
                      <td className="py-4">
                        <p className="text-sm font-semibold text-slate-200">{booking.customerName || 'Khách vãng lai'}</p>
                        <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">{booking.customerEmail}</p>
                      </td>
                      <td className="py-4 text-sm text-slate-300">
                        <p>{formatDateTime(booking.startTime)}</p>
                        <p className="mt-1 text-xs text-slate-500">đến {formatDateTime(booking.endTime)}</p>
                      </td>
                      <td className="py-4 text-sm text-slate-300">Tầng {booking.floor?.floorNumber ?? booking.floorId}</td>
                      <td className="py-4 text-sm font-semibold text-white">{formatCurrency(booking.amount)}</td>
                      <td className="py-4">
                        <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', statusClasses[booking.status])}>
                          {statusLabels[booking.status]}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(booking)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10 text-blue-200 hover:bg-blue-400/20"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {['pending', 'confirmed'].includes(booking.status) && (
                            <button
                              type="button"
                              onClick={() => handleCancel(booking)}
                              disabled={cancellingId === booking.id}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/20 disabled:opacity-50"
                              title="Hủy booking"
                            >
                              {cancellingId === booking.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">
              Trang <span className="font-semibold text-white">{pagination.page}</span> /{' '}
              <span className="font-semibold text-white">{pagination.totalPages || 1}</span> · {pagination.total} booking
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadBookings(Math.max(1, pagination.page - 1))}
                disabled={loading || pagination.page <= 1}
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Trước
              </button>
              <button
                type="button"
                onClick={() => loadBookings(Math.min(pagination.totalPages || 1, pagination.page + 1))}
                disabled={loading || pagination.page >= (pagination.totalPages || 1)}
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 disabled:opacity-40"
              >
                Sau <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {selectedBooking && (
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
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#0F172A] p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-300">Booking #{selectedBooking.id}</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-wider text-white">{selectedBooking.licensePlate}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Khách hàng', value: selectedBooking.customerName || 'Khách vãng lai', icon: UserRound },
                  { label: 'Email', value: selectedBooking.customerEmail, icon: Mail },
                  { label: 'Điện thoại', value: selectedBooking.customerPhone || '--', icon: UserRound },
                  { label: 'Tòa nhà / tầng', value: `Tòa #${selectedBooking.floor?.buildingId ?? '--'} · Tầng ${selectedBooking.floor?.floorNumber ?? selectedBooking.floorId}`, icon: CalendarCheck },
                  { label: 'Bắt đầu', value: formatDateTime(selectedBooking.startTime), icon: Clock3 },
                  { label: 'Kết thúc', value: formatDateTime(selectedBooking.endTime), icon: Clock3 },
                  { label: 'Số tiền', value: formatCurrency(selectedBooking.amount), icon: CalendarCheck },
                  { label: 'Phiên gửi xe', value: selectedBooking.sessionId ? `#${selectedBooking.sessionId}` : 'Chưa check-in', icon: CalendarCheck },
                ].map((item) => (
                  <article key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      <item.icon className="h-4 w-4" /> {item.label}
                    </div>
                    <p className="break-words text-sm font-semibold text-white">{item.value}</p>
                  </article>
                ))}
              </div>

              {(selectedBooking.note || selectedBooking.staffNote) && (
                <div className="mt-4 space-y-3">
                  {selectedBooking.note && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ghi chú khách hàng</p>
                      <p className="mt-2 text-sm text-slate-200">{selectedBooking.note}</p>
                    </div>
                  )}
                  {selectedBooking.staffNote && (
                    <div className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">Ghi chú hệ thống</p>
                      <p className="mt-2 text-sm text-slate-200">{selectedBooking.staffNote}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', statusClasses[selectedBooking.status])}>
                  {statusLabels[selectedBooking.status]}
                </span>
                {['pending', 'confirmed'].includes(selectedBooking.status) && (
                  <button
                    type="button"
                    onClick={() => handleCancel(selectedBooking)}
                    disabled={cancellingId === selectedBooking.id}
                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 text-sm font-semibold text-red-200 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Hủy booking
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

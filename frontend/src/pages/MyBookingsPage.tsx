import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CalendarClock,
  Car,
  Clock3,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { bookingService, type Booking, type BookingStatus } from '../services/booking.service';

const formatCurrency = (value: string | number) =>
  Number(value).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

const statusLabels: Record<BookingStatus, string> = {
  pending: 'Chờ thanh toán',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  expired: 'Đã hết hạn',
};

const statusClasses: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-200 text-slate-600',
  expired: 'bg-red-100 text-red-700',
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeBookings = useMemo(
    () => bookings.filter((booking) => ['pending', 'confirmed'].includes(booking.status)),
    [bookings]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    let cancelled = false;

    async function loadBookings() {
      if (!isAuthenticated) return;
      setLoading(true);
      setError(null);
      try {
        const result = await bookingService.getMine();
        if (!cancelled) setBookings(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Không tải được danh sách đặt chỗ.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBookings();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleCancel = async (bookingId: number) => {
    setCancellingId(bookingId);
    setError(null);
    try {
      const updated = await bookingService.cancelBooking(bookingId);
      setBookings((current) => current.map((booking) => (booking.id === bookingId ? updated : booking)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể hủy đặt chỗ.');
    } finally {
      setCancellingId(null);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f8fbff] text-slate-900">
        <div className="h-10 w-10 rounded-full border-2 border-blue-400/30 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fbff] pt-28 text-slate-950">
      <main className="container mx-auto px-6 pb-20 md:px-12">
        <section className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Đặt chỗ của tôi</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Theo dõi booking của {user?.fullName ?? 'bạn'}
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg font-light leading-8 text-slate-600">
            Kiểm tra trạng thái thanh toán, thời gian gửi xe và hủy các booking chưa hoàn tất khi cần.
          </p>
        </section>

        <section className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <ReceiptText className="mb-3 h-6 w-6 text-blue-600" />
            <p className="text-sm font-semibold text-slate-500">Tổng booking</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{bookings.length}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <Clock3 className="mb-3 h-6 w-6 text-emerald-600" />
            <p className="text-sm font-semibold text-slate-500">Đang hiệu lực</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{activeBookings.length}</p>
          </div>
          <Link
            to="/booking"
            className="flex min-h-[132px] items-center justify-center gap-3 rounded-[24px] border border-blue-200 bg-blue-600 p-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            <Plus className="h-5 w-5" />
            Tạo đặt chỗ mới
          </Link>
        </section>

        {error && (
          <div className="mx-auto mt-6 flex max-w-6xl gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <section className="mx-auto mt-8 max-w-6xl">
          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-[28px] border border-slate-200 bg-white py-16 text-sm font-semibold text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
              Đang tải danh sách đặt chỗ
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <Car className="mx-auto mb-4 h-10 w-10 text-blue-600" />
              <h2 className="text-2xl font-black text-slate-950">Bạn chưa có booking nào</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Tạo booking vãng lai để thanh toán trước và nhân viên có thể nhận diện biển số khi check-in.
              </p>
              <Link
                to="/booking"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500"
              >
                <Plus className="h-4 w-4" />
                Đặt chỗ ngay
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {bookings.map((booking, index) => (
                <motion.article
                  key={booking.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                        <Car className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-black tracking-widest text-slate-950">{booking.licensePlate}</h2>
                          <span className={cn('rounded-full px-3 py-1 text-xs font-bold', statusClasses[booking.status])}>
                            {statusLabels[booking.status]}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          Booking #{booking.id} · Tầng {booking.floor?.floorNumber ?? booking.floorId} · {booking.prepaidHours} giờ trả trước
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {['pending', 'confirmed'].includes(booking.status) && (
                        <button
                          type="button"
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {cancellingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          Hủy
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <CalendarClock className="mb-2 h-5 w-5 text-blue-600" />
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Bắt đầu</p>
                      <p className="mt-1 text-sm font-bold text-slate-950">{formatDateTime(booking.startTime)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <Clock3 className="mb-2 h-5 w-5 text-blue-600" />
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Kết thúc</p>
                      <p className="mt-1 text-sm font-bold text-slate-950">{formatDateTime(booking.endTime)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <ReceiptText className="mb-2 h-5 w-5 text-blue-600" />
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Số tiền</p>
                      <p className="mt-1 text-sm font-bold text-slate-950">{formatCurrency(booking.amount)}</p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

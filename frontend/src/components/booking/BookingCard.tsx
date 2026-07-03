import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Car, Clock3, Loader2, Mail, ReceiptText, Timer, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Booking } from '../../services/booking.service';
import { bookingStatusClasses, bookingStatusLabels, formatBookingCurrency, formatBookingDateTime } from './booking.utils';

interface Props { booking: Booking; index: number; cancelling: boolean; onCancel: (id: number) => void; }

const pendingTtlMs = 15 * 60 * 1000;

function getPendingRemainingMs(createdAt: string) {
  const createdAtMs = new Date(createdAt).getTime();
  return Number.isFinite(createdAtMs) ? Math.max(0, createdAtMs + pendingTtlMs - Date.now()) : null;
}

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function BookingCard({ booking, index, cancelling, onCancel }: Props) {
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const [pendingRemainingMs, setPendingRemainingMs] = useState<number | null>(() =>
    booking.status === 'pending' ? getPendingRemainingMs(booking.createdAt) : null
  );

  useEffect(() => {
    if (booking.status !== 'pending') {
      return;
    }

    const updateCountdown = () => setPendingRemainingMs(getPendingRemainingMs(booking.createdAt));
    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(intervalId);
  }, [booking.createdAt, booking.status]);

  return (
    <motion.article initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: index * 0.03 }} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Car className="h-6 w-6" /></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black tracking-widest">{booking.licensePlate}</h2><span className={cn('rounded-full px-3 py-1 text-xs font-bold', bookingStatusClasses[booking.status])}>{bookingStatusLabels[booking.status]}</span></div><p className="mt-1 text-sm text-slate-500">Booking #{booking.id} · Tầng {booking.floor?.floorNumber ?? booking.floorId} · {booking.prepaidHours} giờ trả trước</p></div></div>
        {canCancel && <button type="button" onClick={() => onCancel(booking.id)} disabled={cancelling} className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 disabled:opacity-60">{cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}Hủy</button>}
      </div>
      {booking.status === 'pending' && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Timer className="h-5 w-5 shrink-0" />
          <span className="font-semibold">Thời gian thanh toán còn lại:</span>
          <span className="rounded-full border border-amber-300 bg-white px-3 py-1 font-mono text-sm font-black tabular-nums">
            {pendingRemainingMs === null
              ? '--:--'
              : pendingRemainingMs > 0
                ? formatRemaining(pendingRemainingMs)
                : 'Đã hết hạn'}
          </span>
        </div>
      )}
      <div className="mt-5 grid gap-3 md:grid-cols-3"><Detail icon={CalendarClock} label="Bắt đầu" value={formatBookingDateTime(booking.startTime)} /><Detail icon={Clock3} label="Kết thúc" value={formatBookingDateTime(booking.endTime)} /><Detail icon={ReceiptText} label="Số tiền" value={formatBookingCurrency(booking.amount)} /></div>
      <div className="mt-3"><Detail icon={Mail} label="Email xác nhận" value={booking.customerEmail || '--'} /></div>
    </motion.article>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof CalendarClock; label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><Icon className="mb-2 h-5 w-5 text-blue-600" /><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-1 break-all text-sm font-bold">{value}</p></div>; }

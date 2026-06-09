import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, MapPin, Banknote, X } from 'lucide-react';

interface SuccessData {
  type: 'checkin' | 'checkout';
  sessionId: number;
  licensePlate: string;
  slotCode: string;
  entryTime: string;
  exitTime?: string;
  durationMinutes?: number;
  fee?: number;
  vehicleType?: 'car' | 'motorcycle';
}

interface SuccessOverlayProps {
  data: SuccessData | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h} giờ ${m} phút`;
  return `${m} phút`;
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function SuccessOverlay({ data, onDismiss, autoDismissMs = 3500 }: SuccessOverlayProps) {
  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [data, autoDismissMs, onDismiss]);

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md mx-4 rounded-[32px] border border-white/10 bg-[#0F172A] p-8 shadow-2xl shadow-black/60"
          >
            {/* Close */}
            <button
              onClick={onDismiss}
              className="absolute right-5 top-5 rounded-xl p-1.5 text-slate-500 hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon */}
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-emerald-500/30 to-teal-500/20 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>

            {/* Title */}
            <h2 className="text-center text-2xl font-bold text-white mb-1">
              {data.type === 'checkin' ? 'Check-In Thành Công!' : 'Check-Out Thành Công!'}
            </h2>
            <p className="text-center text-sm text-slate-500 mb-6">
              {data.type === 'checkin' ? 'Xe đã được ghi nhận vào bãi.' : 'Phiên gửi xe đã kết thúc.'}
            </p>

            {/* Plate */}
            <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/60 mb-1">Biển Số</p>
              <p className="text-3xl font-bold tracking-widest text-emerald-300">{data.licensePlate}</p>
            </div>

            {/* Details grid */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="text-xs text-slate-500 w-24 shrink-0">Vị trí</span>
                <span className="text-sm font-semibold text-white">{data.slotCode}</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <Clock className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="text-xs text-slate-500 w-24 shrink-0">
                  {data.type === 'checkin' ? 'Giờ vào' : 'Giờ vào'}
                </span>
                <span className="text-sm font-semibold text-white">{formatTime(data.entryTime)}</span>
              </div>
              {data.exitTime && (
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <Clock className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="text-xs text-slate-500 w-24 shrink-0">Giờ ra</span>
                  <span className="text-sm font-semibold text-white">{formatTime(data.exitTime)}</span>
                </div>
              )}
              {data.durationMinutes !== undefined && (
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <Clock className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="text-xs text-slate-500 w-24 shrink-0">Thời gian</span>
                  <span className="text-sm font-semibold text-white">{formatDuration(data.durationMinutes)}</span>
                </div>
              )}
              {data.fee !== undefined && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
                  <Banknote className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-xs text-slate-500 w-24 shrink-0">Phí đã thu</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {data.fee === 0 ? '0 VNĐ (Cư dân)' : formatVND(data.fee)}
                  </span>
                </div>
              )}
            </div>

            {/* Auto-dismiss hint */}
            <p className="mt-6 text-center text-xs text-slate-600">
              Tự động đóng sau {Math.round(autoDismissMs / 1000)}s · Bấm bất kỳ đâu để đóng
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

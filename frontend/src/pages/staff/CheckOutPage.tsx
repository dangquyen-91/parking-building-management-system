import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Banknote,
  BadgeCheck,
  CreditCard,
  Loader2,
  LogOut,
  X,
  Zap,
} from 'lucide-react';
import { KioskLayout } from '../../components/kiosk/KioskLayout';
import { SuccessOverlay } from '../../components/kiosk/SuccessOverlay';
import { cn } from '../../lib/utils';
import { checkOut, lookupVehicle } from '../../services/kiosk.service';
import type { CheckOutApiResponse, PaymentMethod } from '../../types/kiosk';
import { useKioskHotkeys } from '../../hooks/useKioskHotkeys';

interface SuccessData {
  type: 'checkout';
  sessionId: number;
  licensePlate: string;
  slotCode: string;
  entryTime: string;
  exitTime?: string;
  durationMinutes?: number;
  fee?: number;
  vehicleType?: 'car' | 'motorcycle';
}

function PaymentMethodButton({
  value,
  selected,
  icon: Icon,
  label,
  description,
  onClick,
}: {
  value: PaymentMethod;
  selected: boolean;
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: (value: PaymentMethod) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cn(
        'flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-150',
        selected
          ? 'border-blue-400/60 bg-blue-500/15 text-white shadow-[0_0_0_1px_rgba(96,165,250,0.25)]'
          : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-blue-400/30 hover:bg-white/[0.06]'
      )}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', selected ? 'text-blue-300' : 'text-slate-500')} />
      <span>
        <span className="block text-sm font-bold">{label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
      {selected && (
        <span className="ml-auto mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}

export default function CheckOutPage() {
  const [searchParams] = useSearchParams();
  const [plate, setPlate] = useState(() => searchParams.get('plate')?.toUpperCase() ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus khi focusTrigger thay đổi
  useEffect(() => {
    inputRef.current?.focus();
  }, [focusTrigger]);

  const handleClear = useCallback(() => {
    setPlate('');
    setError(null);
    setPaymentMethod('cash');
    setFocusTrigger((v) => v + 1);
  }, []);

  const handleCheckout = useCallback(async () => {
    const trimmed = plate.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Bước 1: lookup để lấy sessionId
      const lookup = await lookupVehicle(trimmed);

      if (!lookup.activeSession) {
        setError('Biển số này chưa có phiên gửi xe đang hoạt động trong bãi.');
        return;
      }

      const sessionId = lookup.activeSession.id;

      // Bước 2: checkout ngay lập tức
      const result: CheckOutApiResponse = await checkOut(sessionId, { paymentMethod });

      // Nếu VNPay → redirect sang cổng thanh toán
      if (result.paymentMethod === 'vnpay' && result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }

      // Lấy thông tin vị trí từ activeSession
      const activeSession = lookup.activeSession;
      const spotCode =
        activeSession.slot?.slotCode ??
        activeSession.row?.rowCode ??
        activeSession.slotCode ??
        activeSession.rowCode ??
        '--';
      const floor =
        activeSession.slot?.floor ?? activeSession.row?.floor ?? null;
      const floorText = floor?.floorNumber ? `Tầng ${floor.floorNumber}` : null;
      const buildingText = floor?.building?.name ?? null;
      const locationCode = [spotCode, floorText, buildingText].filter(Boolean).join(' · ');

      setSuccess({
        type: 'checkout',
        sessionId: result.sessionId,
        licensePlate: result.licensePlate,
        slotCode: locationCode || '--',
        entryTime: result.entryTime,
        exitTime: result.exitTime ?? undefined,
        durationMinutes: result.durationMinutes,
        fee: result.fee,
        vehicleType: result.vehicleType,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thực hiện checkout. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }, [plate, paymentMethod, isSubmitting]);

  const handleDismissSuccess = useCallback(() => {
    setSuccess(null);
    handleClear();
  }, [handleClear]);

  useKioskHotkeys({
    onEscape: handleClear,
    onCtrlL: handleClear,
  });

  const canSubmit = plate.trim().length > 0 && !isSubmitting;

  return (
    <KioskLayout
      eyebrow="Staff Kiosk"
      title="Xe Ra Bãi"
      subtitle="Nhập biển số, chọn thanh toán và checkout ngay"
    >
      {/* Hotkey hints */}
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        {[
          { key: 'F1', label: 'Check-In' },
          { key: 'F2', label: 'Check-Out' },
          { key: 'Enter', label: 'Checkout ngay' },
          { key: 'Esc', label: 'Xóa' },
        ].map(({ key, label }) => (
          <span key={key} className="flex items-center gap-1">
            <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-slate-500">
              {key}
            </kbd>
            <span className="text-slate-700">{label}</span>
          </span>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.6fr)]">
        {/* ── Left: Form ── */}
        <div className="space-y-5">
          {/* All-in-one card: input + payment + checkout button */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20">
                <LogOut className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <h2 className="font-bold text-white">Xe Ra Bãi</h2>
                <p className="text-xs text-slate-500">Nhập biển số, chọn thanh toán và bấm checkout</p>
              </div>
            </div>

            {/* Plate input */}
            <div className="relative mb-4">
              <input
                ref={inputRef}
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) { e.preventDefault(); handleCheckout(); } }}
                disabled={isSubmitting}
                placeholder="Nhập biển số xe… (VD: 51A-12345)"
                aria-label="Biển số xe"
                className={cn(
                  'h-16 w-full rounded-2xl border bg-white/[0.04] pl-6 pr-14',
                  'text-2xl font-bold tracking-widest text-white placeholder:text-slate-600',
                  'outline-none transition-all duration-200',
                  'border-white/10 hover:border-white/20',
                  'focus:border-orange-400/60 focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(251,146,60,0.12)]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              />
              {plate && !isSubmitting && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Payment method */}
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Hình thức thanh toán
            </p>
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <PaymentMethodButton
                value="cash"
                selected={paymentMethod === 'cash'}
                icon={Banknote}
                label="Tiền mặt"
                description="Thu tiền tại cổng, đóng session ngay."
                onClick={setPaymentMethod}
              />
              <PaymentMethodButton
                value="vnpay"
                selected={paymentMethod === 'vnpay'}
                icon={CreditCard}
                label="VNPay"
                description="Chuyển sang cổng thanh toán VNPay."
                onClick={setPaymentMethod}
              />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 flex gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Single checkout button */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={!canSubmit}
              className={cn(
                'group relative inline-flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl px-6 text-base font-bold text-white shadow-lg transition-all duration-150',
                'disabled:cursor-not-allowed disabled:opacity-40',
                paymentMethod === 'vnpay'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-600/25 hover:from-blue-500 hover:to-cyan-500 hover:shadow-blue-500/30'
                  : 'bg-gradient-to-r from-orange-600 to-red-600 shadow-orange-600/25 hover:from-orange-500 hover:to-red-500 hover:shadow-orange-500/30'
              )}
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              {isSubmitting ? (
                <><Loader2 className="h-5 w-5 animate-spin" /><span>Đang xử lý checkout...</span></>
              ) : (
                <><Zap className="h-5 w-5" /><span>{paymentMethod === 'vnpay' ? 'Checkout & Thanh Toán VNPay' : 'Checkout & Thu Tiền Mặt'}</span></>
              )}
            </button>

            <p className="mt-3 text-xs text-slate-600 text-center">
              * Gói cư dân / booking đặt trước → phí tự động 0 VNĐ
            </p>
          </motion.section>
        </div>

        {/* ── Right: Hướng dẫn ── */}
        <aside className="space-y-5">
          <div className="rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-orange-400" />
              <h3 className="font-bold text-white">Luồng checkout</h3>
            </div>
            <ol className="space-y-3 text-sm text-slate-400">
              {[
                { num: 1, text: 'Nhập biển số xe cần ra bãi.' },
                { num: 2, text: 'Chọn hình thức thanh toán: Tiền mặt hoặc VNPay.' },
                { num: 3, text: 'Bấm Checkout — hệ thống xử lý ngay lập tức.' },
                { num: 4, text: 'Xác nhận kết quả trên màn hình thông báo.' },
              ].map(({ num, text }) => (
                <li key={num} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
                    {num}
                  </span>
                  <span className="leading-6">{text}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ghi nhớ</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span><strong className="text-emerald-300">Gói cư dân / Booking</strong>: Phí 0 VNĐ, đóng session ngay.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                <span><strong className="text-amber-300">Tiền mặt</strong>: Thu tiền và đóng session tức thì.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                <span><strong className="text-blue-300">VNPay</strong>: Redirect sang cổng thanh toán, session đóng khi IPN xác nhận.</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <SuccessOverlay data={success} onDismiss={handleDismissSuccess} />
    </KioskLayout>
  );
}

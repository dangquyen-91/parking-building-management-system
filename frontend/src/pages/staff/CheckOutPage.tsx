import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Car,
  Clock,
  CreditCard,
  Loader2,
  LogOut,
  MapPin,
  Motorbike,
  Receipt,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { KioskLayout } from '../../components/kiosk/KioskLayout';
import { PlateSearchBar } from '../../components/kiosk/PlateSearchBar';
import { SuccessOverlay } from '../../components/kiosk/SuccessOverlay';
import { cn } from '../../lib/utils';
import { checkOut, getCheckoutPreview, lookupVehicle } from '../../services/kiosk.service';
import type { CheckOutApiResponse, CheckoutPreviewApiResponse, LookupActiveSession, PaymentMethod } from '../../types/kiosk';
import { useKioskHotkeys } from '../../hooks/useKioskHotkeys';

const formatCurrency = (value: number | string) =>
  Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins} phút`;
  return `${hours} giờ ${mins} phút`;
};

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

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <Icon className="h-4 w-4 shrink-0 text-slate-500" />
      <span className="w-28 shrink-0 text-xs text-slate-500">{label}</span>
      <span className="truncate text-sm font-semibold text-white">{value}</span>
    </div>
  );
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
        'flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition',
        selected
          ? 'border-blue-400/60 bg-blue-500/15 text-white'
          : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-blue-400/30'
      )}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', selected ? 'text-blue-300' : 'text-slate-500')} />
      <span>
        <span className="block text-sm font-bold">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
    </button>
  );
}

export default function CheckOutPage() {
  const [plate, setPlate] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<LookupActiveSession | null>(null);
  const [preview, setPreview] = useState<CheckoutPreviewApiResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [focusTrigger, setFocusTrigger] = useState(0);

  const handleClear = useCallback(() => {
    setPlate('');
    setError(null);
    setActiveSession(null);
    setPreview(null);
    setPaymentMethod('cash');
    setFocusTrigger((value) => value + 1);
  }, []);

  const handleSearch = useCallback(async () => {
    const trimmed = plate.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setError(null);
    setActiveSession(null);
    setPreview(null);
    setPaymentMethod('cash');

    try {
      const lookup = await lookupVehicle(trimmed);
      if (!lookup.activeSession) {
        setError('Biển số này chưa có phiên gửi xe đang hoạt động.');
        return;
      }

      const quote = await getCheckoutPreview(lookup.activeSession.id);
      setActiveSession(lookup.activeSession);
      setPreview(quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tra cứu checkout.');
    } finally {
      setIsSearching(false);
    }
  }, [plate]);

  const handleCheckout = async () => {
    if (!preview || !activeSession) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const effectiveMethod: PaymentMethod = preview.fee === 0 || preview.covered ? 'cash' : paymentMethod;
      const result: CheckOutApiResponse = await checkOut(preview.sessionId, { paymentMethod: effectiveMethod });

      if (result.paymentMethod === 'vnpay' && result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }

      setSuccess({
        type: 'checkout',
        sessionId: result.sessionId,
        licensePlate: result.licensePlate,
        slotCode: activeSession.slotCode ?? activeSession.rowCode ?? '--',
        entryTime: result.entryTime,
        exitTime: result.exitTime ?? undefined,
        durationMinutes: result.durationMinutes,
        fee: result.fee,
        vehicleType: result.vehicleType,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể checkout phiên gửi xe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissSuccess = useCallback(() => {
    setSuccess(null);
    handleClear();
  }, [handleClear]);

  useKioskHotkeys({
    onEscape: handleClear,
    onCtrlL: handleClear,
  });

  const covered = Boolean(preview?.covered || preview?.fee === 0);
  const locationCode = activeSession?.slotCode ?? activeSession?.rowCode ?? '--';

  return (
    <KioskLayout
      eyebrow="Staff Kiosk"
      title="Xe Ra Bãi"
      subtitle="Tra cứu biển số, xem phí và xác nhận checkout"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.65fr)]">
        <div className="space-y-5">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
                <Search className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="font-bold text-white">Tra cứu xe đang trong bãi</h2>
                <p className="text-xs text-slate-500">GET /parking-sessions/lookup, sau đó preview checkout</p>
              </div>
            </div>

            <PlateSearchBar
              value={plate}
              onChange={setPlate}
              onSearch={handleSearch}
              onClear={handleClear}
              isLoading={isSearching}
              autoFocusTrigger={focusTrigger}
            />

            {error && (
              <div className="mt-4 flex gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </motion.section>

          {preview && activeSession && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
            >
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
                    covered ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  )}>
                    {covered ? <ShieldCheck className="h-6 w-6" /> : <Receipt className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{preview.licensePlate}</h3>
                      <span className={cn(
                        'rounded-full border px-3 py-1 text-xs font-bold',
                        covered
                          ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                          : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                      )}>
                        {covered ? 'Được bao bởi gói' : 'Cần thanh toán'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {preview.vehicleType === 'car' ? 'Ô tô' : 'Xe máy'} · {preview.floorType === 'resident' ? 'Tầng cư dân' : 'Tầng vãng lai'}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Phí checkout</p>
                  <p className={cn('mt-1 text-2xl font-extrabold', covered ? 'text-emerald-300' : 'text-white')}>
                    {formatCurrency(preview.fee)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <DetailRow icon={Clock} label="Giờ vào" value={formatDate(preview.entryTime)} />
                <DetailRow icon={Clock} label="Thời lượng" value={formatDuration(preview.durationMinutes)} />
                <DetailRow icon={MapPin} label="Vị trí" value={locationCode} />
                <DetailRow
                  icon={preview.vehicleType === 'car' ? Car : Motorbike}
                  label="Phương tiện"
                  value={preview.vehicleType === 'car' ? 'Ô tô' : 'Xe máy'}
                />
              </div>

              {covered ? (
                <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                  Xe này được bao bởi {preview.coveredBy === 'booking' ? 'booking trả trước' : 'gói cư dân active'}.
                  Checkout sẽ đóng session ngay và không thu thêm tiền.
                </div>
              ) : (
                <div className="mt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Hình thức thanh toán</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <PaymentMethodButton
                      value="cash"
                      selected={paymentMethod === 'cash'}
                      icon={Banknote}
                      label="Tiền mặt"
                      description="Thu tiền tại cổng, backend đóng session ngay."
                      onClick={setPaymentMethod}
                    />
                    <PaymentMethodButton
                      value="vnpay"
                      selected={paymentMethod === 'vnpay'}
                      icon={CreditCard}
                      label="VNPay"
                      description="Tạo payment pending và chuyển sang cổng VNPay."
                      onClick={setPaymentMethod}
                    />
                  </div>
                </div>
              )}

              {preview.breakdown && (
                <div className="mt-5 grid gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">Phí nền</p>
                    <p className="mt-1 font-bold text-white">{formatCurrency(preview.breakdown.baseFee ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phụ thu đêm</p>
                    <p className="mt-1 font-bold text-white">{formatCurrency(preview.breakdown.overnightFee ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Số đêm</p>
                    <p className="mt-1 font-bold text-white">{preview.breakdown.overnightNights ?? 0}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className={cn(
                  'mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50',
                  covered ? 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-500' : 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-500'
                )}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                {covered ? 'Xác nhận checkout cư dân' : paymentMethod === 'vnpay' ? 'Tạo thanh toán VNPay' : 'Thu tiền mặt và checkout'}
              </button>
            </motion.section>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-blue-400" />
              <h3 className="font-bold text-white">Luồng checkout</h3>
            </div>
            <ol className="space-y-3 text-sm text-slate-400">
              {[
                'Nhập biển số xe đang trong bãi.',
                'Preview phí để biết cư dân hay visitor.',
                'Cư dân hoặc booking còn giờ: checkout phí 0.',
                'Visitor có phí: chọn tiền mặt hoặc VNPay.',
              ].map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-300">
                    {index + 1}
                  </span>
                  <span className="leading-6">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ghi nhớ</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Với VNPay, backend giữ session active cho tới khi IPN hoặc query xác nhận thành công. Với tiền mặt và gói cư dân,
              session được đóng ngay khi xác nhận.
            </p>
          </div>
        </aside>
      </div>

      <SuccessOverlay data={success} onDismiss={handleDismissSuccess} />
    </KioskLayout>
  );
}

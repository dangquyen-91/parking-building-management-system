import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Car, Clock, HelpCircle, Motorbike } from 'lucide-react';
import { KioskLayout } from '../../components/kiosk/KioskLayout';
import { PlateSearchBar } from '../../components/kiosk/PlateSearchBar';
import { LookupResultPanel } from '../../components/kiosk/LookupResultPanel';
import { SuccessOverlay } from '../../components/kiosk/SuccessOverlay';
import { useKioskHotkeys } from '../../hooks/useKioskHotkeys';
import { lookupVehicle } from '../../services/kiosk.service';
import type { LookupApiResponse } from '../../types/kiosk';

interface SuccessData {
  type: 'checkin';
  sessionId: number;
  licensePlate: string;
  slotCode: string;
  entryTime: string;
}

function InfoCard({ icon: Icon, label, value, tone = 'blue' }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: 'blue' | 'emerald' | 'amber' | 'purple';
}) {
  const colors = {
    blue: 'from-blue-500/20 to-cyan-500/10 text-blue-300',
    emerald: 'from-emerald-500/20 to-teal-500/10 text-emerald-300',
    amber: 'from-amber-500/20 to-orange-500/10 text-amber-300',
    purple: 'from-purple-500/20 to-blue-500/10 text-purple-300',
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0F172A]/80 p-5 backdrop-blur-xl">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colors[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

const HOW_TO = [
  { step: '1', text: 'Nhập biển số xe vào ô tìm kiếm (tự động IN HOA)' },
  { step: '2', text: 'Bấm Enter hoặc nút Tra Cứu' },
  { step: '3', text: 'Hệ thống tự phân loại: Cư dân / Đặt trước / Vãng lai' },
  { step: '4', text: 'Xác nhận hành động phù hợp — hệ thống ghi nhận giờ vào tự động' },
];

export default function CheckInPage() {
  const [plate, setPlate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<LookupApiResponse | null>(null);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [resultKey, setResultKey] = useState(0);

  const handleClear = useCallback(() => {
    setPlate('');
    setLookupResult(null);
    setLookupError(null);
    setFocusTrigger((t) => t + 1);
  }, []);

  const handleSearch = useCallback(async () => {
    const trimmed = plate.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const result = await lookupVehicle(trimmed);
      setLookupResult(result);
      setResultKey((k) => k + 1);
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : 'Không thể tra cứu biển số. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [plate]);

  const handleSuccess = useCallback(
    (sessionId: number, licensePlate: string, slotCode: string, entryTime: string) => {
      setSuccess({ type: 'checkin', sessionId, licensePlate, slotCode, entryTime });
    },
    []
  );

  const handleDismissSuccess = useCallback(() => {
    setSuccess(null);
    handleClear();
  }, [handleClear]);

  useKioskHotkeys({
    onEscape: handleClear,
    onCtrlL: handleClear,
  });

  return (
    <KioskLayout
      eyebrow="Staff Kiosk"
      title="Xe Vào Bãi"
      subtitle="Tra cứu biển số để check-in · Phím F2 mở nhanh"
    >
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        {[
          { key: 'F1', label: 'Tổng quan' },
          { key: 'F2', label: 'Check-in' },
          { key: 'F3', label: 'Phiên gửi / Checkout' },
          { key: 'F4', label: 'Sơ đồ bãi' },
          { key: 'Esc', label: 'Xóa' },
          { key: 'Ctrl+L', label: 'Refocus' },
        ].map(({ key, label }) => (
          <span key={key} className="flex items-center gap-1">
            <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-slate-500">
              {key}
            </kbd>
            <span className="text-slate-700">{label}</span>
          </span>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">

        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20">
                <Car className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h2 className="font-bold text-white">Tra Cứu Biển Số</h2>
                <p className="text-xs text-slate-500">Tìm kiếm thông tin phương tiện trong hệ thống</p>
              </div>
            </div>

            <PlateSearchBar
              value={plate}
              onChange={setPlate}
              onSearch={handleSearch}
              onClear={handleClear}
              isLoading={isLoading}
              autoFocusTrigger={focusTrigger}
            />

            {lookupError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400"
              >
                {lookupError}
              </motion.div>
            )}
          </motion.div>

          {lookupResult && (
            <LookupResultPanel
              key={resultKey}
              lookup={lookupResult}
              onSuccess={handleSuccess}
            />
          )}

          {!lookupResult && !isLoading && !lookupError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.01] p-8 text-center"
            >
              <Car className="mx-auto mb-3 h-8 w-8 text-slate-700" />
              <p className="text-sm font-medium text-slate-600">Kết quả tra cứu sẽ hiển thị ở đây</p>
              <p className="mt-1 text-xs text-slate-700">Nhập biển số xe và bấm Enter</p>
            </motion.div>
          )}
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <InfoCard icon={Activity} label="Phiên đang hoạt động" value="—" tone="blue" />
            <InfoCard icon={Car} label="Chỗ ô tô còn trống" value={lookupResult?.availableSlots.car ?? '—'} tone="emerald" />
            <InfoCard icon={Motorbike} label="Tổng chỗ xe máy còn trống" value={lookupResult?.availableSlots.motorcycle ?? '—'} tone="amber" />
            <InfoCard icon={Clock} label="Thời gian hiện tại" value={new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} tone="purple" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
          >
            <div className="mb-4 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-400" />
              <h3 className="font-semibold text-white">Hướng dẫn Check-In</h3>
            </div>
            <ol className="space-y-3">
              {HOW_TO.map(({ step, text }) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                    {step}
                  </span>
                  <p className="text-sm text-slate-400 leading-relaxed">{text}</p>
                </li>
              ))}
            </ol>

            <div className="mt-5 rounded-xl border border-blue-400/10 bg-blue-400/5 p-4 text-xs leading-relaxed text-slate-500">
              <strong className="text-blue-400">Các trường hợp:</strong>
              <ul className="mt-2 space-y-1">
                <li>🟢 <strong className="text-emerald-400">Cư dân</strong> – Gói tháng hoạt động, phí = 0 VNĐ</li>
                <li>🔵 <strong className="text-blue-400">Đặt trước</strong> – Có booking pending/confirmed</li>
                <li>⚪ <strong className="text-slate-400">Vãng lai</strong> – Không có gói, không có booking</li>
                <li>🔴 <strong className="text-red-400">Đang trong bãi</strong> – Không thể check-in lại</li>
              </ul>
              <div className="mt-3 border-t border-white/5 pt-3">
                <strong className="text-amber-400">⚠️ Lưu ý grace period 30 phút:</strong>
                <ul className="mt-1.5 space-y-1">
                  <li>🟢 Đến trong vòng <strong className="text-white">30 phút trước giờ hẹn</strong> → check-in được theo booking</li>
                  <li>🟡 Đến <strong className="text-white">sớm hơn 30 phút</strong> → bỏ qua booking → <strong className="text-red-400">chỉ được vãng lai</strong></li>
                  <li>🔴 Đến sau giờ kết thúc booking → booking expired → <strong className="text-red-400">chỉ được vãng lai</strong></li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <SuccessOverlay data={success} onDismiss={handleDismissSuccess} />
    </KioskLayout>
  );
}

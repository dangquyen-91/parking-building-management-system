import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Home,
  Loader2,
  MapPin,
  Motorbike,
  Phone,
  SquareParking,
  User,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type {
  LookupApiResponse,
  ActiveSubscription,
  BookingApiItem,
  ParkingSlotApiItem,
  ParkingRowApiItem,
  VehicleType,
} from '../../types/kiosk';
import {
  checkActiveSubscription,
  searchPendingBookings,
  getAvailableSlots,
  getAvailableRows,
  checkIn,
  confirmBooking,
} from '../../services/kiosk.service';

// ─── Discriminated scenario union ─────────────────────────────────────────────
type CheckInScenario =
  | { kind: 'resolving' }
  | { kind: 'already_in'; lookup: LookupApiResponse }
  | { kind: 'resident'; lookup: LookupApiResponse; subscription: ActiveSubscription; availableSlots: ParkingSlotApiItem[]; availableRows: ParkingRowApiItem[] }
  | { kind: 'booking'; lookup: LookupApiResponse; booking: BookingApiItem; availableSlots: ParkingSlotApiItem[] }
  | { kind: 'walkin'; lookup: LookupApiResponse; availableSlots: ParkingSlotApiItem[]; availableRows: ParkingRowApiItem[]; isExpiredResident?: boolean };

interface LookupResultPanelProps {
  lookup: LookupApiResponse;
  onSuccess: (sessionId: number, plate: string, slotCode: string, entryTime: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function formatDateOnly(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN');
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function Badge({ label, tone }: { label: string; tone: 'green' | 'amber' | 'blue' | 'red' | 'slate' }) {
  const map = {
    green: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    amber: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    blue:  'border-blue-400/30 bg-blue-400/10 text-blue-300',
    red:   'border-red-400/30 bg-red-400/10 text-red-300',
    slate: 'border-white/10 bg-white/[0.05] text-slate-400',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold', map[tone])}>
      {label}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <Icon className="h-4 w-4 shrink-0 text-slate-500" />
      <span className="text-xs text-slate-500 w-28 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-white truncate">{value}</span>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="mb-3 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs text-red-400">
      {message}
    </div>
  );
}

// ─── Slot / Row Picker ────────────────────────────────────────────────────────
interface SlotPickerProps {
  vehicleType: VehicleType;
  slots: ParkingSlotApiItem[];
  rows: ParkingRowApiItem[];
  selectedSlotId: number | null;
  selectedRowId: number | null;
  onSelectSlot: (id: number) => void;
  onSelectRow: (id: number) => void;
}

function SlotPicker({ vehicleType, slots = [], rows = [], selectedSlotId, selectedRowId, onSelectSlot, onSelectRow }: SlotPickerProps) {
  if (vehicleType === 'car') {
    if (!slots.length) {
      return <p className="text-sm text-slate-500 py-2">Không còn chỗ trống cho ô tô.</p>;
    }
    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Chọn ô đỗ xe</p>
        <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
          {slots.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectSlot(s.id)}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-sm font-bold transition-all text-center',
                selectedSlotId === s.id
                  ? 'border-blue-400/60 bg-blue-500/20 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                  : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-blue-400/30 hover:text-white',
              )}
            >
              <SquareParking className="mx-auto mb-1 h-4 w-4" />
              {s.slotCode}
              {s.floor && (
                <span className="block text-[10px] font-normal text-slate-500">
                  T{s.floor.floorNumber}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return <p className="text-sm text-slate-500 py-2">Không còn hàng xe máy trống.</p>;
  }
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Chọn hàng xe máy</p>
      <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
        {rows.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelectRow(r.id)}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-sm font-bold transition-all text-left',
              selectedRowId === r.id
                ? 'border-blue-400/60 bg-blue-500/20 text-blue-300'
                : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-blue-400/30',
            )}
          >
            <div className="font-bold">{r.rowCode}</div>
            <div className="text-[10px] font-normal text-slate-500">
              {r.occupiedCount}/{r.capacity} chỗ
              {r.floor && ` · T${r.floor.floorNumber}`}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function LookupResultPanel({ lookup, onSuccess }: LookupResultPanelProps) {
  const [scenario, setScenario] = useState<CheckInScenario>({ kind: 'resolving' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Walk-in form state
  const [walkinVehicleType, setWalkinVehicleType] = useState<VehicleType>('car');
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  // Resident slot state (when subscription.slotId is null)
  const [residentSlotId, setResidentSlotId] = useState<number | null>(null);
  const [residentRowId, setResidentRowId] = useState<number | null>(null);

  // ── Resolve scenario on mount ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setScenario({ kind: 'resolving' });
      setSubmitError(null);

      // Step 1: Already checked in?
      if (lookup.status === 'active' && lookup.activeSession) {
        if (!cancelled) setScenario({ kind: 'already_in', lookup });
        return;
      }

      let isExpiredResident = false;

      // Step 2: Has linked resident? → check active subscription
      if (lookup.hint.linkedResident) {
        try {
          const subResult = await checkActiveSubscription(lookup.licensePlate);
          if (!cancelled && subResult.active && subResult.subscription) {
            const sub = subResult.subscription;
            const vt = sub.vehicleType;
            const [slotsRes, rowsRes] = await Promise.all([
              vt === 'car'
                ? getAvailableSlots('car')
                : Promise.resolve({ data: [] as ParkingSlotApiItem[] }),
              vt === 'motorcycle'
                ? getAvailableRows()
                : Promise.resolve({ data: [] as ParkingRowApiItem[] }),
            ]);
            if (!cancelled) {
              setScenario({ kind: 'resident', lookup, subscription: sub, availableSlots: slotsRes.data, availableRows: rowsRes.data });
              if (sub.slotId) setResidentSlotId(sub.slotId);
            }
            return;
          } else if (!cancelled && !subResult.active) {
            isExpiredResident = true;
          }
        } catch {
          // fall through
        }
      }

      // Step 3: Pending booking?
      try {
        const bookingResult = await searchPendingBookings(lookup.licensePlate);
        if (!cancelled && bookingResult.data.length > 0) {
          const booking = bookingResult.data[0];
          const slotsRes = await getAvailableSlots('car');
          if (!cancelled) setScenario({ kind: 'booking', lookup, booking, availableSlots: slotsRes.data });
          return;
        }
      } catch {
        // fall through
      }

      // Step 4: Walk-in
      const [slotsRes, rowsRes] = await Promise.all([
        getAvailableSlots('car'),
        getAvailableRows(),
      ]);
      if (!cancelled) {
        setScenario({ kind: 'walkin', lookup, availableSlots: slotsRes.data, availableRows: rowsRes.data, isExpiredResident });
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [lookup]);

  // ── Submit handlers ───────────────────────────────────────────────────────
  async function handleResidentCheckIn(sub: ActiveSubscription) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      let payload: Parameters<typeof checkIn>[0];
      if (sub.vehicleType === 'car') {
        const slotId = sub.slotId ?? residentSlotId;
        if (!slotId) { setSubmitError('Vui lòng chọn ô đỗ xe.'); return; }
        payload = { vehicleType: 'car', licensePlate: lookup.licensePlate, slotId, userId: sub.userId };
      } else {
        if (!residentRowId) { setSubmitError('Vui lòng chọn hàng xe máy.'); return; }
        payload = { vehicleType: 'motorcycle', licensePlate: lookup.licensePlate, rowId: residentRowId, userId: sub.userId };
      }
      const res = await checkIn(payload);
      onSuccess(res.id, res.licensePlate, res.slot?.slotCode ?? res.row?.rowCode ?? '—', res.entryTime);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Lỗi check-in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBookingCheckIn(booking: BookingApiItem) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await confirmBooking(booking.id, {
        slotId: selectedSlotId ?? undefined,
        staffNote: 'Xác nhận tại cổng',
      });
      const sessionId = res.session?.id ?? 0;
      const slotCode = res.slot?.slotCode ?? '—';
      const entryTime = res.session?.entryTime ?? new Date().toISOString();
      onSuccess(sessionId, res.licensePlate, slotCode, entryTime);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Lỗi xác nhận đặt chỗ.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleWalkinCheckIn() {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      let payload: Parameters<typeof checkIn>[0];
      if (walkinVehicleType === 'car') {
        if (!selectedSlotId) { setSubmitError('Vui lòng chọn ô đỗ xe.'); return; }
        payload = { vehicleType: 'car', licensePlate: lookup.licensePlate, slotId: selectedSlotId };
      } else {
        if (!selectedRowId) { setSubmitError('Vui lòng chọn hàng xe máy.'); return; }
        payload = { vehicleType: 'motorcycle', licensePlate: lookup.licensePlate, rowId: selectedRowId };
      }
      const res = await checkIn(payload);
      onSuccess(res.id, res.licensePlate, res.slot?.slotCode ?? res.row?.rowCode ?? '—', res.entryTime);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Lỗi check-in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (scenario.kind === 'resolving') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-10 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <p className="text-sm text-slate-400">Đang phân tích biển số…</p>
      </div>
    );
  }

  if (scenario.kind === 'already_in') {
    const s = scenario.lookup.activeSession!;
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-red-500/30 bg-red-500/[0.08] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-red-300">Xe đang trong bãi</h3>
            <p className="text-sm text-red-400/80">Biển số này đã có phiên gửi xe đang hoạt động.</p>
          </div>
        </div>
        <div className="space-y-2">
          <InfoRow icon={Clock} label="Vào lúc" value={formatDate(s.entryTime)} />
          {(s.slotCode || s.rowCode) && (
            <InfoRow icon={MapPin} label="Vị trí" value={s.slotCode ?? s.rowCode ?? '—'} />
          )}
          <InfoRow
            icon={s.vehicleType === 'car' ? Car : Motorbike}
            label="Loại xe"
            value={s.vehicleType === 'car' ? 'Ô tô' : 'Xe máy'}
          />
        </div>
        <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-xs text-red-400">
          ⚠️ Không thể check-in. Vui lòng xử lý phiên đang hoạt động trước.
        </div>
      </motion.div>
    );
  }

  if (scenario.kind === 'resident') {
    const { subscription: sub, availableSlots, availableRows } = scenario;
    const needsSlotPick = sub.vehicleType === 'car' && !sub.slotId;
    const needsRowPick = sub.vehicleType === 'motorcycle';

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-emerald-400/20 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
              <Home className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white">Cư Dân</h3>
                <Badge label="Gói Tháng" tone="green" />
              </div>
              <p className="mt-0.5 text-sm text-slate-400">{sub.user.fullName}</p>
            </div>
          </div>
          <Badge
            label={sub.vehicleType === 'car' ? 'Ô Tô' : 'Xe Máy'}
            tone={sub.vehicleType === 'car' ? 'blue' : 'amber'}
          />
        </div>

        <div className="space-y-2 mb-5">
          <InfoRow icon={BadgeCheck}    label="Gói dịch vụ"  value={sub.package.name} />
          <InfoRow icon={Phone}         label="Điện thoại"   value={sub.user.phone} />
          <InfoRow icon={Calendar}      label="Hết hạn"      value={formatDateOnly(sub.endDate)} />
          {sub.slot ? (
            <InfoRow icon={SquareParking} label="Ô đỗ cố định" value={sub.slot.slotCode} />
          ) : (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Chưa có ô đỗ cố định — vui lòng chọn bên dưới
            </div>
          )}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center gap-3">
            <Zap className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-xs text-slate-500 w-28 shrink-0">Phí gửi xe</span>
            <span className="text-sm font-bold text-emerald-400">0 VNĐ (Cư dân)</span>
          </div>
        </div>

        {(needsSlotPick || needsRowPick) && (
          <div className="mb-5">
            <SlotPicker
              vehicleType={sub.vehicleType}
              slots={availableSlots}
              rows={availableRows}
              selectedSlotId={residentSlotId}
              selectedRowId={residentRowId}
              onSelectSlot={setResidentSlotId}
              onSelectRow={setResidentRowId}
            />
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
          <Zap className="h-3 w-3" />
          {lookup.availableSlots.car} ô tô · {lookup.availableSlots.motorcycle} xe máy còn trống
        </div>

        {submitError && <ErrorAlert message={submitError} />}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
          onClick={() => handleResidentCheckIn(sub)}
          className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 font-semibold text-white shadow-[0_4px_20px_rgba(16,185,129,0.25)] transition-all hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý…</>
            : <><CheckCircle2 className="h-4 w-4" /> Xác Nhận Check-In Cư Dân</>}
        </motion.button>
      </motion.div>
    );
  }

  if (scenario.kind === 'booking') {
    const { booking, availableSlots } = scenario;
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-blue-400/20 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white">Khách Đặt Trước</h3>
                <Badge label="Có Booking" tone="blue" />
              </div>
              <p className="mt-0.5 text-sm text-slate-400">{booking.customerName}</p>
            </div>
          </div>
          <Badge label="Ô Tô" tone="blue" />
        </div>

        <div className="space-y-2 mb-5">
          <InfoRow icon={User}      label="Tên khách"  value={booking.customerName} />
          <InfoRow icon={Phone}     label="Điện thoại" value={booking.customerPhone} />
          <InfoRow
            icon={MapPin}
            label="Tầng"
            value={`Tầng ${booking.floor?.floorNumber ?? '—'} · ${booking.floor?.building?.name ?? ''}`}
          />
          {booking.startTime && (
            <InfoRow icon={Clock} label="Giờ hẹn" value={formatDate(booking.startTime)} />
          )}
        </div>

        <div className="mb-5">
          <SlotPicker
            vehicleType="car"
            slots={availableSlots}
            rows={[]}
            selectedSlotId={selectedSlotId}
            selectedRowId={null}
            onSelectSlot={setSelectedSlotId}
            onSelectRow={() => {}}
          />
        </div>

        {submitError && <ErrorAlert message={submitError} />}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
          onClick={() => handleBookingCheckIn(booking)}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 font-semibold text-white shadow-[0_4px_20px_rgba(37,99,235,0.25)] transition-all hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý…</>
            : <><CheckCircle2 className="h-4 w-4" /> Xác Nhận & Check-In Khách Đặt Trước</>}
        </motion.button>
      </motion.div>
    );
  }

  // Walk-in
  if (scenario.kind === 'walkin') {
    const { availableSlots, availableRows, isExpiredResident } = scenario;
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
      >
        {isExpiredResident && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-300">Cư dân nhưng gói gửi xe đã hết hạn</p>
              <p className="mt-1 text-xs text-amber-400/80">Khách này sẽ phải gửi xe theo diện khách vãng lai có tính phí.</p>
            </div>
          </div>
        )}

        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-500/20">
            <User className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white">Khách Vãng Lai</h3>
              <Badge label="Walk-in" tone="slate" />
            </div>
            {lookup.hint.linkedResident && (
              <p className="mt-0.5 text-xs text-slate-500">
                Từng ghé thăm: {lookup.hint.linkedResident.fullName}
              </p>
            )}
          </div>
        </div>

        {/* Available slots summary */}
        <div className="mb-4 flex gap-3">
          <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
            <Car className="mx-auto mb-1 h-4 w-4 text-blue-400" />
            <p className="text-lg font-bold text-white">{lookup.availableSlots.car}</p>
            <p className="text-[10px] text-slate-500">Chỗ ô tô</p>
          </div>
          <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-center">
            <Motorbike className="mx-auto mb-1 h-4 w-4 text-amber-400" />
            <p className="text-lg font-bold text-white">{lookup.availableSlots.motorcycle}</p>
            <p className="text-[10px] text-slate-500">Chỗ xe máy</p>
          </div>
        </div>

        {/* Vehicle type toggle */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Loại xe</p>
          <div className="flex gap-2">
            {(['car', 'motorcycle'] as VehicleType[]).map((vt) => (
              <button
                key={vt}
                type="button"
                onClick={() => {
                  setWalkinVehicleType(vt);
                  setSelectedSlotId(null);
                  setSelectedRowId(null);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all',
                  walkinVehicleType === vt
                    ? 'border-blue-400/60 bg-blue-500/20 text-blue-300'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white',
                )}
              >
                {vt === 'car' ? <Car className="h-4 w-4" /> : <Motorbike className="h-4 w-4" />}
                {vt === 'car' ? 'Ô Tô' : 'Xe Máy'}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <SlotPicker
            vehicleType={walkinVehicleType}
            slots={availableSlots}
            rows={availableRows}
            selectedSlotId={selectedSlotId}
            selectedRowId={selectedRowId}
            onSelectSlot={setSelectedSlotId}
            onSelectRow={setSelectedRowId}
          />
        </div>

        {submitError && <ErrorAlert message={submitError} />}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting || (walkinVehicleType === 'car' ? !selectedSlotId : !selectedRowId)}
          onClick={handleWalkinCheckIn}
          className="w-full rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 py-3.5 font-semibold text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all hover:from-slate-500 hover:to-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý…</>
            : <><CheckCircle2 className="h-4 w-4" /> Xác Nhận Check-In Vãng Lai</>}
        </motion.button>
      </motion.div>
    );
  }

  return null;
}

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
  ParkingRowApiItem,
  VehicleType,
} from '../../types/kiosk';
import {
  checkActiveSubscription,
  searchBookingsByPlate,
  getAvailableRows,
  checkIn,
} from '../../services/kiosk.service';
import { floorService, type Floor } from '../../services/floor.service';

// ─── Discriminated scenario union ─────────────────────────────────────────────
type CheckInScenario =
  | { kind: 'resolving' }
  | { kind: 'error'; message: string }
  | { kind: 'already_in'; lookup: LookupApiResponse }
  | { kind: 'resident'; lookup: LookupApiResponse; subscription: ActiveSubscription; availableRows: ParkingRowApiItem[]; residentFloor: Floor | null; residentFloors: Floor[] }
  | { kind: 'booking'; lookup: LookupApiResponse; booking: BookingApiItem }
  | { kind: 'walkin'; lookup: LookupApiResponse; visitorCarFloors: Floor[]; availableRows: ParkingRowApiItem[]; isExpiredResident?: boolean };

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

function getBookingCheckInState(booking: BookingApiItem) {
  const now = Date.now();
  const start = booking.startTime ? new Date(booking.startTime).getTime() : Number.NaN;
  const end = booking.endTime ? new Date(booking.endTime).getTime() : Number.NaN;

  if (booking.sessionId) return { canCheckIn: false, label: 'Đã check-in', tone: 'slate' as const };
  if (booking.status === 'pending') return { canCheckIn: false, label: 'Chờ thanh toán', tone: 'amber' as const };
  if (booking.status !== 'confirmed') return { canCheckIn: false, label: 'Không còn hiệu lực', tone: 'red' as const };
  if (Number.isNaN(start) || Number.isNaN(end)) return { canCheckIn: false, label: 'Thiếu thời gian', tone: 'red' as const };
  if (end < now) return { canCheckIn: false, label: 'Đã hết giờ', tone: 'red' as const };
  if (start > now) return { canCheckIn: true, label: 'Tới sớm', tone: 'amber' as const };

  return { canCheckIn: true, label: 'Sẵn sàng check-in', tone: 'green' as const };
}

function findDisplayBooking(bookings: BookingApiItem[]) {
  const now = Date.now();
  return bookings
    .filter((b) => ['pending', 'confirmed'].includes(b.status) && !b.sessionId)
    .filter((b) => !b.endTime || new Date(b.endTime).getTime() >= now)
    .sort((a, b) => {
      const aReady = getBookingCheckInState(a).canCheckIn ? 0 : 1;
      const bReady = getBookingCheckInState(b).canCheckIn ? 0 : 1;
      if (aReady !== bReady) return aReady - bReady;
      return new Date(a.startTime ?? 0).getTime() - new Date(b.startTime ?? 0).getTime();
    })[0] ?? null;
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function Badge({ label, tone }: { label: string; tone: 'green' | 'amber' | 'blue' | 'red' | 'slate' }) {
  const map = {
    green: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    amber: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    blue: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
    red: 'border-red-400/30 bg-red-400/10 text-red-300',
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

// ─── Floor Picker (for visitor car: counter-based, no slot needed) ────────────
function FloorPicker({
  floors,
  selectedFloorId,
  onSelect,
  label = 'Chọn tầng gửi xe',
}: {
  floors: Floor[];
  selectedFloorId: number | null;
  onSelect: (id: number) => void;
  label?: string;
}) {
  if (!floors.length) {
    return <p className="text-sm text-slate-500 py-2">Không còn tầng nào có chỗ trống.</p>;
  }
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
        {floors.map((floor) => (
          <button
            key={floor.id}
            type="button"
            onClick={() => onSelect(floor.id)}
            className={cn(
              'rounded-xl border px-3 py-3 text-sm font-bold transition-all text-left',
              selectedFloorId === floor.id
                ? 'border-blue-400/60 bg-blue-500/20 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-blue-400/30 hover:text-white',
            )}
          >
            <div className="flex items-center gap-2">
              <SquareParking className="h-4 w-4 shrink-0" />
              <div>
                <div>Tầng {floor.floorNumber}</div>
                <div className="text-[10px] font-normal text-slate-500 truncate">
                  {floor.building?.name}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Row Picker (for motorcycle: optional, BE auto-picks if none) ─────────────
function RowPicker({
  rows,
  selectedRowId,
  onSelect,
  label = 'Chọn hàng xe (tuỳ chọn)',
}: {
  rows: ParkingRowApiItem[];
  selectedRowId: number | null;
  onSelect: (id: number | null) => void;
  label?: string;
}) {
  const totalFree = rows.reduce((s, r) => s + Math.max(0, r.capacity - r.occupiedCount), 0);

  if (!rows.length) {
    return <p className="text-sm text-slate-500 py-2">Không còn hàng xe máy trống.</p>;
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
            <Motorbike className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Để trống → hệ thống tự chọn hàng phù hợp
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-white">{totalFree}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">chỗ</p>
        </div>
      </div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Chọn hàng cụ thể</p>
      <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
        {/* "Auto" option */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            'rounded-xl border px-3 py-2.5 text-sm font-bold transition-all text-left',
            selectedRowId === null
              ? 'border-blue-400/60 bg-blue-500/20 text-blue-300'
              : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white',
          )}
        >
          <div className="font-bold">Tự động</div>
          <div className="text-[10px] font-normal text-slate-500">BE chọn hàng</div>
        </button>

        {rows.map((r) => {
          const free = Math.max(0, r.capacity - r.occupiedCount);
          const isFull = free === 0;
          return (
            <button
              key={r.id}
              type="button"
              disabled={isFull}
              onClick={() => onSelect(r.id)}
              className={cn(
                'rounded-xl border px-3 py-2.5 text-sm font-bold transition-all text-left',
                selectedRowId === r.id
                  ? 'border-blue-400/60 bg-blue-500/20 text-blue-300'
                  : isFull
                    ? 'border-white/10 bg-white/[0.02] text-slate-600 cursor-not-allowed'
                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-blue-400/30',
              )}
            >
              <div className="font-bold">{r.rowCode}</div>
              <div className="text-[10px] font-normal text-slate-500">
                {r.occupiedCount}/{r.capacity} chỗ
                {r.floor && ` · T${r.floor.floorNumber}`}
                {isFull && ' · Đầy'}
              </div>
            </button>
          );
        })}
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
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);   // visitor car
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);        // motorcycle (optional)
  const [residentRowId, setResidentRowId] = useState<number | null>(null);        // resident motorcycle (optional)

  // ── Resolve scenario on mount ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setScenario({ kind: 'resolving' });
      setSubmitError(null);
      setSelectedFloorId(null);
      setSelectedRowId(null);
      setResidentRowId(null);

      // Step 1: Already checked in?
      if ((lookup.status === 'already_active' || lookup.status === 'active') && lookup.activeSession) {
        if (!cancelled) setScenario({ kind: 'already_in', lookup });
        return;
      }

      let isExpiredResident = false;

      // Step 2: Always check active subscription for EVERY plate.
      // NOTE: lookup.hint.linkedResident is set only if the plate has a prior
      // completed/cancelled session, so a brand-new subscriber with no session
      // history would have linkedResident = null and be wrongly sent to walk-in.
      // Fix: unconditionally check subscription regardless of linkedResident.
      try {
        const subResult = await checkActiveSubscription(lookup.licensePlate);
        if (!cancelled && subResult.active && subResult.subscription) {
          const sub = subResult.subscription;

          // Fetch resident floors + rows for motorcycle.
          // We ALWAYS store residentFloors so handleResidentCheckIn can pick
          // the correct floorId (a resident floor) without relying on row data.
          let availableRows: ParkingRowApiItem[] = [];
          let residentFloors: Floor[] = [];
          if (sub.vehicleType === 'motorcycle') {
            const floorsRes = await floorService.getFloors({ vehicleType: 'motorcycle', floorType: 'resident', isActive: true, page: 1, limit: 100 });
            residentFloors = floorsRes.floors;
            const floorIds = new Set(residentFloors.map((f) => f.id));
            const rowsRes = await getAvailableRows();
            availableRows = (rowsRes.data as ParkingRowApiItem[]).filter((r) => floorIds.has(r.floorId));
          }

          // For resident car: find the floor from subscription slot
          let residentFloor: Floor | null = null;
          if (sub.vehicleType === 'car' && sub.slot?.floorId) {
            const floorsRes = await floorService.getFloors({ vehicleType: 'car', floorType: 'resident', isActive: true, page: 1, limit: 100 });
            residentFloor = floorsRes.floors.find((f) => f.id === sub.slot?.floorId) ?? null;
          }

          if (!cancelled) {
            setScenario({ kind: 'resident', lookup, subscription: sub, availableRows, residentFloor, residentFloors });
          }
          return;
        }
        // Subscription check returned active: false → plate is an expired resident
        if (!cancelled && subResult.subscription && !subResult.active) {
          isExpiredResident = true;
        }
      } catch {
        // Subscription API error → treat as walk-in, don't crash the flow
        isExpiredResident = false;
      }

      // Step 3: Any active booking?
      try {
        const bookingResult = await searchBookingsByPlate(lookup.licensePlate);
        if (!cancelled && bookingResult.data.length > 0) {
          const booking = findDisplayBooking(bookingResult.data);
          if (booking) {
            if (!cancelled) setScenario({ kind: 'booking', lookup, booking });
            return;
          }
        }
      } catch {
        // Booking check failed → fall through to walk-in
      }

      // Step 4: Walk-in visitor
      try {
        // For visitor car: we only need floors (counter-based, no slot grid needed)
        const [carFloorsRes, motorcycleRowsRes] = await Promise.all([
          floorService.getFloors({ vehicleType: 'car', floorType: 'visitor', isActive: true, page: 1, limit: 100 }),
          (async () => {
            const mFloorsRes = await floorService.getFloors({ vehicleType: 'motorcycle', floorType: 'visitor', isActive: true, page: 1, limit: 100 });
            const floorIds = new Set(mFloorsRes.floors.map((f) => f.id));
            const rowsRes = await getAvailableRows();
            return (rowsRes.data as ParkingRowApiItem[]).filter((r) => floorIds.has(r.floorId));
          })(),
        ]);

        if (!cancelled) {
          setScenario({
            kind: 'walkin',
            lookup,
            visitorCarFloors: carFloorsRes.floors,
            availableRows: motorcycleRowsRes,
            isExpiredResident,
          });
          // Pre-select first visitor car floor
          if (carFloorsRes.floors.length > 0) setSelectedFloorId(carFloorsRes.floors[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          setScenario({
            kind: 'error',
            message: err instanceof Error ? err.message : 'Không tải được danh sách tầng. Vui lòng thử lại.',
          });
        }
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
      if (sub.vehicleType === 'car') {
        // Resident car: slot is fixed in subscription, backend resolves it
        // We just need floorId from sub.slot
        const floorId = sub.slot?.floorId ?? null;
        if (!floorId) {
          setSubmitError('Không xác định được tầng check-in. Vui lòng liên hệ admin kiểm tra gói cư dân.');
          return;
        }
        const res = await checkIn({ vehicleType: 'car', licensePlate: lookup.licensePlate, floorId, userId: sub.userId });
        onSuccess(res.id, res.licensePlate, res.slot?.slotCode ?? '—', res.entryTime);
      } else {
        // Resident motorcycle: floorId MUST be a resident floor.
        // Derive it from residentFloors (guaranteed resident), NOT from rows
        // (rows can be empty or could include visitor floors after a filter bug).
        const residentScenario = scenario.kind === 'resident' ? scenario : null;

        // Priority 1: floor from the selected row
        // Priority 2: first available resident floor
        const selectedRow = residentScenario?.availableRows.find((r) => r.id === residentRowId);
        const floorId =
          selectedRow?.floorId ??
          residentScenario?.residentFloors[0]?.id ??
          null;

        if (!floorId) {
          setSubmitError('Không tìm thấy tầng xe máy cư dân. Vui lòng liên hệ admin kiểm tra cấu hình tầng.');
          return;
        }
        const res = await checkIn({
          vehicleType: 'motorcycle',
          licensePlate: lookup.licensePlate,
          floorId,
          rowId: residentRowId ?? undefined,
          userId: sub.userId,
        });
        onSuccess(res.id, res.licensePlate, res.row?.rowCode ?? '—', res.entryTime);
      }
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
      const bookingState = getBookingCheckInState(booking);
      if (!bookingState.canCheckIn) {
        setSubmitError(`Booking ${bookingState.label.toLowerCase()}, chưa thể check-in.`);
        return;
      }
      const res = await checkIn({
        vehicleType: 'car',
        licensePlate: lookup.licensePlate,
        floorId: booking.floorId,
        userId: booking.userId ?? undefined,
        note: `Booking #${booking.id}`,
      });
      onSuccess(res.id, res.licensePlate, res.slot?.slotCode ?? res.row?.rowCode ?? 'Booking', res.entryTime);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Lỗi check-in booking.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleWalkinCheckIn() {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (walkinVehicleType === 'car') {
        // Visitor car: only need floorId — backend handles counter
        if (!selectedFloorId) {
          setSubmitError('Vui lòng chọn tầng gửi xe.');
          return;
        }
        const res = await checkIn({ vehicleType: 'car', licensePlate: lookup.licensePlate, floorId: selectedFloorId });
        onSuccess(res.id, res.licensePlate, res.slot?.slotCode ?? `Tầng`, res.entryTime);
      } else {
        // Visitor motorcycle: rowId optional
        const walkinScenario = scenario.kind === 'walkin' ? scenario : null;
        const targetRow = walkinScenario?.availableRows.find((r) => r.id === selectedRowId);
        const floorId = targetRow?.floorId ?? walkinScenario?.availableRows[0]?.floorId ?? null;
        if (!floorId) {
          setSubmitError('Không tìm thấy tầng xe máy vãng lai. Vui lòng thử lại.');
          return;
        }
        const res = await checkIn({
          vehicleType: 'motorcycle',
          licensePlate: lookup.licensePlate,
          floorId,
          rowId: selectedRowId ?? undefined,
        });
        onSuccess(res.id, res.licensePlate, res.row?.rowCode ?? '—', res.entryTime);
      }
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

  if (scenario.kind === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-red-500/30 bg-red-500/[0.08] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-red-300">Lỗi tải dữ liệu</h3>
            <p className="mt-1 text-sm leading-6 text-red-400/80">{scenario.message}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Vui lòng kiểm tra kết nối backend hoặc thử tra cứu lại biển số.
            </p>
          </div>
        </div>
      </motion.div>
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

  // ── Resident ──────────────────────────────────────────────────────────────
  if (scenario.kind === 'resident') {
    const { subscription: sub, availableRows, residentFloor } = scenario;
    const isMotorcycle = sub.vehicleType === 'motorcycle';

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
          <InfoRow icon={BadgeCheck} label="Gói dịch vụ" value={sub.package.name} />
          <InfoRow icon={Phone} label="Điện thoại" value={sub.user.phone} />
          <InfoRow icon={Calendar} label="Hết hạn" value={formatDateOnly(sub.endDate)} />

          {sub.vehicleType === 'car' && (
            <>
              {sub.slot?.slotCode ? (
                <InfoRow
                  icon={SquareParking}
                  label="Ô đỗ cố định"
                  value={`${sub.slot.slotCode}${residentFloor ? ` · Tầng ${residentFloor.floorNumber} · ${residentFloor.building?.name}` : ''}`}
                />
              ) : (
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Chưa có ô đỗ cố định — backend sẽ cấp tự động khi check-in
                </div>
              )}
            </>
          )}

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center gap-3">
            <Zap className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-xs text-slate-500 w-28 shrink-0">Phí gửi xe</span>
            <span className="text-sm font-bold text-emerald-400">0 VNĐ (Cư dân)</span>
          </div>
        </div>

        {/* Motorcycle: optional row picker */}
        {isMotorcycle && availableRows.length > 0 && (
          <div className="mb-5">
            <RowPicker
              rows={availableRows}
              selectedRowId={residentRowId}
              onSelect={setResidentRowId}
              label="Chỗ xe máy cư dân"
            />
          </div>
        )}

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

  // ── Booking ───────────────────────────────────────────────────────────────
  if (scenario.kind === 'booking') {
    const { booking } = scenario;
    const bookingState = getBookingCheckInState(booking);
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
                <Badge label={bookingState.label} tone={bookingState.tone} />
              </div>
              <p className="mt-0.5 text-sm text-slate-400">{booking.customerName || booking.customerEmail}</p>
            </div>
          </div>
          <Badge label="Ô Tô" tone="blue" />
        </div>

        <div className="space-y-2 mb-5">
          <InfoRow icon={User} label="Tên khách" value={booking.customerName || 'Khách vãng lai'} />
          <InfoRow icon={Phone} label="Điện thoại" value={booking.customerPhone || '—'} />
          <InfoRow
            icon={MapPin}
            label="Tầng"
            value={`Tầng ${booking.floor?.floorNumber ?? booking.floorId}${booking.floor?.building?.name ? ` · ${booking.floor.building.name}` : ''}`}
          />
          {booking.startTime && (
            <InfoRow icon={Clock} label="Giờ hẹn" value={formatDate(booking.startTime)} />
          )}
          {booking.endTime && (
            <InfoRow icon={Calendar} label="Hết hạn" value={formatDate(booking.endTime)} />
          )}
          <InfoRow
            icon={BadgeCheck}
            label="Đã trả trước"
            value={`${booking.prepaidHours} giờ · ${Number(booking.amount).toLocaleString('vi-VN')} VNĐ`}
          />
        </div>

        {submitError && <ErrorAlert message={submitError} />}

        {bookingState.canCheckIn && bookingState.label === 'Tới sớm' && (
          <div className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs leading-5 text-amber-300">
            Khách đến sớm hơn giờ booking. Nếu bãi còn chỗ, nhân viên có thể cho check-in theo tầng đã đặt.
          </div>
        )}

        {!bookingState.canCheckIn && (
          <div className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs leading-5 text-amber-300">
            Biển số này đã có booking trong hệ thống, nhưng chỉ có thể check-in khi booking đã thanh toán thành công và chưa hết hạn.
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting || !bookingState.canCheckIn}
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

  // ── Walk-in ───────────────────────────────────────────────────────────────
  if (scenario.kind === 'walkin') {
    const { visitorCarFloors, availableRows, isExpiredResident } = scenario;
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
              <p className="mt-1 text-xs text-amber-400/80">Khách này gửi xe theo diện vãng lai có tính phí.</p>
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

        {/* Capacity summary */}
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
                  setSelectedRowId(null);
                  if (vt === 'car' && visitorCarFloors.length > 0) {
                    setSelectedFloorId(visitorCarFloors[0].id);
                  }
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

        {/* Ô tô visitor: chọn tầng (counter-based, không cần slot) */}
        {walkinVehicleType === 'car' && (
          <div className="mb-5">
            <FloorPicker
              floors={visitorCarFloors}
              selectedFloorId={selectedFloorId}
              onSelect={setSelectedFloorId}
              label="Chọn tầng gửi ô tô"
            />
            <p className="mt-2 text-xs text-slate-600">
              Backend quản lý chỗ trống theo tầng — không cần chọn ô đỗ cụ thể.
            </p>
          </div>
        )}

        {/* Xe máy visitor: chọn hàng (optional) */}
        {walkinVehicleType === 'motorcycle' && (
          <div className="mb-5">
            <RowPicker
              rows={availableRows}
              selectedRowId={selectedRowId}
              onSelect={setSelectedRowId}
              label="Chỗ xe máy vãng lai"
            />
          </div>
        )}

        {submitError && <ErrorAlert message={submitError} />}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting || (walkinVehicleType === 'car' ? !selectedFloorId : availableRows.length === 0)}
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

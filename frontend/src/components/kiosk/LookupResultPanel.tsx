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
  searchBookingsByPlate,
  getAvailableSlots,
  getAvailableRows,
  checkIn,
} from '../../services/kiosk.service';
import { floorService, type Floor } from '../../services/floor.service';

/** Phải khớp với EARLY_GRACE_MS trong backend/booking.service.js */
const EARLY_GRACE_MS = 30 * 60 * 1000;

type BookingCheckInStatus = {
  canCheckIn: boolean;
  label: string;
  tone: 'green' | 'amber' | 'blue' | 'red' | 'slate';
  /** true = đến sớm hơn 30 phút, backend sẽ bỏ qua booking và tạo session vãng lai */
  forceWalkin?: boolean;
  /** true = booking đã hết hạn, chỉ có thể vãng lai */
  expired?: boolean;
};

type CheckInScenario =
  | { kind: 'resolving' }
  | { kind: 'error'; message: string }
  | { kind: 'already_in'; lookup: LookupApiResponse }
  | { kind: 'resident'; lookup: LookupApiResponse; subscription: ActiveSubscription; availableSlots: ParkingSlotApiItem[]; availableRows: ParkingRowApiItem[]; floors: Floor[] }
  | { kind: 'booking'; lookup: LookupApiResponse; booking: BookingApiItem; bookingStatus: BookingCheckInStatus }
  | { kind: 'walkin'; lookup: LookupApiResponse; availableSlots: ParkingSlotApiItem[]; availableRows: ParkingRowApiItem[]; floors: Floor[]; isExpiredResident?: boolean };

interface LookupResultPanelProps {
  lookup: LookupApiResponse;
  onSuccess: (sessionId: number, plate: string, slotCode: string, entryTime: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function formatDateOnly(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN');
}

function formatFixedCarSlot(sub: ActiveSubscription, floors: Floor[]) {
  if (!sub.slot && !sub.slotId) return null;

  const slotCode = sub.slot?.slotCode ?? `Slot #${sub.slotId}`;
  const floor = sub.slot?.floorId ? floors.find((item) => item.id === sub.slot?.floorId) : null;
  if (!floor) return slotCode;

  return `${slotCode} · Tầng ${floor.floorNumber}${floor.building?.name ? ` · ${floor.building.name}` : ''}`;
}

function getBookingCheckInState(booking: BookingApiItem): BookingCheckInStatus {
  const now = Date.now();
  const start = booking.startTime ? new Date(booking.startTime).getTime() : Number.NaN;
  const end = booking.endTime ? new Date(booking.endTime).getTime() : Number.NaN;

  if (booking.sessionId) return { canCheckIn: false, label: 'Đã check-in', tone: 'slate' };
  if (booking.status === 'pending') return { canCheckIn: false, label: 'Chờ thanh toán', tone: 'amber' };
  if (booking.status !== 'confirmed') return { canCheckIn: false, label: 'Không còn hiệu lực', tone: 'red' };
  if (Number.isNaN(start) || Number.isNaN(end)) return { canCheckIn: false, label: 'Thiếu thời gian', tone: 'red' };

  // Booking đã quá giờ kết thúc → chỉ có thể vãng lai
  if (end < now) return { canCheckIn: false, label: 'Đã hết giờ', tone: 'red', expired: true };

  // Đến SỚM HƠN 30 phút so với startTime:
  // Backend (findActiveBookingByPlate) chỉ chấp nhận startTime <= now + 30min.
  // Nếu start > now + 30min → backend KHÔNG tìm thấy booking → tạo session vãng lai → mất tiền.
  // Vì vậy phải ngăn staff check-in theo kiểu booking trong khoảng này.
  if (start > now + EARLY_GRACE_MS) {
    const minutesUntilGrace = Math.ceil((start - EARLY_GRACE_MS - now) / 60000);
    return {
      canCheckIn: false,
      label: `Đến quá sớm (còn ${minutesUntilGrace} phút)`,
      tone: 'amber',
      forceWalkin: true,
    };
  }

  // Trong vùng grace (start <= now + 30min, end >= now) → check-in booking ok
  if (start > now) {
    return { canCheckIn: true, label: 'Tới sớm (trong 30 phút)', tone: 'green' };
  }

  return { canCheckIn: true, label: 'Sẵn sàng check-in', tone: 'green' };
}

function findDisplayBooking(bookings: BookingApiItem[]) {
  const now = Date.now();
  return bookings
    .filter((booking) => ['pending', 'confirmed'].includes(booking.status) && !booking.sessionId)
    .filter((booking) => !booking.endTime || new Date(booking.endTime).getTime() >= now)
    .sort((a, b) => {
      const aReady = getBookingCheckInState(a).canCheckIn ? 0 : 1;
      const bReady = getBookingCheckInState(b).canCheckIn ? 0 : 1;
      if (aReady !== bReady) return aReady - bReady;
      return new Date(a.startTime ?? 0).getTime() - new Date(b.startTime ?? 0).getTime();
    })[0] ?? null;
}

async function getAvailabilityByFloorType(vehicleType: VehicleType, floorType: 'resident' | 'visitor') {
  const floorsRes = await floorService.getFloors({ vehicleType, isActive: true, page: 1, limit: 100 });
  const floors = floorsRes.floors.filter((floor) => floor.floorType === floorType);
  const floorIds = new Set(floors.map((floor) => floor.id));

  if (vehicleType === 'car') {
    const slotResults = await Promise.all(
      floors.map((floor) => getAvailableSlots('car', { floorId: floor.id, limit: 100 }))
    );

    return {
      slots: slotResults.flatMap((result) => result.data),
      rows: [] as ParkingRowApiItem[],
      floors,
    };
  }

  const spotsRes = await getAvailableRows();
  return {
    slots: [] as ParkingSlotApiItem[],
    rows: (spotsRes.data as ParkingRowApiItem[]).filter((row) => floorIds.has(row.floorId)),
    floors,
  };
}

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

interface SlotPickerProps {
  vehicleType: VehicleType;
  slots: ParkingSlotApiItem[];
  rows: ParkingRowApiItem[];
  selectedSlotId: number | null;
  selectedRowId: number | null;
  onSelectSlot: (id: number) => void;
  onSelectRow: (id: number) => void;
  motorcycleLabel?: string;
}

function SlotPicker({ vehicleType, slots = [], rows = [], selectedSlotId, selectedRowId, onSelectSlot, onSelectRow, motorcycleLabel = 'Chỗ xe máy còn trống' }: SlotPickerProps) {
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

  if (rows.length) {
    const availableMotorcycleCount = rows.reduce(
      (total, row) => total + Math.max(0, row.capacity - row.occupiedCount),
      0
    );

    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
              <Motorbike className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{motorcycleLabel}</p>
              <p className="mt-0.5 text-sm text-slate-400">Hệ thống tự chọn hàng phù hợp khi check-in.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-white">{availableMotorcycleCount}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">chỗ</p>
          </div>
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

export function LookupResultPanel({ lookup, onSuccess }: LookupResultPanelProps) {
  const [scenario, setScenario] = useState<CheckInScenario>({ kind: 'resolving' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [walkinVehicleType, setWalkinVehicleType] = useState<VehicleType>('car');
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setScenario({ kind: 'resolving' });
      setSubmitError(null);
      setSelectedSlotId(null);
      setSelectedRowId(null);
      setSelectedFloorId(null);

      if ((lookup.status === 'already_active' || lookup.status === 'active') && lookup.activeSession) {
        if (!cancelled) setScenario({ kind: 'already_in', lookup });
        return;
      }

      let isExpiredResident = false;

      try {
        const subResult = await checkActiveSubscription(lookup.licensePlate);
        if (!cancelled && subResult.active && subResult.subscription) {
          const sub = subResult.subscription;
          const residentAvailability = await getAvailabilityByFloorType(sub.vehicleType, 'resident');
          if (!cancelled) {
            setScenario({
              kind: 'resident',
              lookup,
              subscription: sub,
              availableSlots: residentAvailability.slots,
              availableRows: residentAvailability.rows,
              floors: residentAvailability.floors,
            });
          }
          return;
        }
        if (!cancelled && lookup.hint.linkedResident && !subResult.active) {
          isExpiredResident = true;
        }
      } catch (err) {
        if (!cancelled) {
          setScenario({
            kind: 'error',
            message: err instanceof Error ? err.message : 'Không kiểm tra được gói cư dân cho biển số này.',
          });
        }
        return;
      }

      const bookingResult = await searchBookingsByPlate(lookup.licensePlate).catch(() => null);
      if (!cancelled && bookingResult && bookingResult.data.length > 0) {
        const booking = findDisplayBooking(bookingResult.data);
        if (booking) {
          const bookingStatus = getBookingCheckInState(booking);
          if (!cancelled) setScenario({ kind: 'booking', lookup, booking, bookingStatus });
          return;
        }
      }

      try {
        const [carVisitor, motorcycleVisitor] = await Promise.all([
          getAvailabilityByFloorType('car', 'visitor'),
          getAvailabilityByFloorType('motorcycle', 'visitor'),
        ]);
        if (!cancelled) {
          setScenario({
            kind: 'walkin',
            lookup,
            availableSlots: carVisitor.slots,
            availableRows: motorcycleVisitor.rows,
            floors: carVisitor.floors,
            isExpiredResident,
          });
          setSelectedRowId(motorcycleVisitor.rows[0]?.id ?? null);
          setSelectedFloorId(carVisitor.floors[0]?.id ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setScenario({
            kind: 'error',
            message: err instanceof Error ? err.message : 'Không tải được danh sách chỗ trống. Vui lòng thử lại.',
          });
        }
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [lookup]);

  async function handleResidentCheckIn(sub: ActiveSubscription) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const residentScenario = scenario.kind === 'resident' ? scenario : null;
      let payload: Parameters<typeof checkIn>[0];
      if (sub.vehicleType === 'car') {
        const floorId = sub.slot?.floorId ?? null;
        if (!floorId) { setSubmitError('Gói ô tô cư dân chưa gắn ô/tầng cố định. Vui lòng kiểm tra lại gói.'); return; }
        payload = { vehicleType: 'car', licensePlate: lookup.licensePlate, floorId, userId: sub.userId };
      } else {
        const residentFloor =
          residentScenario?.floors.find((floor) =>
            residentScenario.availableRows.some((row) => row.floorId === floor.id)
          ) ?? residentScenario?.floors[0] ?? null;
        if (!residentFloor) {
          setSubmitError('Không có tầng cư dân xe máy khả dụng.');
          return;
        }
        payload = { vehicleType: 'motorcycle', licensePlate: lookup.licensePlate, floorId: residentFloor.id, userId: sub.userId };
      }
      const res = await checkIn(payload);
      onSuccess(res.id, res.licensePlate, res.slot?.slotCode ?? res.row?.rowCode ?? '—', res.entryTime);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Lỗi check-in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBookingCheckIn(booking: BookingApiItem, bookingStatus: BookingCheckInStatus) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (!bookingStatus.canCheckIn) {
        setSubmitError(`Booking ${bookingStatus.label.toLowerCase()}, chưa thể check-in.`);
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

  async function handleSwitchToWalkin() {
    setSubmitError(null);
    setScenario({ kind: 'resolving' });
    try {
      const [carVisitor, motorcycleVisitor] = await Promise.all([
        getAvailabilityByFloorType('car', 'visitor'),
        getAvailabilityByFloorType('motorcycle', 'visitor'),
      ]);
      setScenario({
        kind: 'walkin',
        lookup,
        availableSlots: carVisitor.slots,
        availableRows: motorcycleVisitor.rows,
        floors: carVisitor.floors,
      });
      setSelectedRowId(motorcycleVisitor.rows[0]?.id ?? null);
      setSelectedFloorId(carVisitor.floors[0]?.id ?? null);
    } catch (err) {
      setScenario({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Không tải được danh sách chỗ trống vãng lai.',
      });
    }
  }

  async function handleWalkinCheckIn() {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const walkinScenario = scenario.kind === 'walkin' ? scenario : null;
      let payload: Parameters<typeof checkIn>[0];
      if (walkinVehicleType === 'car') {
        if (!selectedFloorId) { setSubmitError('Vui lòng chọn tầng đỗ xe.'); return; }
        payload = { vehicleType: 'car', licensePlate: lookup.licensePlate, floorId: selectedFloorId };
      } else {
        const selectedRow = walkinScenario?.availableRows.find((row) => row.id === selectedRowId);
        if (!selectedRow) {
          setSubmitError('Vui lòng chọn hàng xe máy thuộc tầng vãng lai.');
          return;
        }
        payload = { vehicleType: 'motorcycle', licensePlate: lookup.licensePlate, floorId: selectedRow.floorId, rowId: selectedRow.id };
      }
      const res = await checkIn(payload);
      onSuccess(res.id, res.licensePlate, res.slot?.slotCode ?? res.row?.rowCode ?? '—', res.entryTime);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Lỗi check-in.');
    } finally {
      setIsSubmitting(false);
    }
  }

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
            <h3 className="font-bold text-red-300">Không kiểm tra được gói cư dân</h3>
            <p className="mt-1 text-sm leading-6 text-red-400/80">{scenario.message}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Vui lòng kiểm tra backend, token nhân viên hoặc thử tra cứu lại biển số trước khi check-in.
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

  if (scenario.kind === 'resident') {
    const { subscription: sub, availableRows, floors } = scenario;
    const fixedCarSlot = sub.vehicleType === 'car' ? formatFixedCarSlot(sub, floors) : null;
    const residentMotorcycleFloor =
      sub.vehicleType === 'motorcycle'
        ? floors.find((floor) => availableRows.some((row) => row.floorId === floor.id)) ?? floors[0] ?? null
        : null;
    const residentMotorcycleAvailable = availableRows.reduce(
      (total, row) => total + Math.max(0, row.capacity - row.occupiedCount),
      0
    );
    const residentMotorcycleFloorLabel = residentMotorcycleFloor
      ? `Tầng ${residentMotorcycleFloor.floorNumber}${residentMotorcycleFloor.building?.name ? ` · ${residentMotorcycleFloor.building.name}` : ''}`
      : 'Chưa có tầng cư dân khả dụng';

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
          {sub.vehicleType === 'car' && fixedCarSlot && (
            <InfoRow icon={SquareParking} label="Ô đỗ cố định" value={fixedCarSlot} />
          )}
          {sub.vehicleType === 'car' && !fixedCarSlot && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Gói ô tô cư dân chưa gắn ô đỗ cố định. Vui lòng kiểm tra lại gói trước khi check-in.
            </div>
          )}
          {sub.vehicleType === 'motorcycle' && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center gap-3">
              <Motorbike className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-xs text-slate-500 w-28 shrink-0">Tầng cư dân</span>
              <span className="text-sm font-semibold text-white">
                {residentMotorcycleFloorLabel} · {residentMotorcycleAvailable} chỗ trống
              </span>
            </div>
          )}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center gap-3">
            <Zap className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-xs text-slate-500 w-28 shrink-0">Phí gửi xe</span>
            <span className="text-sm font-bold text-emerald-400">0 VNĐ (Cư dân)</span>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-xs leading-5 text-emerald-300">
          Backend sẽ check-in theo tầng cư dân. Ô tô dùng ô cố định đã mua gói, xe máy được tự chọn hàng còn trống trong tầng cư dân.
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
          <Zap className="h-3 w-3" />
          {lookup.availableSlots.car} ô tô · {lookup.availableSlots.motorcycle} xe máy còn trống
        </div>

        {submitError && <ErrorAlert message={submitError} />}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={
            isSubmitting ||
            (sub.vehicleType === 'car' && !sub.slot?.floorId) ||
            (sub.vehicleType === 'motorcycle' && !residentMotorcycleFloor)
          }
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
    const { booking, bookingStatus } = scenario;
    const borderColor = bookingStatus.forceWalkin || bookingStatus.expired
      ? 'border-amber-400/30'
      : 'border-blue-400/20';
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-[28px] border ${borderColor} bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl`}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              bookingStatus.forceWalkin || bookingStatus.expired ? 'bg-amber-500/20' : 'bg-blue-500/20'
            }`}>
              <Calendar className={`h-5 w-5 ${
                bookingStatus.forceWalkin || bookingStatus.expired ? 'text-amber-400' : 'text-blue-400'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white">Khách Đặt Trước</h3>
                <Badge label="Có Booking" tone="blue" />
                <Badge label={bookingStatus.label} tone={bookingStatus.tone} />
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

        {/* ── Đến QUÁ SỚM (> 30 phút trước startTime) ── */}
        {bookingStatus.forceWalkin && (
          <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs leading-5">
            <p className="font-semibold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Khách đến sớm hơn 30 phút so với giờ đặt
            </p>
            <p className="mt-1 text-amber-400/80">
              Hệ thống backend chỉ nhận check-in booking trong vòng <strong>30 phút</strong> trước giờ hẹn.
              Nếu check-in ngay bây giờ, backend sẽ <strong className="text-red-400">bỏ qua booking</strong> và
              tạo phiên vãng lai — khách sẽ bị tính phí vãng lai và mất tiền đặt trước.
            </p>
            <p className="mt-1.5 font-medium text-amber-300">
              → Để tránh mất tiền: yêu cầu khách đợi đến trong vòng 30 phút trước giờ hẹn,
              hoặc check-in vãng lai dưới đây.
            </p>
          </div>
        )}

        {/* ── Booking ĐÃ HẾT HẠN ── */}
        {bookingStatus.expired && (
          <div className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-xs leading-5">
            <p className="font-semibold text-red-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Booking đã hết hạn — không thể check-in theo booking
            </p>
            <p className="mt-1 text-red-400/80">
              Giờ kết thúc của booking đã qua. Nếu khách vẫn muốn vào bãi,
              chỉ có thể check-in theo diện <strong>vãng lai</strong> và trả phí theo giờ thực tế.
            </p>
          </div>
        )}

        {/* ── Trong grace period, đến sớm hợp lệ ── */}
        {bookingStatus.canCheckIn && bookingStatus.label.startsWith('Tới sớm') && (
          <div className="mb-3 rounded-xl border border-green-400/20 bg-green-400/5 px-4 py-3 text-xs leading-5 text-green-300">
            Khách đến sớm nhưng trong vùng 30 phút cho phép. Backend sẽ nhận diện và check-in theo booking.
          </div>
        )}

        {/* ── Trạng thái khác không cho check-in (pending, cancelled…) ── */}
        {!bookingStatus.canCheckIn && !bookingStatus.forceWalkin && !bookingStatus.expired && (
          <div className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs leading-5 text-amber-300">
            Biển số này đã có booking trong hệ thống, nhưng chỉ có thể check-in khi booking đã thanh toán thành công và chưa hết hạn.
          </div>
        )}

        {/* Nút check-in booking — chỉ hiện khi có thể check-in */}
        {!bookingStatus.forceWalkin && !bookingStatus.expired && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting || !bookingStatus.canCheckIn}
            onClick={() => handleBookingCheckIn(booking, bookingStatus)}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 font-semibold text-white shadow-[0_4px_20px_rgba(37,99,235,0.25)] transition-all hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xử lý…</>
              : <><CheckCircle2 className="h-4 w-4" /> Xác Nhận & Check-In Khách Đặt Trước</>}
          </motion.button>
        )}

        {/* Nút chuyển vãng lai — hiện khi đến quá sớm hoặc booking hết hạn */}
        {(bookingStatus.forceWalkin || bookingStatus.expired) && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            onClick={handleSwitchToWalkin}
            className="w-full rounded-xl border border-amber-400/30 bg-amber-500/10 py-3.5 font-semibold text-amber-300 transition-all hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang tải…</>
              : <><CheckCircle2 className="h-4 w-4" /> Chuyển sang Check-In Vãng Lai</>}
          </motion.button>
        )}
      </motion.div>
    );
  }

  if (scenario.kind === 'walkin') {
    const { availableSlots, availableRows, floors, isExpiredResident } = scenario;
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
                  setSelectedRowId(vt === 'motorcycle' ? availableRows[0]?.id ?? null : null);
                  setSelectedFloorId(vt === 'car' ? floors[0]?.id ?? null : null);
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
          {walkinVehicleType === 'car' ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Chọn tầng vãng lai</p>
              {floors.length ? (
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {floors.map((f) => {
                    const availableOnFloor = availableSlots.filter(s => s.floorId === f.id).length;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFloorId(f.id)}
                        className={cn(
                          'rounded-xl border px-3 py-2.5 text-sm font-bold transition-all text-left',
                          selectedFloorId === f.id ? 'border-blue-400/60 bg-blue-500/20 text-blue-300' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-blue-400/30'
                        )}
                      >
                        <div className="font-bold">Tầng {f.floorNumber}</div>
                        <div className="text-[10px] font-normal text-slate-500">{availableOnFloor} chỗ trống</div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500 py-2">Không còn tầng vãng lai cho ô tô.</p>
              )}
            </div>
          ) : (
            <SlotPicker
              vehicleType={walkinVehicleType}
              slots={availableSlots}
              rows={availableRows}
              selectedSlotId={selectedSlotId}
              selectedRowId={selectedRowId}
              onSelectSlot={setSelectedSlotId}
              onSelectRow={setSelectedRowId}
              motorcycleLabel="Chỗ xe máy vãng lai còn trống"
            />
          )}
        </div>

        {submitError && <ErrorAlert message={submitError} />}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting || (walkinVehicleType === 'car' ? !selectedFloorId : !selectedRowId)}
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
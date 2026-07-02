import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Car,
  CheckCircle2,
  ChevronDown,
  Layers3,
  Loader2,
  MapPin,
  Motorbike,
  RefreshCw,
  SquareParking,
  Wrench,
  X,
  ZoomIn,
} from 'lucide-react';
import { KioskLayout } from '../../components/kiosk/KioskLayout';
import { cn, compareFloorCode } from '../../lib/utils';
import { buildingService, type Building } from '../../services/building.service';
import { floorService, type Floor } from '../../services/floor.service';
import { slotService, type ParkingSlot, type SlotStatus } from '../../services/slot.service';
import { getActiveSessions } from '../../services/kiosk.service';
import type { ParkingRowApiItem } from '../../types/kiosk';

const API_BASE_URL = 'http://localhost:5000/api/v1';

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function updateSlotStatus(slotId: number, status: SlotStatus, note?: string): Promise<void> {
  const body: Record<string, unknown> = { status };
  if (note !== undefined) body.note = note;
  const res = await fetch(`${API_BASE_URL}/parking-slots/${slotId}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? `Lỗi cập nhật slot (${res.status})`);
}

async function fetchRows(floorId: number): Promise<ParkingRowApiItem[]> {
  const res = await fetch(`${API_BASE_URL}/parking-rows?floorId=${floorId}&limit=200`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? 'Lỗi tải hàng xe máy');
  return json.data as ParkingRowApiItem[];
}


const SLOT_CFG: Record<SlotStatus, { bg: string; border: string; text: string; label: string }> = {
  empty: { bg: 'bg-emerald-500/20', border: 'border-emerald-400/40', text: 'text-emerald-300', label: 'Trống' },
  occupied: { bg: 'bg-blue-500/20', border: 'border-blue-400/40', text: 'text-blue-300', label: 'Đang dùng' },
  reserved: { bg: 'bg-purple-500/20', border: 'border-purple-400/40', text: 'text-purple-300', label: 'Đặt trước' },
  maintenance: { bg: 'bg-amber-500/20', border: 'border-amber-400/40', text: 'text-amber-300', label: 'Bảo trì' },
};

interface FloorData {
  floor: Floor;
  slots: ParkingSlot[];
  rows: ParkingRowApiItem[];
  // Số phiên đang hoạt động của tầng — dùng cho tầng ô tô vãng lai (đếm theo tầng).
  activeCount?: number;
  loading: boolean;
  error: string | null;
}

interface SlotDetail {
  slotId: number;
  slotCode: string;
  status: SlotStatus;
  note: string | null;
  floorNumber: string;
  buildingName: string;
}


function Legend() {
  return (
    <div className="flex flex-wrap gap-3">
      <span className="text-xs text-slate-600 self-center">Slot cư dân:</span>
      {(Object.entries(SLOT_CFG) as [SlotStatus, typeof SLOT_CFG[SlotStatus]][]).map(([, cfg]) => (
        <span
          key={cfg.label}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
            cfg.border, cfg.bg, cfg.text,
          )}
        >
          <span className={cn('h-2 w-2 rounded-full', cfg.bg.replace('/20', ''))} />
          {cfg.label}
        </span>
      ))}
      <span className="ml-2 text-xs text-slate-600 self-center border-l border-white/10 pl-2">Tầng vãng lai: đếm theo tầng</span>
    </div>
  );
}

function FloorStats({ slots, rows, floor, activeCount }: {
  slots: ParkingSlot[];
  rows: ParkingRowApiItem[];
  floor: Floor;
  activeCount?: number;
}) {
  if (floor.vehicleType === 'car') {
    // Tầng vãng lai "đếm theo tầng": đang dùng = số phiên active, không theo trạng thái slot.
    if (floor.floorType === 'visitor') {
      const total = floor.totalSlots;
      const occupied = activeCount ?? 0;
      const empty = Math.max(0, total - occupied);
      const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
      return (
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-500">{total} ô</span>
          <span className="text-emerald-400">●&nbsp;{empty} trống</span>
          <span className="text-blue-400">●&nbsp;{occupied} đang dùng</span>
          <span className={cn('ml-auto font-bold', pct >= 90 ? 'text-red-400' : pct >= 60 ? 'text-amber-400' : 'text-emerald-400')}>
            {pct}% lấp đầy
          </span>
        </div>
      );
    }

    // Tầng cư dân: mỗi xe có slot cố định → theo trạng thái slot vật lý.
    const total = slots.length;
    const empty = slots.filter(s => s.status === 'empty').length;
    const occupied = slots.filter(s => s.status === 'occupied').length;
    const reserved = slots.filter(s => s.status === 'reserved').length;
    const maint = slots.filter(s => s.status === 'maintenance').length;
    const pct = total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0;
    return (
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-slate-500">{total} ô</span>
        <span className="text-emerald-400">●&nbsp;{empty} trống</span>
        <span className="text-blue-400">●&nbsp;{occupied} đang dùng</span>
        {reserved > 0 && <span className="text-purple-400">●&nbsp;{reserved} đặt trước</span>}
        {maint > 0 && <span className="text-amber-400">●&nbsp;{maint} bảo trì</span>}
        <span className={cn('ml-auto font-bold', pct >= 90 ? 'text-red-400' : pct >= 60 ? 'text-amber-400' : 'text-emerald-400')}>
          {pct}% lấp đầy
        </span>
      </div>
    );
  }

  const totalCap = rows.reduce((s, r) => s + r.capacity, 0);
  const totalOcc = rows.reduce((s, r) => s + r.occupiedCount, 0);
  const pct = totalCap > 0 ? Math.round((totalOcc / totalCap) * 100) : 0;
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <span className="text-slate-500">{rows.length} hàng · {totalCap} chỗ</span>
      <span className="text-emerald-400">●&nbsp;{totalCap - totalOcc} trống</span>
      <span className="text-blue-400">●&nbsp;{totalOcc} đang dùng</span>
      <span className={cn('ml-auto font-bold', pct >= 90 ? 'text-red-400' : pct >= 60 ? 'text-amber-400' : 'text-emerald-400')}>
        {pct}% lấp đầy
      </span>
    </div>
  );
}

function CarResidentFloorGrid({ slots, onSelectSlot }: {
  slots: ParkingSlot[];
  onSelectSlot: (detail: SlotDetail) => void;
}) {
  if (!slots.length) {
    return <p className="py-6 text-center text-sm text-slate-600">Tầng này chưa có ô đỗ xe nào.</p>;
  }
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))' }}>
      {slots.map((slot) => {
        const cfg = SLOT_CFG[slot.status];
        return (
          <motion.button
            key={slot.id}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() =>
              onSelectSlot({
                slotId: slot.id,
                slotCode: slot.slotCode,
                status: slot.status,
                note: slot.note,
                floorNumber: slot.floor.floorNumber,
                buildingName: slot.floor.building.name,
              })
            }
            className={cn(
              'flex flex-col items-center justify-center rounded-xl border px-2 py-3 transition-all cursor-pointer',
              cfg.bg, cfg.border,
            )}
            title={`${slot.slotCode} — ${cfg.label}`}
          >
            <SquareParking className={cn('h-4 w-4 mb-1', cfg.text)} />
            <span className={cn('text-[10px] font-bold leading-none', cfg.text)}>{slot.slotCode}</span>
          </motion.button>
        );
      })}
    </div>
  );
}


function CarVisitorFloorGrid({ floor, activeCount }: { floor: Floor; activeCount: number }) {
  // Visitor car: backend đếm theo tầng (số phiên đang hoạt động), không phân slot vật lý.
  const total = floor.totalSlots;
  const used = activeCount;
  const empty = Math.max(0, total - used);
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20">
          <Car className="h-7 w-7 text-blue-300" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-200">Ô tô vãng lai — Đếm theo tầng</p>
          <p className="mt-1 text-xs text-slate-500 leading-5">
            Backend quản lý chỗ trống bằng cách đếm số phiên đang hoạt động trên tầng,
            không phân công slot vật lý cho từng xe.
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-black text-white">{total}</p>
          <p className="text-xs text-slate-500">tổng chỗ</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{used} đang dùng / {empty} trống</span>
          <span className={cn('font-bold', pct >= 90 ? 'text-red-400' : pct >= 60 ? 'text-amber-400' : 'text-emerald-400')}>
            {pct}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-400' : 'bg-emerald-400')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function MotoFloorGrid({ rows }: { rows: ParkingRowApiItem[] }) {
  if (!rows.length) {
    return <p className="py-6 text-center text-sm text-slate-600">Tầng này chưa có hàng xe máy nào.</p>;
  }
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
      {rows.map((row) => {
        const pct = row.capacity > 0 ? (row.occupiedCount / row.capacity) : 0;
        const free = row.capacity - row.occupiedCount;
        const barColor = pct >= 0.9 ? 'bg-red-500' : pct >= 0.6 ? 'bg-amber-400' : 'bg-emerald-400';
        const isMaint = row.status === 'maintenance';
        return (
          <div
            key={row.id}
            className={cn(
              'rounded-2xl border p-3',
              isMaint
                ? 'border-amber-400/30 bg-amber-400/10'
                : 'border-white/10 bg-white/[0.03]',
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={cn('text-sm font-bold', isMaint ? 'text-amber-300' : 'text-white')}>
                {row.rowCode}
              </span>
              {isMaint ? (
                <Wrench className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <span className="text-xs text-slate-500">{free} trống</span>
              )}
            </div>
            <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', barColor)}
                style={{ width: `${Math.round(pct * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-slate-600">
              {row.occupiedCount}/{row.capacity} chỗ
            </p>
          </div>
        );
      })}
    </div>
  );
}

function FloorPanel({
  data,
  onSelectSlot,
}: {
  data: FloorData;
  onSelectSlot: (detail: SlotDetail) => void;
}) {
  const [open, setOpen] = useState(true);
  const { floor, slots, rows, activeCount, loading, error } = data;
  const isCar = floor.vehicleType === 'car';
  const isResidentCar = isCar && floor.floorType === 'resident';
  const isVisitorCar = isCar && floor.floorType === 'visitor';

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#0F172A]/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition"
      >
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          isResidentCar ? 'bg-emerald-500/20' : isVisitorCar ? 'bg-blue-500/20' : 'bg-amber-500/20',
        )}>
          {isCar
            ? <Car className={cn('h-4 w-4', isResidentCar ? 'text-emerald-400' : 'text-blue-400')} />
            : <Motorbike className="h-4 w-4 text-amber-400" />}
        </div>

        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-white">
            Tầng {floor.floorNumber}
            <span className={cn(
              'ml-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
              floor.floorType === 'resident'
                ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                : 'border-blue-400/20 bg-blue-400/10 text-blue-300',
            )}>
              {floor.floorType === 'resident' ? 'Cư dân' : 'Vãng lai'}
            </span>
            {isVisitorCar && (
              <span className="ml-1.5 text-[10px] text-slate-600">đếm theo tầng</span>
            )}
          </p>
          {!loading && !error && (
            <div className="mt-1 pr-4">
              <FloorStats slots={slots} rows={rows} floor={floor} activeCount={activeCount} />
            </div>
          )}
        </div>

        <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-500 transition-transform', open ? 'rotate-180' : '')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.06] px-5 pb-5 pt-4">
              {loading && (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
                </div>
              )}
              {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}
              {!loading && !error && (
                isResidentCar
                  ? <CarResidentFloorGrid slots={slots} onSelectSlot={onSelectSlot} />
                  : isVisitorCar
                  ? <CarVisitorFloorGrid floor={floor} activeCount={activeCount ?? 0} />
                  : <MotoFloorGrid rows={rows} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SlotDetailModal({
  detail,
  onClose,
  onStatusChanged,
}: {
  detail: SlotDetail;
  onClose: () => void;
  onStatusChanged: () => void;
}) {
  const cfg = SLOT_CFG[detail.status];
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const canToggleMaintenance = detail.status === 'empty' || detail.status === 'maintenance';
  const isReadOnly = detail.status === 'occupied' || detail.status === 'reserved';

  async function handleToggleMaintenance() {
    const nextStatus: SlotStatus = detail.status === 'maintenance' ? 'empty' : 'maintenance';
    setIsUpdating(true);
    setActionError(null);
    try {
      await updateSlotStatus(detail.slotId, nextStatus);
      onStatusChanged();
      onClose();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái.');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-[28px] border border-white/10 bg-[#0F172A] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl border', cfg.border, cfg.bg)}>
            <SquareParking className={cn('h-6 w-6', cfg.text)} />
          </div>
          <button onClick={onClose} className="rounded-xl border border-white/10 p-2 text-slate-400 hover:text-white transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="text-2xl font-black text-white">{detail.slotCode}</h3>
        <p className="mt-1 text-sm text-slate-500">{detail.buildingName} · Tầng {detail.floorNumber}</p>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <span className="text-xs text-slate-500">Trạng thái</span>
            <span className={cn('rounded-full border px-3 py-1 text-xs font-bold', cfg.border, cfg.bg, cfg.text)}>
              {cfg.label}
            </span>
          </div>
          {detail.note && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <p className="text-xs text-slate-500">Ghi chú</p>
              <p className="mt-1 text-sm text-white">{detail.note}</p>
            </div>
          )}
        </div>

        {/* Thông báo với slot do hệ thống quản lý */}
        {isReadOnly && (
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-400 mb-1">Trạng thái hệ thống</p>
            <p>
              {detail.status === 'occupied'
                ? 'Ô đang có xe. Hệ thống tự cập nhật khi xe check-out.'
                : 'Ô đã đặt trước cho gói cư dân. Liên hệ admin để thay đổi.'}
            </p>
          </div>
        )}

        {/* Error */}
        {actionError && (
          <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-xs text-red-400">
            {actionError}
          </div>
        )}

        {/* Action buttons — chỉ hiện cho empty và maintenance */}
        {canToggleMaintenance && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={isUpdating}
            onClick={handleToggleMaintenance}
            className={cn(
              'mt-4 w-full rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
              detail.status === 'maintenance'
                ? 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border border-amber-400/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20',
            )}
          >
            {isUpdating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Đang cập nhật…</>
            ) : detail.status === 'maintenance' ? (
              <><CheckCircle2 className="h-4 w-4" /> Xoá Bảo Trì (trả về Trống)</>
            ) : (
              <><Wrench className="h-4 w-4" /> Đặt Bảo Trì</>  
            )}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}


function BuildingSection({
  building,
  floorDataList,
  onSelectSlot,
}: {
  building: Building;
  floorDataList: FloorData[];
  onSelectSlot: (detail: SlotDetail) => void;
}) {
  if (!floorDataList.length) return null;

  const allSlots = floorDataList.flatMap(d => d.slots);
  const allRows = floorDataList.flatMap(d => d.rows);
  const totalSpots = allSlots.length + allRows.reduce((s, r) => s + r.capacity, 0);
  const occupiedSpots =
    allSlots.filter(s => s.status === 'occupied' || s.status === 'reserved').length +
    allRows.reduce((s, r) => s + r.occupiedCount, 0);
  const pct = totalSpots > 0 ? Math.round((occupiedSpots / totalSpots) * 100) : 0;

  return (
    <section className="rounded-[32px] border border-white/10 bg-[#0B1120]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/20">
            <Building2 className="h-5 w-5 text-blue-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{building.name}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {building.address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-32">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>Lấp đầy</span>
              <span className={cn('font-bold', pct >= 90 ? 'text-red-400' : pct >= 60 ? 'text-amber-400' : 'text-emerald-400')}>
                {pct}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-400' : 'bg-emerald-400',
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">{occupiedSpots}/{totalSpots}</p>
            <p className="text-[10px] text-slate-600">chỗ dùng</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {floorDataList.map((fd) => (
          <FloorPanel key={fd.floor.id} data={fd} onSelectSlot={onSelectSlot} />
        ))}
      </div>
    </section>
  );
}

export default function ParkingMapPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floorDataMap, setFloorDataMap] = useState<Map<number, FloorData[]>>(new Map());
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotDetail | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const POLL_INTERVAL = 30; // seconds
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const allFloorsRef = useRef<Floor[]>([]);

  const loadAll = useCallback(async () => {
    setPageLoading(true);
    setPageError(null);
    try {
      const [buildingRes, carFloorRes, motoFloorRes] = await Promise.all([
        buildingService.getBuildings({ page: 1, limit: 100, isActive: true }),
        floorService.getFloors({ page: 1, limit: 100, vehicleType: 'car', isActive: true }),
        floorService.getFloors({ page: 1, limit: 100, vehicleType: 'motorcycle', isActive: true }),
      ]);

      const allFloors = [...carFloorRes.floors, ...motoFloorRes.floors].sort(
        (a, b) => compareFloorCode(a.floorNumber, b.floorNumber),
      );

      // Cache floors list for silent refresh
      allFloorsRef.current = allFloors;

      setBuildings(buildingRes.buildings);

      const newMap = new Map<number, FloorData[]>();
      for (const b of buildingRes.buildings) {
        const floorsForBuilding = allFloors.filter(f => f.buildingId === b.id);
        newMap.set(b.id, floorsForBuilding.map(f => ({
          floor: f,
          slots: [],
          rows: [],
          loading: true,
          error: null,
        })));
      }
      setFloorDataMap(new Map(newMap));
      setPageLoading(false);

      const fetchPromises = allFloors.map(async (floor) => {
        try {
          let slots: ParkingSlot[] = [];
          let rows: ParkingRowApiItem[] = [];
          let activeCount: number | undefined;

          if (floor.vehicleType === 'car') {
            const res = await slotService.getSlots({ floorId: floor.id, limit: 200 });
            slots = res.slots;
            // Tầng ô tô vãng lai đếm theo số phiên đang hoạt động, không theo trạng thái slot.
            if (floor.floorType === 'visitor') {
              const active = await getActiveSessions({ floorId: floor.id, limit: 1 });
              activeCount = active.pagination.total;
            }
          } else {
            rows = await fetchRows(floor.id);
          }

          setFloorDataMap(prev => {
            const next = new Map(prev);
            const list = next.get(floor.buildingId) ?? [];
            next.set(
              floor.buildingId,
              list.map(fd =>
                fd.floor.id === floor.id ? { ...fd, slots, rows, activeCount, loading: false } : fd,
              ),
            );
            return next;
          });
        } catch (err) {
          setFloorDataMap(prev => {
            const next = new Map(prev);
            const list = next.get(floor.buildingId) ?? [];
            next.set(
              floor.buildingId,
              list.map(fd =>
                fd.floor.id === floor.id
                  ? { ...fd, loading: false, error: err instanceof Error ? err.message : 'Lỗi tải dữ liệu' }
                  : fd,
              ),
            );
            return next;
          });
        }
      });

      await Promise.allSettled(fetchPromises);
      setLastUpdated(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Không tải được dữ liệu bãi xe.');
      setPageLoading(false);
    }
  }, []);

  /** Silent refresh: only reload slot/row data for already-known floors, no full spinner */
  const silentRefresh = useCallback(async () => {
    const floors = allFloorsRef.current;
    if (!floors.length) return;
    setIsRefreshing(true);
    try {
      await Promise.allSettled(
        floors.map(async (floor) => {
          try {
            let slots: ParkingSlot[] = [];
            let rows: ParkingRowApiItem[] = [];
            let activeCount: number | undefined;
            if (floor.vehicleType === 'car') {
              const res = await slotService.getSlots({ floorId: floor.id, limit: 200 });
              slots = res.slots;
              if (floor.floorType === 'visitor') {
                const active = await getActiveSessions({ floorId: floor.id, limit: 1 });
                activeCount = active.pagination.total;
              }
            } else {
              rows = await fetchRows(floor.id);
            }
            setFloorDataMap(prev => {
              const next = new Map(prev);
              const list = next.get(floor.buildingId) ?? [];
              next.set(floor.buildingId, list.map(fd =>
                fd.floor.id === floor.id ? { ...fd, slots, rows, activeCount, loading: false, error: null } : fd
              ));
              return next;
            });
          } catch {
            // keep stale data on transient errors
          }
        })
      );
      setLastUpdated(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const resetCountdown = useCallback(() => {
    setCountdown(POLL_INTERVAL);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? POLL_INTERVAL : prev - 1));
    }, 1000);
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        silentRefresh();
        resetCountdown();
      }
    }, POLL_INTERVAL * 1000);
  }, [silentRefresh, resetCountdown]);

  const handleManualRefresh = useCallback(async () => {
    resetCountdown();
    await silentRefresh();
  }, [silentRefresh, resetCountdown]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    startPolling();
    resetCountdown();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [startPolling, resetCountdown]);

  // Pause/resume polling when tab visibility changes
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        silentRefresh();
        resetCountdown();
        startPolling();
      } else {
        if (pollingRef.current) clearInterval(pollingRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [silentRefresh, resetCountdown, startPolling]);

  return (
    <KioskLayout
      eyebrow="Staff Kiosk"
      title="Sơ Đồ Bãi Xe"
      subtitle="Theo dõi trực quan trạng thái từng tầng, từng ô đỗ và hàng xe máy theo thời gian thực"
      headerRight={
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-[10px] text-slate-600">
                Cập nhật: <span className="font-semibold text-slate-400">{lastUpdated}</span>
              </span>
              <span className="text-[10px] text-slate-700">
                Tự động sau{' '}
                <span className={cn(
                  'font-bold tabular-nums',
                  countdown <= 5 ? 'text-amber-400' : 'text-slate-500'
                )}>{countdown}s</span>
              </span>
            </div>
          )}
          <button
            onClick={handleManualRefresh}
            disabled={pageLoading || isRefreshing}
            title="Làm mới ngay"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-blue-400/40 hover:text-blue-300 disabled:opacity-40"
          >
            <RefreshCw className={cn('h-4 w-4', (pageLoading || isRefreshing) && 'animate-spin')} />
          </button>
        </div>
      }
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Legend />
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <ZoomIn className="h-3.5 w-3.5" />
          <span>Nhấn vào slot cư dân để xem chi tiết</span>
        </div>
      </div>

      {pageLoading && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-[28px] border border-white/10 bg-[#0F172A]/60 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-sm text-slate-500">Đang tải sơ đồ bãi xe…</p>
        </div>
      )}

      {pageError && !pageLoading && (
        <div className="flex flex-col items-center gap-4 rounded-[28px] border border-red-400/20 bg-red-400/10 py-12 text-center">
          <p className="text-sm text-red-300">{pageError}</p>
          <button
            onClick={loadAll}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 text-sm font-semibold text-red-200 transition hover:border-red-300/50"
          >
            <RefreshCw className="h-4 w-4" /> Thử lại
          </button>
        </div>
      )}

      {!pageLoading && !pageError && (
        <div className="space-y-6">
          {buildings.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-white/10 py-20 text-center">
              <Layers3 className="h-10 w-10 text-slate-700" />
              <p className="text-sm text-slate-600">Chưa có tòa nhà nào được kích hoạt.</p>
            </div>
          )}
          {buildings.map((b) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <BuildingSection
                building={b}
                floorDataList={floorDataMap.get(b.id) ?? []}
                onSelectSlot={setSelectedSlot}
              />
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedSlot && (
          <SlotDetailModal
            detail={selectedSlot}
            onClose={() => setSelectedSlot(null)}
            onStatusChanged={() => {
              setSelectedSlot(null);
              silentRefresh();
            }}
          />
        )}
      </AnimatePresence>
    </KioskLayout>
  );
}

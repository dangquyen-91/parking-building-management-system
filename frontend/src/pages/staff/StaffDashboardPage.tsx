import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Car,
  LogIn,
  LogOut,
  Motorbike,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { KioskLayout } from '../../components/kiosk/KioskLayout';
import { cn, compareFloorCode } from '../../lib/utils';
import { floorService, type Floor } from '../../services/floor.service';
import { slotService } from '../../services/slot.service';
import type { ActiveSessionApiItem, ParkingRowApiItem } from '../../types/kiosk';

const API_BASE_URL = 'http://localhost:5000/api/v1';

function authHeaders() {
  const token = localStorage.getItem('accessToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function fetchRows(params?: Record<string, string>): Promise<ParkingRowApiItem[]> {
  const q = new URLSearchParams({ limit: '200', ...params });
  const res = await fetch(`${API_BASE_URL}/parking-rows?${q.toString()}`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? 'Lỗi tải hàng xe');
  return json.data as ParkingRowApiItem[];
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

const formatDuration = (iso: string) => {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m} phút`;
  return `${h}g ${m}p`;
};

// ─── Types ─────────────────────────────────────────────────────────────────

interface FloorOccupancy {
  floorId: number;
  floorNumber: string;
  vehicleType: 'car' | 'motorcycle';
  floorType: 'resident' | 'visitor';
  buildingName: string;
  used: number;
  capacity: number;
  pct: number;
}

interface PeakPoint { hour: string; count: number }

// ─── Sub-components ────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  tone: 'blue' | 'purple' | 'emerald' | 'amber' | 'cyan';
  delay?: number;
}) {
  const tones = {
    blue:    'from-blue-500/25 to-cyan-400/10 text-blue-300 shadow-blue-500/20',
    purple:  'from-purple-500/25 to-blue-500/10 text-purple-300 shadow-purple-500/20',
    emerald: 'from-emerald-500/25 to-teal-400/10 text-emerald-300 shadow-emerald-500/20',
    amber:   'from-amber-500/25 to-orange-400/10 text-amber-300 shadow-amber-500/20',
    cyan:    'from-cyan-500/25 to-blue-400/10 text-cyan-300 shadow-cyan-500/20',
  };
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: 'easeOut' }}
      whileHover={{ y: -4, scale: 1.015 }}
      className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-[1px] shadow-2xl shadow-black/20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/25 via-transparent to-purple-500/25 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative h-full rounded-[27px] bg-[#0F172A]/90 p-5 backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-2xl', tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-black tracking-tight text-white">{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
      </div>
    </motion.article>
  );
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'rounded-[30px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl',
        className
      )}
    >
      {children}
    </motion.section>
  );
}

function SectionHeader({ label, title, badge }: { label: string; title: string; badge?: string }) {
  return (
    <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <h2 className="mt-0.5 text-xl font-bold tracking-tight text-white">{title}</h2>
      </div>
      {badge && (
        <span className="self-start rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-300 sm:self-auto">
          {badge}
        </span>
      )}
    </div>
  );
}

// ─── Custom Tooltips for Recharts (Ensures white text and readability on dark theme) ───

type ChartTooltipEntry<P> = { value: number; name?: string; payload: P };
type ChartTooltipProps<P> = { active?: boolean; payload?: ChartTooltipEntry<P>[] };

const CustomTooltip = ({ active, payload }: ChartTooltipProps<{ fullName: string; color: string; used: number; capacity: number }>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0F172A]/95 p-3.5 shadow-2xl backdrop-blur-xl">
        <p className="text-xs font-semibold text-slate-400">{data.fullName}</p>
        <p className="mt-1.5 text-sm font-bold text-white flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          Lấp đầy: <span style={{ color: data.color }}>{payload[0].value}%</span>
        </p>
        <p className="mt-1 text-xs text-slate-300">
          Đã sử dụng: <span className="font-semibold text-white">{data.used}</span> / {data.capacity} chỗ
        </p>
      </div>
    );
  }
  return null;
};

const VehicleTooltip = ({ active, payload }: ChartTooltipProps<{ color: string }>) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0F172A]/95 p-3.5 shadow-2xl backdrop-blur-xl">
        <p className="text-sm font-bold text-white flex items-center gap-2" style={{ color: data.payload.color }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: data.payload.color }} />
          {data.name}
        </p>
        <p className="mt-1 text-xs text-slate-300">
          Số lượng: <span className="font-bold text-white">{data.value} xe</span>
        </p>
      </div>
    );
  }
  return null;
};

const PeakTooltip = ({ active, payload }: ChartTooltipProps<{ hour: string }>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0F172A]/95 p-3.5 shadow-2xl backdrop-blur-xl">
        <p className="text-xs font-semibold text-slate-400">Khung giờ: {data.hour}</p>
        <p className="mt-1.5 text-sm font-bold text-white flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          Lượt xe vào: <span className="text-amber-400 font-extrabold">{payload[0].value} lượt</span>
        </p>
      </div>
    );
  }
  return null;
};

// ─── Floor Occupancy Bar Chart ──────────────────────────────────────────────

function FloorOccupancySection({ floors }: { floors: FloorOccupancy[] }) {
  const COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];
  const data = floors.map((f, i) => ({
    name: `T${f.floorNumber}${f.floorType === 'resident' ? '' : '*'}`,
    fullName: `Tầng ${f.floorNumber} · ${f.buildingName}`,
    pct: f.pct,
    used: f.used,
    capacity: f.capacity,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <SectionCard>
      <SectionHeader label="Sức chứa thực tế" title="Lấp đầy theo tầng" />
      {floors.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-600">Đang tải dữ liệu tầng…</div>
      ) : (
        <>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ left: -24, right: 8, top: 4, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid stroke="rgba(148,163,184,0.10)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis
                  tickLine={false} axisLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(148,163,184,0.06)' }}
                  content={<CustomTooltip />}
                />
                <Bar dataKey="pct" radius={[8, 8, 0, 0]}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[10px] text-slate-600">* Tầng vãng lai</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {floors.map((f, i) => {
              const pct = f.pct;
              return (
                <div key={f.floorId} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-slate-300">
                      Tầng {f.floorNumber}
                      <span className="ml-1 text-slate-600">·</span>
                      <span className="ml-1 text-slate-500">{f.floorType === 'resident' ? 'Cư dân' : 'Vãng lai'}</span>
                      <span className="ml-1 text-slate-600">·</span>
                      <span className="ml-1 text-slate-500">{f.vehicleType === 'car' ? 'Ô tô' : 'Xe máy'}</span>
                    </p>
                  </div>
                  <span className={cn(
                    'text-xs font-bold tabular-nums',
                    pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-amber-400' : 'text-emerald-400'
                  )}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </SectionCard>
  );
}

// ─── Vehicle Mix Doughnut ───────────────────────────────────────────────────

function VehicleMixSection({ cars, motos }: { cars: number; motos: number }) {
  const total = cars + motos;
  const data = [
    { name: 'Ô tô', value: cars, color: '#3B82F6' },
    { name: 'Xe máy', value: motos, color: '#F59E0B' },
  ];
  return (
    <SectionCard>
      <SectionHeader label="Phương tiện đang gửi" title="Phân loại xe" />
      <div className="relative h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={58} outerRadius={84} paddingAngle={5} stroke="rgba(15,23,42,0.9)" strokeWidth={4}>
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip content={<VehicleTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{total}</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Đang gửi</span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <div>
              <p className="text-xs text-slate-400">{d.name}</p>
              <p className="text-base font-black text-white">{d.value}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── Peak Hours Area Chart ──────────────────────────────────────────────────

function PeakHoursSection({ data }: { data: PeakPoint[] }) {
  return (
    <SectionCard>
      <SectionHeader label="Phân bố xe vào trong ngày" title="Giờ cao điểm (30 ngày gần nhất)" />
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="peakStroke" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
              <linearGradient id="peakFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.10)" vertical={false} />
            <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
            <Tooltip
              cursor={{ stroke: 'rgba(245,158,11,0.3)', strokeWidth: 1 }}
              content={<PeakTooltip />}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="url(#peakStroke)"
              strokeWidth={2.5}
              fill="url(#peakFill)"
              dot={false}
              activeDot={{ r: 5, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

// ─── Active Sessions Table ─────────────────────────────────────────────────

function ActiveSessionsSection({ sessions, loading }: { sessions: ActiveSessionApiItem[]; loading: boolean }) {
  return (
    <SectionCard>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">Theo dõi xe</p>
          <h2 className="mt-0.5 text-xl font-bold tracking-tight text-white">Phiên đang hoạt động</h2>
        </div>
        <Link
          to="/staff/sessions"
          className="inline-flex h-9 items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-slate-300 transition hover:border-blue-400/40 hover:text-white"
        >
          <Activity className="h-3.5 w-3.5" />
          Xem tất cả
        </Link>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center text-sm text-slate-500">Đang tải…</div>
      ) : sessions.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
          <Zap className="h-8 w-8 text-slate-700" />
          <p className="text-sm text-slate-600">Chưa có xe nào đang gửi</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Biển số', 'Loại xe', 'Giờ vào', 'Thời gian', 'Nhân viên', ''].map((h) => (
                  <th key={h} className="pb-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 first:pl-0 last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              <AnimatePresence>
                {sessions.slice(0, 8).map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group transition hover:bg-white/[0.02]"
                  >
                    <td className="py-3 pr-4 font-black tracking-widest text-white">{s.licensePlate}</td>
                    <td className="py-3 pr-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold',
                        s.vehicleType === 'car'
                          ? 'border-blue-400/30 bg-blue-400/10 text-blue-300'
                          : 'border-amber-400/30 bg-amber-400/10 text-amber-300'
                      )}>
                        {s.vehicleType === 'car' ? <Car className="h-3 w-3" /> : <Motorbike className="h-3 w-3" />}
                        {s.vehicleType === 'car' ? 'Ô tô' : 'Xe máy'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-400">{formatTime(s.entryTime)}</td>
                    <td className="py-3 pr-4 tabular-nums text-slate-300">{formatDuration(s.entryTime)}</td>
                    <td className="py-3 pr-4 text-slate-500">{s.staff?.fullName ?? '—'}</td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/staff/check-out?plate=${encodeURIComponent(s.licensePlate)}`}
                        className="inline-flex h-7 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[11px] font-semibold text-slate-400 opacity-0 transition hover:border-blue-400/40 hover:text-white group-hover:opacity-100"
                      >
                        <LogOut className="h-3 w-3" />
                        Checkout
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function StaffDashboardPage() {
  const [sessions, setSessions] = useState<ActiveSessionApiItem[]>([]);
  const [totalActive, setTotalActive] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [floors, setFloors] = useState<FloorOccupancy[]>([]);
  const [peakHours, setPeakHours] = useState<PeakPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [countdown, setCountdown] = useState(30);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [activeRes, completedRes, floorRes] = await Promise.all([
        // All active sessions (up to 200 for stats)
        fetch(`${API_BASE_URL}/parking-sessions?status=active&limit=200`, { headers: authHeaders() })
          .then(r => r.json()),
        // Completed sessions today
        (() => {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const params = new URLSearchParams({ status: 'completed', limit: '1' });
          return fetch(`${API_BASE_URL}/parking-sessions?${params}`, { headers: authHeaders() })
            .then(r => r.json());
        })(),
        // All floors
        floorService.getFloors({ limit: 200, isActive: true }),
      ]);

      // ── Active sessions
      const activeSessions: ActiveSessionApiItem[] = activeRes?.data ?? [];
      setSessions(activeSessions);
      setTotalActive(activeRes?.pagination?.total ?? activeSessions.length);
      setCompletedToday(completedRes?.pagination?.total ?? 0);

      // ── Floor occupancy: fetch slots + rows per floor
      const floorList: Floor[] = floorRes.floors;
      const occupancyResults = await Promise.allSettled(
        floorList.map(async (floor): Promise<FloorOccupancy> => {
          if (floor.vehicleType === 'car') {
            // Count active sessions on this floor as "used" (visitor), or slot status (resident)
            const slotsRes = await slotService.getSlots({ floorId: floor.id, limit: 200 });
            const slots = slotsRes.slots;
            const used = floor.floorType === 'resident'
              ? slots.filter(s => s.status === 'occupied' || s.status === 'reserved').length
              : activeSessions.filter(s => s.floorId === floor.id).length;
            const capacity = floor.totalSlots || slots.length || 1;
            return {
              floorId: floor.id,
              floorNumber: floor.floorNumber,
              vehicleType: 'car',
              floorType: floor.floorType,
              buildingName: floor.building?.name ?? '',
              used,
              capacity,
              pct: Math.round((used / capacity) * 100),
            };
          } else {
            const rows = await fetchRows({ floorId: String(floor.id) });
            const used = rows.reduce((s, r) => s + r.occupiedCount, 0);
            const capacity = rows.reduce((s, r) => s + r.capacity, 0) || 1;
            return {
              floorId: floor.id,
              floorNumber: floor.floorNumber,
              vehicleType: 'motorcycle',
              floorType: floor.floorType,
              buildingName: floor.building?.name ?? '',
              used,
              capacity,
              pct: Math.round((used / capacity) * 100),
            };
          }
        })
      );
      setFloors(
        occupancyResults
          .filter((r): r is PromiseFulfilledResult<FloorOccupancy> => r.status === 'fulfilled')
          .map(r => r.value)
          .sort((a, b) => compareFloorCode(a.floorNumber, b.floorNumber))
      );

      // ── Peak hours: derive from active sessions entry times (approximation)
      // Build 24-bucket histogram from session entry times
      const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}h`, count: 0 }));
      activeSessions.forEach(s => {
        const h = new Date(s.entryTime).getHours();
        buckets[h].count++;
      });
      // Keep only hours 5–23 for readability
      setPeakHours(buckets.slice(5));

      setLastUpdated(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch {
      // silently ignore errors to keep dashboard alive
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const resetCountdown = useCallback(() => {
    setCountdown(30);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
  }, []);

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  useEffect(() => {
    resetCountdown();
    pollingRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadDashboard(true);
        resetCountdown();
      }
    }, 30_000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [loadDashboard, resetCountdown]);

  const handleRefresh = useCallback(() => {
    resetCountdown();
    loadDashboard(true);
  }, [loadDashboard, resetCountdown]);

  const motos = sessions.filter(s => s.vehicleType === 'motorcycle').length;
  const cars = sessions.filter(s => s.vehicleType === 'car').length;

  return (
    <KioskLayout
      eyebrow="Staff Kiosk"
      title="Tổng Quan Ca Trực"
      subtitle="Theo dõi xe ra vào · Sức chứa tầng · Giờ cao điểm theo thời gian thực"
      headerRight={
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-[10px] text-slate-600">
                Cập nhật: <span className="font-semibold text-slate-400">{lastUpdated}</span>
              </span>
              <span className="text-[10px] text-slate-700">
                Tự động sau{' '}
                <span className={cn('font-bold tabular-nums', countdown <= 5 ? 'text-amber-400' : 'text-slate-500')}>
                  {countdown}s
                </span>
              </span>
            </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            title="Làm mới ngay"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-blue-400/40 hover:text-blue-300 disabled:opacity-40"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* ── Row 1: KPIs ─────────────────────────────────────────────── */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={Zap} label="Xe đang gửi" value={loading ? '…' : totalActive} sub="Đang trong bãi" tone="blue" delay={0} />
          <KpiCard icon={Motorbike} label="Xe máy đang gửi" value={loading ? '…' : motos} sub={`${totalActive > 0 ? Math.round((motos / totalActive) * 100) : 0}% tổng xe`} tone="amber" delay={0.05} />
          <KpiCard icon={Car} label="Ô tô đang gửi" value={loading ? '…' : cars} sub={`${totalActive > 0 ? Math.round((cars / totalActive) * 100) : 0}% tổng xe`} tone="cyan" delay={0.1} />
          <KpiCard icon={TrendingUp} label="Đã checkout hôm nay" value={loading ? '…' : completedToday} sub="Phiên đã hoàn tất" tone="emerald" delay={0.15} />
        </section>

        {/* ── Navigation Actions ───────────────────────────────────────── */}
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              to: '/staff/check-in',
              icon: LogIn,
              label: 'Check-in Xe Vào',
              desc: 'Quét biển số xe, nhận diện loại xe & xác nhận vào bãi',
              stats: 'Cổng 1 & 2',
              statusText: 'Sẵn sàng',
              toneColor: 'text-blue-400',
              borderColor: 'hover:border-blue-500/50',
              glowColor: 'group-hover:shadow-blue-500/10',
              iconBg: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
              accentGradient: 'from-blue-600/80 to-cyan-500/80',
            },
            {
              to: '/staff/check-out',
              icon: LogOut,
              label: 'Check-out Xe Ra',
              desc: 'Quét biển số xe, kiểm tra thời lượng & tính phí tự động',
              stats: 'Cổng 3 & 4',
              statusText: 'Sẵn sàng',
              toneColor: 'text-emerald-400',
              borderColor: 'hover:border-emerald-500/50',
              glowColor: 'group-hover:shadow-emerald-500/10',
              iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
              accentGradient: 'from-emerald-600/80 to-teal-500/80',
            },
            {
              to: '/staff/sessions',
              icon: Users,
              label: 'Phiên Đang Gửi',
              desc: 'Quản lý toàn bộ danh sách các phương tiện trong bãi',
              stats: `${totalActive} xe hoạt động`,
              statusText: 'Giám sát',
              toneColor: 'text-purple-400',
              borderColor: 'hover:border-purple-500/50',
              glowColor: 'group-hover:shadow-purple-500/10',
              iconBg: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
              accentGradient: 'from-purple-600/80 to-pink-500/80',
            },
          ].map((action, i) => (
            <motion.div
              key={action.to}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05, duration: 0.45 }}
              whileHover={{ y: -4 }}
              className="group relative"
            >
              <Link
                to={action.to}
                className={cn(
                  "relative block h-full overflow-hidden rounded-[24px] border border-white/10 bg-[#0B0F19]/90 p-6 shadow-xl transition-all duration-300",
                  action.borderColor,
                  action.glowColor
                )}
              >
                {/* Accent glow on top boundary */}
                <div className={cn("absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r opacity-80 transition-all duration-300 group-hover:h-[4px] group-hover:opacity-100", action.accentGradient)} />
                
                {/* Background soft radial gradient for premium look */}
                <div className="absolute inset-0 opacity-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-white/[0.04] via-transparent to-transparent transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="flex items-start justify-between mb-5">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border backdrop-blur-md", action.iconBg)}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-bold tabular-nums text-slate-400">
                      {action.stats}
                    </span>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-slate-500 font-semibold">{action.statusText}</p>
                  </div>
                </div>

                <h3 className="text-lg font-black text-white group-hover:text-blue-300 transition-colors duration-200">
                  {action.label}
                </h3>
                
                <p className="mt-1.5 text-xs text-slate-400 leading-relaxed font-normal">
                  {action.desc}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-white/[0.04] pt-4">
                  <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-300 transition-colors">
                    Truy cập trang
                  </span>
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-xl bg-white/[0.02] border border-white/[0.06] transition-all duration-300 group-hover:bg-white/[0.05] group-hover:border-white/[0.12]", action.toneColor)}>
                    <svg className="h-4 w-4 translate-x-0 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ── Row 2: Floor Occupancy + Vehicle Mix ─────────────────── */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
          <FloorOccupancySection floors={floors} />
          <VehicleMixSection cars={cars} motos={motos} />
        </div>

        {/* ── Row 3: Peak Hours ─────────────────────────────────────── */}
        <PeakHoursSection data={peakHours} />

        {/* ── Row 4: Active Sessions Table ──────────────────────────── */}
        <ActiveSessionsSection sessions={sessions} loading={loading} />

      </div>
    </KioskLayout>
  );
}

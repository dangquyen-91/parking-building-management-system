import { useEffect, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp, Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { GroupBy } from '../../types/report';

// ---- điền ngày/kỳ trống để biểu đồ chạy liên tục từ from→to ----
const pad = (n: number) => String(n).padStart(2, '0');

/** Danh sách key kỳ liên tục giữa from→to, khớp định dạng DATE_FORMAT của backend.
 *  Trả [] cho 'week' (định dạng %Y-%u của MySQL khó tái tạo chính xác → không fill). */
export function periodKeys(from: string, to: string, groupBy: GroupBy): string[] {
  const keys: string[] = [];
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return keys;
  if (groupBy === 'month') {
    const d = new Date(start.getFullYear(), start.getMonth(), 1);
    while (d <= end) { keys.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`); d.setMonth(d.getMonth() + 1); }
  } else if (groupBy === 'day') {
    const d = new Date(start);
    while (d <= end) { keys.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`); d.setDate(d.getDate() + 1); }
  }
  return keys;
}

/** Ghép dữ liệu thật vào dải key liên tục; key thiếu được điền bằng `empty(key)`. */
export function fillSeries<T>(rows: T[], keys: string[], keyOf: (r: T) => string, empty: (key: string) => T): T[] {
  if (keys.length === 0) return rows;
  const map = new Map(rows.map((r) => [keyOf(r), r]));
  return keys.map((k) => map.get(k) ?? empty(k));
}

// ---- bảng màu dùng chung cho biểu đồ (đồng bộ với design system tối) ----
export const COLORS = {
  session: '#34D399',
  booking: '#60A5FA',
  subscription: '#C084FC',
  car: '#22D3EE',
  motorcycle: '#C084FC',
  blue: '#60A5FA',
  amber: '#FBBF24',
  red: '#F87171',
  grid: 'rgba(255,255,255,0.06)',
  axis: '#64748B',
};

// ---- formatters ----
export const fmtNum = (n: number) => (n ?? 0).toLocaleString('vi-VN');

export const fmtVND = (n: number) => `${(n ?? 0).toLocaleString('vi-VN')} ₫`;

export const fmtShort = (n: number) => {
  const v = n ?? 0;
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} tỷ`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} tr`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
};

export const fmtDateTime = (v: string | null) => (v ? new Date(v).toLocaleString('vi-VN') : '--');

// ---- hook fetch đơn giản, hủy khi unmount/đổi deps ----
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data?: T; loading: boolean; error?: string }>({ loading: true });
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    fn()
      .then((d) => alive && setState({ data: d, loading: false }))
      .catch((e) => alive && setState({ loading: false, error: e instanceof Error ? e.message : 'Không tải được dữ liệu' }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

// ---- card khung biểu đồ ----
export function ReportCard({
  title,
  hint,
  action,
  className,
  children,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn('rounded-[24px] border border-white/10 bg-[#0F172A]/80 p-5 backdrop-blur-xl', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-white">{title}</h3>
          {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const toneClasses: Record<string, string> = {
  blue: 'from-blue-500/25 to-cyan-400/10 text-blue-300',
  purple: 'from-purple-500/25 to-blue-500/10 text-purple-300',
  green: 'from-emerald-500/25 to-teal-400/10 text-emerald-300',
  amber: 'from-amber-500/25 to-orange-400/10 text-amber-300',
  cyan: 'from-cyan-500/25 to-blue-400/10 text-cyan-300',
};

export function StatCard({
  icon: Icon,
  tone = 'blue',
  label,
  value,
  sub,
  delta,
}: {
  icon: LucideIcon;
  tone?: keyof typeof toneClasses;
  label: string;
  value: string;
  sub?: ReactNode;
  delta?: { value: string; trend: 'up' | 'down' } | null;
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#0F172A]/80 p-5 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br', toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        {delta && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
              delta.trend === 'up'
                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                : 'border-red-400/20 bg-red-400/10 text-red-300',
            )}
          >
            {delta.trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {delta.value}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-white tabular-nums">{value}</p>
      {sub && <p className="mt-2 text-xs text-slate-500">{sub}</p>}
    </article>
  );
}

// ---- trạng thái loading / lỗi / rỗng ----
export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return <div className="animate-pulse rounded-2xl bg-white/[0.04]" style={{ height }} />;
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200">
      {message}
    </div>
  );
}

export function EmptyState({ label = 'Chưa có dữ liệu trong khoảng thời gian này' }: { label?: string }) {
  return (
    <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-white/10 py-10 text-center">
      <Inbox className="h-7 w-7 text-slate-600" />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

// ---- tooltip tối dùng chung cho recharts ----
export function DarkTooltip({
  active,
  payload,
  label,
  valueFormatter = fmtShort,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  valueFormatter?: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0B1120]/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {label !== undefined && <p className="mb-1 font-semibold text-slate-300">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-slate-300">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-semibold text-white tabular-nums">{valueFormatter(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

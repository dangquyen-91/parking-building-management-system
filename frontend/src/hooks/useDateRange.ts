import { useMemo, useState } from 'react';
import type { GroupBy } from '../types/report';

export type RangePreset = 'today' | '7d' | 'month' | 'quarter' | 'year';

const toISODate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function rangeForPreset(preset: RangePreset): { from: string; to: string } {
  const now = new Date();
  const to = toISODate(now);
  if (preset === 'today') return { from: to, to };
  if (preset === '7d') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    return { from: toISODate(start), to };
  }
  if (preset === 'year') {
    return { from: toISODate(new Date(now.getFullYear(), 0, 1)), to };
  }
  if (preset === 'quarter') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    return { from: toISODate(new Date(now.getFullYear(), quarterStartMonth, 1)), to };
  }
  // month (default)
  return { from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), to };
}

/** Chọn groupBy hợp lý theo độ dài khoảng ngày để biểu đồ không quá dày/thưa. */
export function suggestGroupBy(from: string, to: string): GroupBy {
  const days = (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000;
  if (days <= 31) return 'day';
  if (days <= 120) return 'week';
  return 'month';
}

export interface DateRangeState {
  from: string;
  to: string;
  preset: RangePreset | null;
  groupBy: GroupBy;
  setGroupBy: (v: GroupBy) => void;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  applyPreset: (p: RangePreset) => void;
}

export function useDateRange(initial: RangePreset = 'month'): DateRangeState {
  const init = rangeForPreset(initial);
  const [from, setFromRaw] = useState(init.from);
  const [to, setToRaw] = useState(init.to);
  const [preset, setPreset] = useState<RangePreset | null>(initial);
  const [groupByOverride, setGroupByOverride] = useState<GroupBy | null>(null);

  const groupBy = useMemo(
    () => groupByOverride ?? suggestGroupBy(from, to),
    [from, groupByOverride, to],
  );

  return {
    from,
    to,
    preset,
    groupBy,
    setGroupBy: setGroupByOverride,
    setFrom: (v) => { setFromRaw(v); setPreset(null); setGroupByOverride(null); },
    setTo: (v) => { setToRaw(v); setPreset(null); setGroupByOverride(null); },
    applyPreset: (p) => {
      const r = rangeForPreset(p);
      setFromRaw(r.from);
      setToRaw(r.to);
      setPreset(p);
      setGroupByOverride(null);
    },
  };
}

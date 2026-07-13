import { useMemo, useState } from 'react';
import type { GroupBy } from '../types/report';

export type RangePreset = 'today' | '7d' | 'month' | 'year';

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

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
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  applyPreset: (p: RangePreset) => void;
}

export function useDateRange(initial: RangePreset = 'month'): DateRangeState {
  const init = rangeForPreset(initial);
  const [from, setFromRaw] = useState(init.from);
  const [to, setToRaw] = useState(init.to);
  const [preset, setPreset] = useState<RangePreset | null>(initial);

  const groupBy = useMemo(() => suggestGroupBy(from, to), [from, to]);

  return {
    from,
    to,
    preset,
    groupBy,
    setFrom: (v) => { setFromRaw(v); setPreset(null); },
    setTo: (v) => { setToRaw(v); setPreset(null); },
    applyPreset: (p) => {
      const r = rangeForPreset(p);
      setFromRaw(r.from);
      setToRaw(r.to);
      setPreset(p);
    },
  };
}

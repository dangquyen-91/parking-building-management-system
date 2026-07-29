import { useMemo, useState } from 'react';
import { Banknote, Receipt, Trophy } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { reportService } from '../../services/report.service';
import { cn } from '../../lib/utils';
import type { GroupBy, ComparePeriod, CompareBaseline } from '../../types/report';
import {
  COLORS, ReportCard, StatCard, useAsync, fmtVND, fmtShort, fmtNum,
  ChartSkeleton, ErrorBox, EmptyState, DarkTooltip, periodKeys, fillSeries,
} from './shared';

const axisTick = { fill: COLORS.axis, fontSize: 11 };

const PERIOD_LABELS: Record<ComparePeriod, string> = { week: 'Tuần', month: 'Tháng', quarter: 'Quý', year: 'Năm' };

export default function RevenueTab({ from, to, groupBy }: { from: string; to: string; groupBy: GroupBy }) {
  const [period, setPeriod] = useState<ComparePeriod>('month');
  const [baseline, setBaseline] = useState<CompareBaseline>('previous');
  const comparison = useAsync(() => reportService.getRevenueComparison(period, baseline), [period, baseline]);
  const revenue = useAsync(() => reportService.getRevenue({ from, to, groupBy }), [from, to, groupBy]);
  const byVehicle = useAsync(() => reportService.getRevenueByVehicle({ from, to, groupBy }), [from, to, groupBy]);

  const rev = useMemo(() => revenue.data ?? [], [revenue.data]);
  const vehicleRows = useMemo(() => byVehicle.data ?? [], [byVehicle.data]);
  const totals = useMemo(() => {
    const t = rev.reduce(
      (a, r) => ({
        total: a.total + r.total,
        session: a.session + r.session,
        booking: a.booking + r.booking,
        subscription: a.subscription + r.subscription,
        count: a.count + 1,
      }),
      { total: 0, session: 0, booking: 0, subscription: 0, count: 0 },
    );
    const peak = rev.reduce<{ period: string; total: number } | null>(
      (m, r) => (!m || r.total > m.total ? { period: r.period, total: r.total } : m), null,
    );
    const srcEntries: Array<[string, number]> = [
      ['người dùng gói', t.subscription], ['vé lượt', t.session], ['đặt chỗ', t.booking],
    ];
    const top = srcEntries.sort((a, b) => b[1] - a[1])[0];
    const topPct = t.total > 0 ? Math.round((top[1] / t.total) * 100) : 0;
    return { ...t, peak, topSource: top[0], topPct };
  }, [rev]);

  const keys = useMemo(() => periodKeys(from, to, groupBy), [from, to, groupBy]);
  const revChart = useMemo(
    () => fillSeries(rev, keys, (r) => r.period, (period) => ({ period, total: 0, session: 0, booking: 0, subscription: 0 })),
    [rev, keys],
  );
  const byVehicleChart = useMemo(
    () => fillSeries(vehicleRows, keys, (r) => r.period, (period) => ({ period, motorcycle: 0, car: 0, total: 0 })),
    [vehicleRows, keys],
  );

  const cmp = comparison.data;
  const delta = cmp?.changePercent != null
    ? { value: `${Math.abs(cmp.changePercent)}%`, trend: cmp.changePercent >= 0 ? ('up' as const) : ('down' as const) }
    : null;
  const periodLabel = PERIOD_LABELS[period];
  const baselineLabel = baseline === 'last_year' ? `cùng ${periodLabel.toLowerCase()} năm trước` : `${periodLabel.toLowerCase()} trước`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {(['week', 'month', 'quarter', 'year'] as ComparePeriod[]).map((p) => (
            <button key={p} type="button" onClick={() => setPeriod(p)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition', period === p ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white')}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {([['previous', 'Kỳ trước'], ['last_year', 'Cùng kỳ năm trước']] as [CompareBaseline, string][]).map(([b, label]) => (
            <button key={b} type="button" onClick={() => setBaseline(b)}
              className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition', baseline === b ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white')}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Banknote} tone="green" label={`So sánh ${periodLabel.toLowerCase()} hiện tại`}
          value={cmp ? fmtShort(cmp.current.revenue) : '...'}
          delta={delta}
          sub={cmp ? <>{baseline === 'last_year' ? 'Cùng kỳ năm trước' : 'Kỳ trước'} <b className="text-slate-300">{fmtShort(cmp.previous.revenue)}</b> · không phụ thuộc bộ lọc</> : `so với ${baselineLabel}`}
        />
        <StatCard
          icon={Receipt} tone="blue" label="Doanh thu trong kỳ"
          value={fmtShort(totals.total)}
          sub={<>{fmtNum(totals.count)} mốc thời gian theo bộ lọc</>}
        />
        <StatCard
          icon={Trophy} tone="purple" label="Mốc doanh thu cao nhất"
          value={totals.peak ? totals.peak.period : '--'}
          sub={totals.peak ? <>Đạt <b className="text-slate-300">{fmtShort(totals.peak.total)}</b></> : 'chưa có dữ liệu'}
        />
      </div>

      <ReportCard title="Doanh thu theo thời gian" hint={`Nhóm theo ${groupBy === 'day' ? 'ngày' : groupBy === 'week' ? 'tuần' : 'tháng'} · tách 3 nguồn`}>
        {revenue.loading ? <ChartSkeleton /> : revenue.error ? <ErrorBox message={revenue.error} /> : rev.length === 0 ? <EmptyState /> : (
          <>
            {totals.total > 0 && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-400/20 bg-gradient-to-r from-blue-500/10 to-transparent px-4 py-2.5 text-[13px] text-blue-100">
                <span><b>{totals.topSource}</b> đóng góp <b>{totals.topPct}%</b> tổng doanh thu trong kỳ.</span>
              </div>
            )}
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revChart} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="period" tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={fmtShort} tick={axisTick} tickLine={false} axisLine={false} width={48} />
                <Tooltip content={<DarkTooltip valueFormatter={fmtVND} />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="session" name="Vé lượt" stackId="1" stroke={COLORS.session} fill={COLORS.session} fillOpacity={0.25} />
                <Area type="monotone" dataKey="booking" name="Đặt chỗ" stackId="1" stroke={COLORS.booking} fill={COLORS.booking} fillOpacity={0.25} />
                <Area type="monotone" dataKey="subscription" name="Người dùng gói" stackId="1" stroke={COLORS.subscription} fill={COLORS.subscription} fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </ReportCard>

      <ReportCard title="Doanh thu theo loại xe" hint="Ô tô và xe máy">
        {byVehicle.loading ? <ChartSkeleton height={200} /> : byVehicle.error ? <ErrorBox message={byVehicle.error} /> : vehicleRows.length === 0 ? <EmptyState /> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byVehicleChart} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="period" tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={fmtShort} tick={axisTick} tickLine={false} axisLine={false} width={48} />
              <Tooltip content={<DarkTooltip valueFormatter={fmtVND} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="car" name="Ô tô" fill={COLORS.car} radius={[4, 4, 0, 0]} />
              <Bar dataKey="motorcycle" name="Xe máy" fill={COLORS.motorcycle} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ReportCard>
    </div>
  );
}

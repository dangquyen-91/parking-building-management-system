import { useMemo, useState } from 'react';
import { Banknote, ChartNoAxesCombined, CreditCard, Receipt } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { reportService } from '../../services/report.service';
import type { ComparisonMode, GroupBy } from '../../types/report';
import {
  COLORS, ReportCard, StatCard, useAsync, fmtVND, fmtShort, fmtNum,
  ChartSkeleton, ErrorBox, EmptyState, DarkTooltip, periodKeys, fillSeries,
} from './shared';

const axisTick = { fill: COLORS.axis, fontSize: 11 };

const groupLabels: Record<GroupBy, string> = {
  day: 'ngày',
  week: 'tuần',
  month: 'tháng',
  quarter: 'quý',
  year: 'năm',
};

const formatRange = (from: string, to: string) => {
  const format = (value: string) => new Date(value).toLocaleDateString('vi-VN');
  return `${format(from)} - ${format(to)}`;
};

export default function RevenueTab({
  from,
  to,
  groupBy,
  comparisonPeriod,
}: {
  from: string;
  to: string;
  groupBy: GroupBy;
  comparisonPeriod?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}) {
  const [compareMode, setCompareMode] = useState<ComparisonMode>('previous_period');
  const comparison = useAsync(
    () => reportService.getRevenueComparison({ from, to, compare: compareMode, period: comparisonPeriod }),
    [compareMode, comparisonPeriod, from, to],
  );
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
        count: a.count + r.count,
        cash: a.cash + r.cash,
        vnpay: a.vnpay + r.vnpay,
      }),
      { total: 0, session: 0, booking: 0, subscription: 0, count: 0, cash: 0, vnpay: 0 },
    );
    const peak = rev.reduce<{ period: string; total: number } | null>(
      (m, r) => (!m || r.total > m.total ? { period: r.period, total: r.total } : m), null,
    );
    const srcEntries: Array<[string, number]> = [
      ['thuê bao', t.subscription], ['vé lượt', t.session], ['đặt chỗ', t.booking],
    ];
    const top = srcEntries.sort((a, b) => b[1] - a[1])[0];
    const topPct = t.total > 0 ? Math.round((top[1] / t.total) * 100) : 0;
    return {
      ...t,
      average: t.count > 0 ? t.total / t.count : 0,
      peak,
      topSource: top[0],
      topPct,
    };
  }, [rev]);

  const keys = useMemo(() => periodKeys(from, to, groupBy), [from, to, groupBy]);
  const revChart = useMemo(
    () => fillSeries(rev, keys, (r) => r.period, (period) => ({
      period,
      total: 0,
      session: 0,
      booking: 0,
      subscription: 0,
      count: 0,
      sessionCount: 0,
      bookingCount: 0,
      subscriptionCount: 0,
      cash: 0,
      vnpay: 0,
    })),
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
  const comparisonLabel = compareMode === 'previous_period' ? 'kỳ liền trước' : 'cùng kỳ năm trước';

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <label className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs text-slate-500">
          So sánh
          <select
            value={compareMode}
            onChange={(event) => setCompareMode(event.target.value as ComparisonMode)}
            className="bg-[#111827] text-sm font-semibold text-white outline-none"
          >
            <option value="previous_period">Kỳ liền trước</option>
            <option value="previous_year">Cùng kỳ năm trước</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Banknote} tone="green" label="Doanh thu trong kỳ"
          value={fmtShort(totals.total)}
          sub={<>{formatRange(from, to)} · theo thời gian thanh toán</>}
        />
        <StatCard
          icon={ChartNoAxesCombined} tone="purple" label={`So với ${comparisonLabel}`}
          value={cmp?.changePercent == null ? '--' : `${cmp.changePercent >= 0 ? '+' : ''}${cmp.changePercent}%`}
          delta={delta}
          sub={cmp ? <><b className="text-slate-300">{fmtShort(cmp.previous.revenue)}</b> · {formatRange(cmp.previous.from, cmp.previous.to)}</> : 'Đang tải kỳ đối chiếu'}
        />
        <StatCard
          icon={Receipt} tone="blue" label="Giao dịch thành công"
          value={fmtNum(totals.count)}
          sub="Chỉ tính payment có trạng thái thành công"
        />
        <StatCard
          icon={CreditCard} tone="amber" label="Trung bình mỗi giao dịch"
          value={fmtShort(totals.average)}
          sub={totals.peak ? <>Cao nhất <b className="text-slate-300">{totals.peak.period}</b></> : 'Chưa có dữ liệu'}
        />
      </div>

      <ReportCard title="Doanh thu theo thời gian" hint={`Nhóm theo ${groupLabels[groupBy]} · tách 3 nguồn · ghi nhận theo thời gian thanh toán`}>
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
                <Area type="monotone" dataKey="subscription" name="Thuê bao" stackId="1" stroke={COLORS.subscription} fill={COLORS.subscription} fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </ReportCard>

      <div className="grid gap-4 xl:grid-cols-2">
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

        <ReportCard title="Theo phương thức thanh toán" hint="Đối soát tiền mặt và VNPay trong kỳ">
          <div className="space-y-5 py-2">
            {[
              { label: 'Tiền mặt', value: totals.cash, color: 'bg-emerald-400' },
              { label: 'VNPay', value: totals.vnpay, color: 'bg-blue-400' },
            ].map((item) => {
              const percent = totals.total > 0 ? Math.round((item.value / totals.total) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-300">{item.label}</p>
                      <p className="mt-1 text-xl font-bold text-white tabular-nums">{fmtVND(item.value)}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-400">{percent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-sm text-slate-500">Tổng đã thanh toán</span>
              <strong className="text-lg text-white tabular-nums">{fmtVND(totals.total)}</strong>
            </div>
          </div>
        </ReportCard>
      </div>
    </div>
  );
}

import { AlertTriangle, Target, Ghost, KeyRound } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { reportService } from '../../services/report.service';
import { useMemo } from 'react';
import {
  COLORS, ReportCard, StatCard, useAsync, fmtNum,
  ChartSkeleton, ErrorBox, EmptyState, DarkTooltip, periodKeys, fillSeries,
} from './shared';

const axisTick = { fill: COLORS.axis, fontSize: 11 };
const VT_LABEL: Record<string, string> = { motorcycle: 'Xe máy', car: 'Ô tô' };
const STATUS_LABEL: Record<string, string> = { pending: 'Chờ duyệt', confirmed: 'Đã xác nhận', cancelled: 'Đã hủy', expired: 'Hết hạn' };

export default function BookingsTab({ from, to }: { from: string; to: string }) {
  const bookings = useAsync(() => reportService.getBookingStats({ from, to }), [from, to]);
  const subs = useAsync(() => reportService.getSubscriptionStats({ from, to }), [from, to]);

  const b = bookings.data;
  const s = subs.data;

  const newSubsChart = useMemo(
    () => fillSeries(s?.newSubscriptionsDaily ?? [], periodKeys(from, to, 'day'), (r) => r.date, (date) => ({ date, count: 0 })),
    [s, from, to],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Target} tone="blue" label="Tỷ lệ chuyển đổi đặt chỗ"
          value={b ? `${b.conversionRate}%` : '...'}
          sub={b ? <>{fmtNum(b.byStatus.confirmed)} / {fmtNum(b.total)} đặt chỗ thành công</> : undefined}
        />
        <StatCard
          icon={Ghost} tone="amber" label="Tỷ lệ no-show"
          value={b ? `${b.noShowRate}%` : '...'}
          sub="Đã xác nhận, đã qua giờ kết thúc, nhưng chưa check-in"
        />
        <StatCard
          icon={KeyRound} tone="green" label="Thuê bao đang hoạt động"
          value={s ? fmtNum(s.activeByPlan.reduce((a, p) => a + p.count, 0)) : '...'}
          sub={s ? <>Sắp hết hạn (7 ngày): <b className="text-amber-300">{fmtNum(s.expiringIn7Days)}</b></> : undefined}
        />
      </div>

      {s && s.expiringIn7Days > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span><b className="text-white">{fmtNum(s.expiringIn7Days)} thuê bao</b> sẽ hết hạn trong 7 ngày tới. Nên gửi nhắc gia hạn.</span>
        </div>
      )}

      <ReportCard title="Đặt chỗ theo trạng thái" hint="Trong khoảng thời gian đã chọn">
        {bookings.loading ? <ChartSkeleton height={120} /> : bookings.error ? <ErrorBox message={bookings.error} /> : !b || b.total === 0 ? <EmptyState /> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(STATUS_LABEL) as Array<keyof typeof b.byStatus>).map((k) => (
              <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs text-slate-500">{STATUS_LABEL[k]}</p>
                <p className="mt-1 text-xl font-bold text-white tabular-nums">{fmtNum(b.byStatus[k])}</p>
              </div>
            ))}
          </div>
        )}
      </ReportCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportCard title="Gói thuê bao đang dùng" hint="Số thuê bao active theo gói">
          {subs.loading ? <ChartSkeleton height={180} /> : subs.error ? <ErrorBox message={subs.error} /> : !s || s.activeByPlan.length === 0 ? <EmptyState /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="py-2">Gói</th><th className="py-2">Loại xe</th><th className="py-2 text-right">Đang dùng</th>
                  </tr>
                </thead>
                <tbody>
                  {s.activeByPlan.map((p, i) => (
                    <tr key={`${p.packageId}-${p.vehicleType}-${i}`} className="border-t border-white/5">
                      <td className="py-2 font-medium text-white">{p.packageName}</td>
                      <td className="py-2 text-slate-400">{VT_LABEL[p.vehicleType] ?? p.vehicleType}</td>
                      <td className="py-2 text-right tabular-nums text-white">{fmtNum(p.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportCard>

        <ReportCard title="Đăng ký thuê bao mới" hint="Theo ngày trong kỳ">
          {subs.loading ? <ChartSkeleton height={180} /> : subs.error ? <ErrorBox message={subs.error} /> : !s || s.newSubscriptionsDaily.length === 0 ? <EmptyState /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={newSubsChart} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                <Tooltip content={<DarkTooltip valueFormatter={(v) => `${fmtNum(v)} đăng ký`} />} />
                <Line type="monotone" dataKey="count" name="Đăng ký mới" stroke={COLORS.subscription} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ReportCard>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { reportService } from '../../services/report.service';
import type { DayType } from '../../types/report';
import {
  COLORS, ReportCard, useAsync, fmtNum, fmtShort, fmtDateTime,
  ChartSkeleton, ErrorBox, EmptyState, DarkTooltip,
} from './shared';
import { cn } from '../../lib/utils';

const axisTick = { fill: COLORS.axis, fontSize: 11 };
const VT_LABEL: Record<string, string> = { motorcycle: 'Xe máy', car: 'Ô tô' };

export default function TrafficTab({ from, to }: { from: string; to: string }) {
  const [dayType, setDayType] = useState<DayType | undefined>(undefined);

  const hours = useAsync(() => reportService.getPeakHours({ from, to }), [from, to]);
  const days = useAsync(() => reportService.getPeakDays({ from, to }), [from, to]);
  const sessions = useAsync(() => reportService.getSessionStats({ from, to }), [from, to]);
  const topVehicles = useAsync(() => reportService.getTopVehicles({ from, to, limit: 10, dayType }), [from, to, dayType]);
  const topUsers = useAsync(() => reportService.getTopUsers({ from, to, limit: 10 }), [from, to]);

  const hourData = hours.data ?? [];
  const hourMax = Math.max(1, ...hourData.map((h) => h.count));
  const sess = sessions.data;
  const vtData = sess
    ? Object.entries(sess.byVehicleType).map(([k, v]) => ({ name: VT_LABEL[k] ?? k, value: v, color: k === 'car' ? COLORS.car : COLORS.motorcycle }))
    : [];
  const avgH = sess ? Math.floor(sess.avgDurationMinutes / 60) : 0;
  const avgM = sess ? sess.avgDurationMinutes % 60 : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportCard title="Giờ cao điểm" hint="Theo khoảng đã chọn · lượt check-in theo giờ">
          {hours.loading ? <ChartSkeleton height={220} /> : hours.error ? <ErrorBox message={hours.error} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} tick={axisTick} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} width={32} />
                <Tooltip content={<DarkTooltip valueFormatter={(v) => `${fmtNum(v)} lượt`} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="count" name="Lượt vào" radius={[4, 4, 0, 0]}>
                  {hourData.map((h) => (
                    <Cell key={h.hour} fill={h.count >= hourMax * 0.85 ? COLORS.blue : 'rgba(96,165,250,0.4)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ReportCard>

        <ReportCard title="Theo thứ trong tuần" hint="Cuối tuần được tô vàng">
          {days.loading ? <ChartSkeleton height={220} /> : days.error ? <ErrorBox message={days.error} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={days.data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="dayName" tickFormatter={(d: string) => d.slice(0, 3)} tick={axisTick} tickLine={false} axisLine={false} />
                <YAxis tick={axisTick} tickLine={false} axisLine={false} width={32} />
                <Tooltip content={<DarkTooltip valueFormatter={(v) => `${fmtNum(v)} lượt`} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="count" name="Lượt vào" radius={[5, 5, 0, 0]}>
                  {(days.data ?? []).map((d) => (
                    <Cell key={d.dayOfWeek} fill={d.isWeekend ? COLORS.amber : COLORS.blue} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ReportCard>
      </div>

      <ReportCard title="Thống kê phiên gửi" hint="Phân bổ theo loại xe & thời gian gửi trung bình">
        {sessions.loading ? <ChartSkeleton height={180} /> : sessions.error ? <ErrorBox message={sessions.error} /> : !sess || sess.total === 0 ? <EmptyState /> : (
          <div className="flex flex-wrap items-center gap-8">
            <ResponsiveContainer width={170} height={170}>
              <PieChart>
                <Pie data={vtData} dataKey="value" innerRadius={48} outerRadius={75} paddingAngle={2} stroke="none">
                  {vtData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip content={<DarkTooltip valueFormatter={(v) => `${fmtNum(v)} phiên`} />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-slate-500">Tổng phiên trong kỳ</p>
                <p className="text-2xl font-bold text-white tabular-nums">{fmtNum(sess.total)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Thời gian gửi trung bình</p>
                <p className="text-2xl font-bold text-white tabular-nums">{avgH}h {avgM}m</p>
              </div>
              <div className="flex gap-4 text-sm">
                {vtData.map((d) => (
                  <span key={d.name} className="flex items-center gap-2 text-slate-300">
                    <i className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} /> {d.name}: <b>{fmtNum(d.value)}</b>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </ReportCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportCard
          title="Xe quay lại nhiều nhất"
          hint="Xếp theo số lượt gửi"
          action={
            <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 text-xs font-semibold">
              {([['Tất cả', undefined], ['Ngày thường', 'weekday'], ['Cuối tuần', 'weekend']] as const).map(([label, val]) => (
                <button
                  key={label}
                  onClick={() => setDayType(val)}
                  className={cn('rounded-lg px-2.5 py-1 transition', dayType === val ? 'bg-blue-500/20 text-white' : 'text-slate-400 hover:text-white')}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        >
          {topVehicles.loading ? <ChartSkeleton height={200} /> : topVehicles.error ? <ErrorBox message={topVehicles.error} /> : (topVehicles.data ?? []).length === 0 ? <EmptyState /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-2">#</th><th className="py-2">Biển số</th><th className="py-2">Loại</th>
                    <th className="py-2 text-right">Lượt</th><th className="py-2 text-right">Tổng phí</th>
                  </tr>
                </thead>
                <tbody>
                  {(topVehicles.data ?? []).map((v) => (
                    <tr key={v.licensePlate + v.vehicleType} className="border-t border-white/5">
                      <td className="py-2 pr-2"><span className={cn('grid h-6 w-6 place-items-center rounded-lg text-xs font-bold', v.rank <= 3 ? 'bg-blue-500/15 text-blue-300' : 'bg-white/5 text-slate-400')}>{v.rank}</span></td>
                      <td className="py-2 font-semibold tracking-wide text-white">{v.licensePlate}</td>
                      <td className="py-2 text-slate-400">{VT_LABEL[v.vehicleType]}</td>
                      <td className="py-2 text-right tabular-nums text-white">{fmtNum(v.sessionCount)}</td>
                      <td className="py-2 text-right tabular-nums text-slate-300">{fmtShort(v.totalFee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportCard>

        <ReportCard title="Khách quay lại nhiều nhất" hint="Chỉ tính khách đã đăng nhập (không gồm khách vãng lai)">
          {topUsers.loading ? <ChartSkeleton height={200} /> : topUsers.error ? <ErrorBox message={topUsers.error} /> : (topUsers.data ?? []).length === 0 ? <EmptyState label="Chưa có khách đăng nhập nào trong kỳ" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-2">#</th><th className="py-2">Khách hàng</th>
                    <th className="py-2 text-right">Lượt</th><th className="py-2 text-right">Lần gần nhất</th>
                  </tr>
                </thead>
                <tbody>
                  {(topUsers.data ?? []).map((u) => (
                    <tr key={u.userId} className="border-t border-white/5">
                      <td className="py-2 pr-2"><span className={cn('grid h-6 w-6 place-items-center rounded-lg text-xs font-bold', u.rank <= 3 ? 'bg-purple-500/15 text-purple-300' : 'bg-white/5 text-slate-400')}>{u.rank}</span></td>
                      <td className="py-2"><span className="font-semibold text-white">{u.fullName}</span><br /><span className="text-xs text-slate-500">{u.email}</span></td>
                      <td className="py-2 text-right tabular-nums text-white">{fmtNum(u.sessionCount)}</td>
                      <td className="py-2 text-right text-xs text-slate-400">{fmtDateTime(u.lastVisit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ReportCard>
      </div>
    </div>
  );
}

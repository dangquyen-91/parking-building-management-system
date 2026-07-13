import { reportService } from '../../services/report.service';
import {
  ReportCard, useAsync, fmtNum, fmtShort,
  ChartSkeleton, ErrorBox, EmptyState,
} from './shared';
import { cn } from '../../lib/utils';

export default function StaffTab({ from, to }: { from: string; to: string }) {
  const staff = useAsync(() => reportService.getStaffStats({ from, to }), [from, to]);
  const rows = [...(staff.data ?? [])].sort((a, b) => b.cashCollected - a.cashCollected);

  return (
    <ReportCard
      title="Hiệu suất nhân viên"
      hint="Đối soát ca trực. Tiền mặt thu chỉ tính session payment thành công bằng cash trong kỳ."
    >
      {staff.loading ? <ChartSkeleton height={220} /> : staff.error ? <ErrorBox message={staff.error} /> : rows.length === 0 ? <EmptyState /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-2">#</th><th className="py-2">Nhân viên</th>
                <th className="py-2 text-right">Phiên xử lý</th><th className="py-2 text-right">Hoàn tất</th>
                <th className="py-2 text-right">Đã thu phí</th><th className="py-2 text-right">Tiền mặt thu</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.staffId} className="border-t border-white/5">
                  <td className="py-2.5 pr-2"><span className={cn('grid h-6 w-6 place-items-center rounded-lg text-xs font-bold', i < 3 ? 'bg-blue-500/15 text-blue-300' : 'bg-white/5 text-slate-400')}>{i + 1}</span></td>
                  <td className="py-2.5 font-medium text-white">{r.staffName ?? `#${r.staffId}`}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-300">{fmtNum(r.totalSessions)}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-300">{fmtNum(r.completedSessions)}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-300">{fmtNum(r.paidSessions)}</td>
                  <td className="py-2.5 text-right tabular-nums font-semibold text-emerald-300">{fmtShort(r.cashCollected)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ReportCard>
  );
}

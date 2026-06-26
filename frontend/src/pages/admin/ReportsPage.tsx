import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarRange } from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { useDateRange, type RangePreset } from '../../hooks/useDateRange';
import { cn } from '../../lib/utils';
import RevenueTab from '../../components/reports/RevenueTab';
import TrafficTab from '../../components/reports/TrafficTab';
import BookingsTab from '../../components/reports/BookingsTab';
import StaffTab from '../../components/reports/StaffTab';

const PRESETS: Array<{ key: RangePreset; label: string }> = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7d', label: '7 ngày' },
  { key: 'month', label: 'Tháng này' },
  { key: 'year', label: 'Năm nay' },
];

const TABS = ['Doanh thu', 'Lưu lượng & Bãi', 'Đặt chỗ & Thuê bao', 'Nhân viên'];

export default function ReportsPage() {
  const range = useDateRange('month');
  const [tab, setTab] = useState(0);

  return (
    <AdminLayout
      eyebrow="Phân tích"
      title="Báo cáo thống kê"
      subtitle="Phân tích theo khoảng thời gian — doanh thu, lưu lượng, đặt chỗ và hiệu suất nhân viên."
    >
      {/* Toolbar filter dùng chung */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
          <CalendarRange className="h-4 w-4 text-slate-500" />
          <span className="text-slate-500">Từ</span>
          <input type="date" value={range.from} max={range.to} onChange={(e) => range.setFrom(e.target.value)} className="bg-transparent text-white outline-none [color-scheme:dark]" />
        </label>
        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
          <span className="text-slate-500">Đến</span>
          <input type="date" value={range.to} min={range.from} onChange={(e) => range.setTo(e.target.value)} className="bg-transparent text-white outline-none [color-scheme:dark]" />
        </label>
        <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => range.applyPreset(p.key)}
              className={cn('rounded-xl px-3 py-1.5 text-xs font-semibold transition', range.preset === p.key ? 'bg-blue-500/20 text-white' : 'text-slate-400 hover:text-white')}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-white/10">
        {TABS.map((label, i) => (
          <button
            key={label}
            onClick={() => setTab(i)}
            className={cn('relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition', tab === i ? 'text-white' : 'text-slate-400 hover:text-white')}
          >
            {label}
            {tab === i && <motion.span layoutId="report-tab" className="absolute inset-x-3 -bottom-px h-0.5 rounded bg-gradient-to-r from-blue-400 to-purple-400" />}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {tab === 0 && <RevenueTab from={range.from} to={range.to} groupBy={range.groupBy} />}
        {tab === 1 && <TrafficTab from={range.from} to={range.to} />}
        {tab === 2 && <BookingsTab from={range.from} to={range.to} />}
        {tab === 3 && <StaffTab from={range.from} to={range.to} />}
      </motion.div>
    </AdminLayout>
  );
}

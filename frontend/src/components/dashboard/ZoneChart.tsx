import { motion } from 'framer-motion';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ZoneUsage } from '../../types/dashboard';

interface ZoneChartProps {
  data: ZoneUsage[];
}

export function ZoneChart({ data }: ZoneChartProps) {
  const averageUsage = Math.round(data.reduce((sum, zone) => sum + zone.value, 0) / data.length);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-[30px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
    >
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-400">Biểu đồ khu vực đỗ xe</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-white">Mức sử dụng theo tầng</h2>
      </div>

      <div className="relative h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={74} outerRadius={104} paddingAngle={4} stroke="rgba(15,23,42,0.9)" strokeWidth={5}>
              {data.map((zone) => (
                <Cell key={zone.name} fill={zone.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.94)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 18,
                color: '#FFFFFF',
              }}
              formatter={(value) => [`${value}%`, 'Mức sử dụng']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white">{averageUsage}%</span>
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Trung bình</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {data.map((zone) => (
          <div key={zone.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_14px_currentColor]" style={{ backgroundColor: zone.color, color: zone.color }} />
              <span className="text-sm font-medium text-slate-300">{zone.name}</span>
            </div>
            <span className="text-sm font-bold text-white">{zone.value}%</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { OccupancyPoint } from '../../types/dashboard';

interface OccupancyChartProps {
  data: OccupancyPoint[];
}

export function OccupancyChart({ data }: OccupancyChartProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-[30px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
    >
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">Parking Occupancy</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-white">Ty le lap day theo gio</h2>
        </div>
        <div className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-300">
          Live simulation
        </div>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
            <defs>
              <linearGradient id="occupancyStroke" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
              <linearGradient id="occupancyFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.34} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
            <XAxis dataKey="time" tickLine={false} axisLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(59,130,246,0.28)', strokeWidth: 1 }}
              contentStyle={{
                background: 'rgba(15,23,42,0.94)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 18,
                color: '#FFFFFF',
                boxShadow: '0 20px 60px rgba(0,0,0,0.32)',
              }}
              formatter={(value) => [`${value}%`, 'Occupancy']}
              labelStyle={{ color: '#94A3B8' }}
            />
            <Area
              type="monotone"
              dataKey="occupancy"
              stroke="url(#occupancyStroke)"
              strokeWidth={3}
              fill="url(#occupancyFill)"
              dot={{ r: 4, fill: '#070B14', stroke: '#3B82F6', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#8B5CF6', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}

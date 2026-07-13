import { motion } from 'framer-motion';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ZoneUsage } from '../../types/dashboard';
import type { FloorOccupancy } from '../../types/report';

const FLOOR_COLORS = ['#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

type ZoneChartProps = {
  floors?: FloorOccupancy[];
  data?: ZoneUsage[];
};

function getFloorTotal(floor: FloorOccupancy) {
  return (floor.vehicleType === 'car' ? floor.totalSlots : floor.totalCapacity) ?? floor.occupied + (floor.reserved ?? 0) + floor.available;
}

export function ZoneChart({ floors = [], data: legacyData }: ZoneChartProps) {
  const hasFloorData = floors.length > 0;
  const data = hasFloorData ? floors.map((floor, index) => {
    const reserved = floor.reserved ?? 0;
    const used = floor.occupied + reserved;
    const total = getFloorTotal(floor);

    return {
      name: `Tầng ${floor.floorNumber} · ${floor.floorType === 'resident' ? 'Cư dân' : 'Vãng lai'}`,
      used,
      total,
      available: floor.available,
      color: FLOOR_COLORS[index % FLOOR_COLORS.length],
    };
  }) : (legacyData ?? []).map((zone) => ({
    name: zone.name,
    used: zone.value,
    total: 100,
    available: Math.max(0, 100 - zone.value),
    color: zone.color,
  }));

  const totalUsed = data.reduce((sum, floor) => sum + floor.used, 0);
  const totalCapacity = data.reduce((sum, floor) => sum + floor.total, 0);
  const centerValue = hasFloorData
    ? `${totalUsed}/${totalCapacity}`
    : `${data.length > 0 ? Math.round(totalUsed / data.length) : 0}%`;
  const centerLabel = hasFloorData ? 'Chỗ đang dùng' : 'Trung bình';

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-[30px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
    >
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-400">Tổng quan sức chứa theo tầng</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-white">Chỗ đang dùng từng tầng</h2>
      </div>

      <div className="relative h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="used" innerRadius={74} outerRadius={104} paddingAngle={4} stroke="rgba(15,23,42,0.9)" strokeWidth={5}>
              {data.map((floor) => (
                <Cell key={floor.name} fill={floor.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.94)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 18,
                color: '#FFFFFF',
              }}
              formatter={(value, _name, item) => {
                const payload = item.payload as { total?: number; available?: number } | undefined;
                return hasFloorData
                  ? [`${value}/${payload?.total ?? 0} chỗ`, `Còn trống ${payload?.available ?? 0}`]
                  : [`${value}%`, 'Tỷ lệ sử dụng'];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white tabular-nums">{centerValue}</span>
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{centerLabel}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {data.map((floor) => (
          <div key={floor.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_14px_currentColor]" style={{ backgroundColor: floor.color, color: floor.color }} />
              <span className="text-sm font-medium text-slate-300">{floor.name}</span>
            </div>
            <span className="text-sm font-bold text-white tabular-nums">{hasFloorData ? `${floor.used}/${floor.total}` : `${floor.used}%`}</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

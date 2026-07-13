import { Bike, Car } from 'lucide-react';
import type { FloorOccupancy } from '../../types/report';
import { cn } from '../../lib/utils';

function barColor(rate: number) {
  if (rate >= 90) return 'bg-gradient-to-r from-rose-400 to-red-500';
  if (rate >= 85) return 'bg-gradient-to-r from-amber-400 to-orange-400';
  return 'bg-gradient-to-r from-blue-400 to-cyan-400';
}

export function FloorOccupancyBars({ floors }: { floors: FloorOccupancy[] }) {
  const sorted = [...floors].sort((a, b) => b.occupancyRate - a.occupancyRate);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-blue-400" /> Đang đậu</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-amber-400" /> Giữ chỗ</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-slate-600" /> Còn trống</span>
      </div>

      {sorted.map((f) => {
        const reserved = f.reserved ?? 0;
        const total = (f.vehicleType === 'car' ? f.totalSlots : f.totalCapacity) ?? f.occupied + reserved + f.available;
        const used = f.occupied + reserved;
        const Icon = f.vehicleType === 'car' ? Car : Bike;

        return (
          <div key={f.floorId} className="grid gap-2 border-t border-white/5 py-3 first:border-t-0 lg:grid-cols-[120px_1fr_180px] lg:items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Icon className="h-4 w-4 shrink-0 text-slate-500" />
              <span>Tầng {f.floorNumber}</span>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                {f.floorType === 'resident' ? 'Cư dân' : 'Vãng lai'}
              </span>
            </div>

            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
              <div className={cn('h-full rounded-full', barColor(f.occupancyRate))} style={{ width: `${Math.min(100, f.occupancyRate)}%` }} />
            </div>

            <div className="text-left text-[13px] text-slate-400 lg:text-right">
              <span className="font-semibold text-white tabular-nums">{used}/{total}</span>
              <span> chỗ đang dùng</span>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] lg:justify-end">
                <span>Đậu <b className="text-slate-200">{f.occupied}</b></span>
                {f.vehicleType === 'car' && <span>Giữ <b className="text-amber-300">{reserved}</b></span>}
                <span>Trống <b className="text-slate-200">{f.available}</b></span>
              </div>
            </div>
          </div>
        );
      })}

      {sorted.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Chưa có tầng nào đang hoạt động</p>}
    </div>
  );
}

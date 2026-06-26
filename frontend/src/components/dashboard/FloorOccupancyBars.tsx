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
    <div className="space-y-1">
      {sorted.map((f) => {
        const total = (f.vehicleType === 'car' ? f.totalSlots : f.totalCapacity) ?? f.occupied + f.available;
        const Icon = f.vehicleType === 'car' ? Car : Bike;
        return (
          <div key={f.floorId} className="flex items-center gap-3 border-t border-white/5 py-2.5 first:border-t-0">
            <div className="flex w-24 shrink-0 items-center gap-2 text-sm font-semibold text-white">
              <Icon className="h-4 w-4 text-slate-500" />
              Tầng {f.floorNumber}
            </div>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
              <div className={cn('h-full rounded-full', barColor(f.occupancyRate))} style={{ width: `${Math.min(100, f.occupancyRate)}%` }} />
            </div>
            <div className="w-28 shrink-0 text-right text-[13px] text-slate-400">
              <span className="font-semibold text-white tabular-nums">{f.occupancyRate}%</span>
              <span className="tabular-nums"> · {f.occupied}/{total}</span>
            </div>
          </div>
        );
      })}
      {sorted.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Chưa có tầng nào đang hoạt động</p>}
    </div>
  );
}

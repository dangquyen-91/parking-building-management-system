import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bike, Car, CheckCircle2, ChevronLeft, ChevronRight, Eye, Layers3, RefreshCw, Search } from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { cn } from '../../lib/utils';
import { buildingService, type Building } from '../../services/building.service';
import { floorService, type Floor, type FloorType, type VehicleType } from '../../services/floor.service';

const vehicleLabels: Record<VehicleType, string> = {
  car: 'Ô tô',
  motorcycle: 'Xe máy',
};

const floorTypeLabels: Record<FloorType, string> = {
  resident: 'Cư dân',
  visitor: 'Khách vãng lai',
};

export default function FloorsPage() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [buildingId, setBuildingId] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [floorType, setFloorType] = useState<FloorType | ''>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    return {
      total: pagination.total,
      active: floors.filter((floor) => floor.isActive).length,
      car: floors.filter((floor) => floor.vehicleType === 'car').length,
      motorcycle: floors.filter((floor) => floor.vehicleType === 'motorcycle').length,
    };
  }, [floors, pagination.total]);

  const loadFloors = async (page = pagination.page) => {
    setLoading(true);
    setError(null);
    try {
      const result = await floorService.getFloors({
        buildingId: buildingId ? Number(buildingId) : undefined,
        vehicleType: vehicleType || undefined,
        floorType: floorType || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        page,
        limit: 5,
      });
      setFloors(result.floors);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách tầng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const result = await buildingService.getBuildings({ page: 1, limit: 100 });
        setBuildings(result.buildings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không tải được danh sách tòa nhà');
      }
      await loadFloors(1);
    };
    initialize();
  }, []);

  return (
    <AdminLayout
      eyebrow="Hạ tầng"
      title="Danh mục tầng"
      subtitle="Theo dõi cấu trúc tầng và sức chứa của từng tòa nhà."
      meta={
        <span className="inline-flex items-center gap-2 rounded-2xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-sm font-semibold text-blue-200">
          <Eye className="h-4 w-4" />
          Chỉ xem
        </span>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Tổng số tầng', value: stats.total, icon: Layers3, tone: 'text-blue-300' },
            { label: 'Hoạt động trang này', value: stats.active, icon: CheckCircle2, tone: 'text-emerald-300' },
            { label: 'Tầng ô tô trang này', value: stats.car, icon: Car, tone: 'text-purple-300' },
            { label: 'Tầng xe máy trang này', value: stats.motorcycle, icon: Bike, tone: 'text-amber-300' },
          ].map((item, index) => (
            <motion.article
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.35 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="rounded-[26px] border border-white/10 bg-[#0F172A]/80 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                <item.icon className={cn('h-5 w-5', item.tone)} />
              </div>
              <p className="text-sm font-medium text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{item.value}</p>
            </motion.article>
          ))}
        </section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.4 }}
          className="rounded-[30px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
        >
          <div className="mb-5 flex flex-col gap-3">
            <div>
              <p className="text-sm font-medium text-slate-400">Danh mục tầng</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-white">Danh sách tầng</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
              <select value={buildingId} onChange={(event) => setBuildingId(event.target.value)} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60">
                <option value="">Tất cả tòa nhà</option>
                {buildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}
              </select>
              <select value={vehicleType} onChange={(event) => setVehicleType(event.target.value as VehicleType | '')} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60">
                <option value="">Tất cả phương tiện</option>
                <option value="car">Ô tô</option>
                <option value="motorcycle">Xe máy</option>
              </select>
              <select value={floorType} onChange={(event) => setFloorType(event.target.value as FloorType | '')} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60">
                <option value="">Tất cả loại tầng</option>
                <option value="resident">Cư dân</option>
                <option value="visitor">Khách vãng lai</option>
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60">
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>
              <button onClick={() => loadFloors(1)} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-400/10 px-5 text-sm font-semibold text-blue-200 transition hover:border-blue-300/50 disabled:opacity-50">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Lọc
              </button>
            </div>
          </div>

          {error && <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200">{error}</div>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <th className="pb-3 font-semibold">Tầng</th>
                  <th className="pb-3 font-semibold">Tòa nhà</th>
                  <th className="pb-3 font-semibold">Phương tiện</th>
                  <th className="pb-3 font-semibold">Loại tầng</th>
                  <th className="pb-3 font-semibold">Sức chứa</th>
                  <th className="pb-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">Đang tải tầng...</td></tr>
                ) : floors.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">Không có tầng phù hợp.</td></tr>
                ) : floors.map((floor, index) => (
                  <motion.tr key={floor.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.28 }} className="transition hover:bg-white/[0.03]">
                    <td className="py-4 text-sm font-bold text-white">Tầng {floor.floorNumber}</td>
                    <td className="py-4"><p className="text-sm font-medium text-slate-200">{floor.building.name}</p><p className="mt-1 text-xs text-slate-500">{floor.building.address}</p></td>
                    <td className="py-4 text-sm text-slate-300">{vehicleLabels[floor.vehicleType]}</td>
                    <td className="py-4 text-sm text-slate-300">{floorTypeLabels[floor.floorType]}</td>
                    <td className="py-4 text-sm font-semibold text-white">{floor.totalSlots}</td>
                    <td className="py-4"><span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', floor.isActive ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-red-400/20 bg-red-400/10 text-red-300')}>{floor.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">Đang hiển thị trang <span className="font-semibold text-white">{pagination.page}</span> / <span className="font-semibold text-white">{pagination.totalPages || 1}</span>, 5 tầng mỗi trang</p>
            <div className="flex items-center gap-2">
              <button onClick={() => loadFloors(Math.max(1, pagination.page - 1))} disabled={loading || pagination.page <= 1} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:border-blue-400/40 disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Trước</button>
              <button onClick={() => loadFloors(Math.min(pagination.totalPages || 1, pagination.page + 1))} disabled={loading || pagination.page >= (pagination.totalPages || 1)} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:border-blue-400/40 disabled:opacity-40">Sau<ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </motion.section>
      </div>
    </AdminLayout>
  );
}

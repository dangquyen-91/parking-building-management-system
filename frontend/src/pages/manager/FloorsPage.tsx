import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Bike, Car, CheckCircle2, ChevronLeft, ChevronRight, Edit3, Layers3, Plus, RefreshCw, Search, X } from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { cn } from '../../lib/utils';
import { buildingService, type Building } from '../../services/building.service';
import { floorService, type Floor, type FloorPayload, type FloorType, type VehicleType } from '../../services/floor.service';

const emptyForm: FloorPayload = {
  buildingId: undefined,
  floorNumber: 1,
  vehicleType: 'car',
  floorType: 'visitor',
  totalSlots: 1,
  description: '',
  isActive: true,
};

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
  const [saving, setSaving] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [form, setForm] = useState<FloorPayload>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const stats = useMemo(() => ({
    total: pagination.total,
    active: floors.filter((floor) => floor.isActive).length,
    car: floors.filter((floor) => floor.vehicleType === 'car').length,
    motorcycle: floors.filter((floor) => floor.vehicleType === 'motorcycle').length,
  }), [floors, pagination.total]);

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
        const result = await buildingService.getBuildings({ page: 1, limit: 100, isActive: true });
        setBuildings(result.buildings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không tải được danh sách tòa nhà');
      }
      await loadFloors(1);
    };
    initialize();
  }, []);

  const openCreateModal = () => {
    setEditingFloor(null);
    setForm({ ...emptyForm, buildingId: buildings[0]?.id });
    setModalOpen(true);
  };

  const openEditModal = (floor: Floor) => {
    setEditingFloor(floor);
    setForm({
      buildingId: floor.buildingId,
      floorNumber: floor.floorNumber,
      vehicleType: floor.vehicleType,
      floorType: floor.floorType,
      totalSlots: floor.totalSlots,
      description: floor.description ?? '',
      isActive: floor.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload: FloorPayload = {
      ...form,
      buildingId: Number(form.buildingId),
      floorNumber: Number(form.floorNumber),
      totalSlots: Number(form.totalSlots),
      description: form.description?.trim() || null,
      isActive: Boolean(form.isActive),
    };

    try {
      if (editingFloor) {
        await floorService.updateFloor(editingFloor.id, payload);
        setSuccess(`Đã cập nhật tầng ${payload.floorNumber}`);
      } else {
        if (!payload.buildingId) throw new Error('Vui lòng chọn tòa nhà');
        await floorService.createFloor(payload as FloorPayload & { buildingId: number });
        setSuccess(`Đã tạo tầng ${payload.floorNumber}`);
      }
      setModalOpen(false);
      await loadFloors(editingFloor ? pagination.page : 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu tầng thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      eyebrow="Hạ tầng"
      title="Danh mục tầng"
      subtitle="Tạo mới và cập nhật cấu trúc tầng của từng tòa nhà."
      meta={<button onClick={openCreateModal} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500"><Plus className="h-4 w-4" />Thêm tầng</button>}
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Tổng số tầng', value: stats.total, icon: Layers3, tone: 'text-blue-300' },
            { label: 'Hoạt động trang này', value: stats.active, icon: CheckCircle2, tone: 'text-emerald-300' },
            { label: 'Tầng ô tô trang này', value: stats.car, icon: Car, tone: 'text-purple-300' },
            { label: 'Tầng xe máy trang này', value: stats.motorcycle, icon: Bike, tone: 'text-amber-300' },
          ].map((item, index) => (
            <motion.article key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.35 }} whileHover={{ y: -4, scale: 1.01 }} className="rounded-[26px] border border-white/10 bg-[#0F172A]/80 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]"><item.icon className={cn('h-5 w-5', item.tone)} /></div>
              <p className="text-sm font-medium text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{item.value}</p>
            </motion.article>
          ))}
        </section>

        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.4 }} className="rounded-[30px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="mb-5 flex flex-col gap-3">
            <div><p className="text-sm font-medium text-slate-400">Danh mục tầng</p><h2 className="mt-1 text-xl font-bold tracking-tight text-white">Danh sách tầng</h2></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
              <select value={buildingId} onChange={(event) => setBuildingId(event.target.value)} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60"><option value="">Tất cả tòa nhà</option>{buildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}</select>
              <select value={vehicleType} onChange={(event) => setVehicleType(event.target.value as VehicleType | '')} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60"><option value="">Tất cả phương tiện</option><option value="car">Ô tô</option><option value="motorcycle">Xe máy</option></select>
              <select value={floorType} onChange={(event) => setFloorType(event.target.value as FloorType | '')} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60"><option value="">Tất cả loại tầng</option><option value="resident">Cư dân</option><option value="visitor">Khách vãng lai</option></select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60"><option value="all">Tất cả trạng thái</option><option value="active">Hoạt động</option><option value="inactive">Ngừng hoạt động</option></select>
              <button onClick={() => loadFloors(1)} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-400/10 px-5 text-sm font-semibold text-blue-200 transition hover:border-blue-300/50 disabled:opacity-50">{loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Lọc</button>
            </div>
          </div>

          <AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-4 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200"><AlertTriangle className="h-4 w-4" />{error}</motion.div>}
            {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200"><CheckCircle2 className="h-4 w-4" />{success}</motion.div>}
          </AnimatePresence>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead><tr className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-500"><th className="pb-3 font-semibold">Tầng</th><th className="pb-3 font-semibold">Tòa nhà</th><th className="pb-3 font-semibold">Phương tiện</th><th className="pb-3 font-semibold">Loại tầng</th><th className="pb-3 font-semibold">Sức chứa</th><th className="pb-3 font-semibold">Trạng thái</th><th className="pb-3 text-right font-semibold">Thao tác</th></tr></thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">Đang tải tầng...</td></tr>
                ) : floors.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">Không có tầng phù hợp.</td></tr>
                ) : floors.map((floor, index) => (
                  <motion.tr key={floor.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.28 }} className="transition hover:bg-white/[0.03]">
                    <td className="py-4 text-sm font-bold text-white">Tầng {floor.floorNumber}</td>
                    <td className="py-4"><p className="text-sm font-medium text-slate-200">{floor.building.name}</p><p className="mt-1 text-xs text-slate-500">{floor.building.address}</p></td>
                    <td className="py-4 text-sm text-slate-300">{vehicleLabels[floor.vehicleType]}</td>
                    <td className="py-4 text-sm text-slate-300">{floorTypeLabels[floor.floorType]}</td>
                    <td className="py-4 text-sm font-semibold text-white">{floor.totalSlots}</td>
                    <td className="py-4"><span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', floor.isActive ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-red-400/20 bg-red-400/10 text-red-300')}>{floor.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}</span></td>
                    <td className="py-4 text-right"><button onClick={() => openEditModal(floor)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10 text-blue-200 transition hover:border-blue-300/50 hover:bg-blue-400/20" title="Sửa tầng"><Edit3 className="h-4 w-4" /></button></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">Đang hiển thị trang <span className="font-semibold text-white">{pagination.page}</span> / <span className="font-semibold text-white">{pagination.totalPages || 1}</span>, 5 tầng mỗi trang</p>
            <div className="flex items-center gap-2"><button onClick={() => loadFloors(Math.max(1, pagination.page - 1))} disabled={loading || pagination.page <= 1} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:border-blue-400/40 disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Trước</button><button onClick={() => loadFloors(Math.min(pagination.totalPages || 1, pagination.page + 1))} disabled={loading || pagination.page >= (pagination.totalPages || 1)} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:border-blue-400/40 disabled:opacity-40">Sau<ChevronRight className="h-4 w-4" /></button></div>
          </div>
        </motion.section>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#0F172A] p-6 shadow-2xl shadow-black/50">
              <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-blue-300">{editingFloor ? 'Sửa tầng' : 'Tầng mới'}</p><h2 className="mt-1 text-2xl font-bold text-white">{editingFloor ? 'Cập nhật tầng' : 'Thêm tầng mới'}</h2></div><button onClick={() => setModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white" title="Đóng"><X className="h-4 w-4" /></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Tòa nhà</span><select value={form.buildingId ?? ''} onChange={(event) => setForm((current) => ({ ...current, buildingId: Number(event.target.value) }))} required disabled={Boolean(editingFloor)} className="h-12 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-60"><option value="">Chọn tòa nhà</option>{buildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}</select></label>
                <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Số tầng</span><input type="number" value={form.floorNumber} onChange={(event) => setForm((current) => ({ ...current, floorNumber: Number(event.target.value) }))} required className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-blue-400/60" /></label><label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Sức chứa</span><input type="number" min={1} value={form.totalSlots} onChange={(event) => setForm((current) => ({ ...current, totalSlots: Number(event.target.value) }))} required className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-blue-400/60" /></label></div>
                <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Phương tiện</span><select value={form.vehicleType} onChange={(event) => setForm((current) => ({ ...current, vehicleType: event.target.value as VehicleType }))} className="h-12 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60"><option value="car">Ô tô</option><option value="motorcycle">Xe máy</option></select></label><label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Loại tầng</span><select value={form.floorType} onChange={(event) => setForm((current) => ({ ...current, floorType: event.target.value as FloorType }))} className="h-12 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60"><option value="resident">Cư dân</option><option value="visitor">Khách vãng lai</option></select></label></div>
                <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Mô tả</span><textarea value={form.description ?? ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} maxLength={1000} className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/60" /></label>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"><input checked={Boolean(form.isActive)} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} type="checkbox" className="h-4 w-4 accent-blue-500" /><span className="text-sm font-medium text-slate-300">Tầng đang hoạt động</span></label>
                <button type="submit" disabled={saving} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500 disabled:opacity-50">{saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{editingFloor ? 'Lưu thay đổi' : 'Tạo tầng'}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

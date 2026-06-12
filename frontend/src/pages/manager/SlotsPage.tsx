import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Building2, CheckCircle2, ChevronLeft, ChevronRight, Edit3, Layers3, Plus, RefreshCw, Search, SquareParking, X } from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { cn } from '../../lib/utils';
import { buildingService, type Building } from '../../services/building.service';
import { floorService, type Floor } from '../../services/floor.service';
import { slotService, type ParkingSlot, type SlotPayload, type SlotStatus } from '../../services/slot.service';

const emptyForm: SlotPayload = {
  floorId: undefined,
  slotCode: '',
  vehicleType: 'car',
  status: 'empty',
  note: '',
};

const slotStatusClasses: Record<SlotStatus, string> = {
  empty: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  occupied: 'border-blue-400/20 bg-blue-400/10 text-blue-300',
  reserved: 'border-purple-400/20 bg-purple-400/10 text-purple-300',
  maintenance: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
};

const slotStatusLabels: Record<SlotStatus, string> = {
  empty: 'Trống',
  occupied: 'Đang sử dụng',
  reserved: 'Đã đặt trước',
  maintenance: 'Bảo trì',
};

export default function SlotsPage() {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [status, setStatus] = useState<SlotStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ParkingSlot | null>(null);
  const [form, setForm] = useState<SlotPayload>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const stats = useMemo(() => ({
    total: pagination.total,
    empty: slots.filter((slot) => slot.status === 'empty').length,
    occupied: slots.filter((slot) => slot.status === 'occupied').length,
    attention: slots.filter((slot) => slot.status === 'maintenance').length,
  }), [pagination.total, slots]);

  const loadSlots = async (page = pagination.page) => {
    setLoading(true);
    setError(null);
    try {
      const result = await slotService.getSlots({
        buildingId: buildingId ? Number(buildingId) : undefined,
        floorId: floorId ? Number(floorId) : undefined,
        status: status || undefined,
        page,
        limit: 5,
      });
      setSlots(result.slots);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách vị trí đỗ xe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const [buildingResult, floorResult] = await Promise.all([
          buildingService.getBuildings({ page: 1, limit: 100, isActive: true }),
          floorService.getFloors({ page: 1, limit: 100, vehicleType: 'car', isActive: true }),
        ]);
        setBuildings(buildingResult.buildings);
        setFloors(floorResult.floors);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không tải được bộ lọc vị trí đỗ xe');
      }
      await loadSlots(1);
    };
    initialize();
  }, []);

  const visibleFloors = buildingId ? floors.filter((floor) => floor.buildingId === Number(buildingId)) : floors;
  const formFloors = form.floorId ? floors : visibleFloors;

  const openCreateModal = () => {
    setEditingSlot(null);
    setForm({ ...emptyForm, floorId: visibleFloors[0]?.id });
    setModalOpen(true);
  };

  const openEditModal = (slot: ParkingSlot) => {
    setEditingSlot(slot);
    setForm({
      floorId: slot.floorId,
      slotCode: slot.slotCode,
      vehicleType: 'car',
      status: slot.status,
      note: slot.note ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload: SlotPayload = {
      ...form,
      floorId: Number(form.floorId),
      slotCode: form.slotCode.trim(),
      vehicleType: 'car',
      note: form.note?.trim() || null,
    };

    try {
      if (editingSlot) {
        await slotService.updateSlot(editingSlot.id, payload);
        setSuccess(`Đã cập nhật vị trí ${payload.slotCode}`);
      } else {
        if (!payload.floorId) throw new Error('Vui lòng chọn tầng ô tô');
        await slotService.createSlot(payload as SlotPayload & { floorId: number });
        setSuccess(`Đã tạo vị trí ${payload.slotCode}`);
      }
      setModalOpen(false);
      await loadSlots(editingSlot ? pagination.page : 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu vị trí đỗ xe thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      eyebrow="Công suất bãi đỗ xe"
      title="Danh mục vị trí đỗ xe"
      subtitle="Tạo mới và cập nhật trạng thái các vị trí đỗ ô tô trong hệ thống."
      meta={<button onClick={openCreateModal} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500"><Plus className="h-4 w-4" />Thêm vị trí</button>}
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Tổng vị trí', value: stats.total, icon: SquareParking, tone: 'text-blue-300' },
            { label: 'Vị trí trống trang này', value: stats.empty, icon: CheckCircle2, tone: 'text-emerald-300' },
            { label: 'Đang sử dụng trang này', value: stats.occupied, icon: Building2, tone: 'text-purple-300' },
            { label: 'Bảo trì trang này', value: stats.attention, icon: AlertTriangle, tone: 'text-amber-300' },
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
            <div><p className="text-sm font-medium text-slate-400">Danh mục vị trí đỗ xe</p><h2 className="mt-1 text-xl font-bold tracking-tight text-white">Danh sách vị trí đỗ xe</h2></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_auto]">
              <select value={buildingId} onChange={(event) => { setBuildingId(event.target.value); setFloorId(''); }} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60"><option value="">Tất cả tòa nhà</option>{buildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}</select>
              <select value={floorId} onChange={(event) => setFloorId(event.target.value)} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60"><option value="">Tất cả tầng ô tô</option>{visibleFloors.map((floor) => <option key={floor.id} value={floor.id}>{floor.building.name} - Tầng {floor.floorNumber}</option>)}</select>
              <select value={status} onChange={(event) => setStatus(event.target.value as SlotStatus | '')} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60"><option value="">Tất cả trạng thái</option><option value="empty">Trống</option><option value="occupied">Đang sử dụng</option><option value="reserved">Đã đặt trước</option><option value="maintenance">Bảo trì</option></select>
              <button onClick={() => loadSlots(1)} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-400/10 px-5 text-sm font-semibold text-blue-200 transition hover:border-blue-300/50 disabled:opacity-50">{loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Lọc</button>
            </div>
          </div>

          <AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-4 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200"><AlertTriangle className="h-4 w-4" />{error}</motion.div>}
            {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200"><CheckCircle2 className="h-4 w-4" />{success}</motion.div>}
          </AnimatePresence>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left">
              <thead><tr className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-500"><th className="pb-3 font-semibold">Vị trí</th><th className="pb-3 font-semibold">Tòa nhà</th><th className="pb-3 font-semibold">Tầng</th><th className="pb-3 font-semibold">Phương tiện</th><th className="pb-3 font-semibold">Trạng thái</th><th className="pb-3 font-semibold">Ghi chú</th><th className="pb-3 text-right font-semibold">Thao tác</th></tr></thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">Đang tải vị trí đỗ xe...</td></tr>
                ) : slots.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">Không có vị trí đỗ xe phù hợp.</td></tr>
                ) : slots.map((slot, index) => (
                  <motion.tr key={slot.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.28 }} className="transition hover:bg-white/[0.03]">
                    <td className="py-4 text-sm font-bold text-white">{slot.slotCode}</td>
                    <td className="py-4 text-sm font-medium text-slate-200">{slot.floor.building.name}</td>
                    <td className="py-4 text-sm text-slate-300"><span className="inline-flex items-center gap-2"><Layers3 className="h-4 w-4 text-slate-500" />Tầng {slot.floor.floorNumber}</span></td>
                    <td className="py-4 text-sm text-slate-300">Ô tô</td>
                    <td className="py-4"><span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', slotStatusClasses[slot.status])}>{slotStatusLabels[slot.status]}</span></td>
                    <td className="max-w-xs truncate py-4 text-sm text-slate-400">{slot.note || '--'}</td>
                    <td className="py-4 text-right"><button onClick={() => openEditModal(slot)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10 text-blue-200 transition hover:border-blue-300/50 hover:bg-blue-400/20" title="Sửa vị trí"><Edit3 className="h-4 w-4" /></button></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">Đang hiển thị trang <span className="font-semibold text-white">{pagination.page}</span> / <span className="font-semibold text-white">{pagination.totalPages || 1}</span>, 5 vị trí mỗi trang</p>
            <div className="flex items-center gap-2"><button onClick={() => loadSlots(Math.max(1, pagination.page - 1))} disabled={loading || pagination.page <= 1} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:border-blue-400/40 disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Trước</button><button onClick={() => loadSlots(Math.min(pagination.totalPages || 1, pagination.page + 1))} disabled={loading || pagination.page >= (pagination.totalPages || 1)} className="inline-flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:border-blue-400/40 disabled:opacity-40">Sau<ChevronRight className="h-4 w-4" /></button></div>
          </div>
        </motion.section>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#0F172A] p-6 shadow-2xl shadow-black/50">
              <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-blue-300">{editingSlot ? 'Sửa vị trí' : 'Vị trí mới'}</p><h2 className="mt-1 text-2xl font-bold text-white">{editingSlot ? 'Cập nhật vị trí' : 'Thêm vị trí mới'}</h2></div><button onClick={() => setModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white" title="Đóng"><X className="h-4 w-4" /></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Tầng ô tô</span><select value={form.floorId ?? ''} onChange={(event) => setForm((current) => ({ ...current, floorId: Number(event.target.value) }))} required disabled={Boolean(editingSlot)} className="h-12 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60 disabled:opacity-60"><option value="">Chọn tầng ô tô</option>{formFloors.map((floor) => <option key={floor.id} value={floor.id}>{floor.building.name} - Tầng {floor.floorNumber}</option>)}</select></label>
                <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Mã vị trí</span><input value={form.slotCode} onChange={(event) => setForm((current) => ({ ...current, slotCode: event.target.value }))} required maxLength={20} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-blue-400/60" /></label><label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Trạng thái</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as SlotStatus }))} className="h-12 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60"><option value="empty">Trống</option><option value="occupied">Đang sử dụng</option><option value="reserved">Đã đặt trước</option><option value="maintenance">Bảo trì</option></select></label></div>
                <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Ghi chú</span><textarea value={form.note ?? ''} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} rows={3} maxLength={1000} className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/60" /></label>
                <button type="submit" disabled={saving} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500 disabled:opacity-50">{saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{editingSlot ? 'Lưu thay đổi' : 'Tạo vị trí'}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

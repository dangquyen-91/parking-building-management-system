import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Bike, ChevronLeft, ChevronRight, Edit3, Plus, RefreshCw, Search, X } from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { buildingService, type Building } from '../../services/building.service';
import { floorService, type Floor } from '../../services/floor.service';
import {
  parkingRowService,
  type ParkingRow,
  type ParkingRowPayload,
  type ParkingRowStatus,
} from '../../services/parking-row.service';

const statusLabels: Record<ParkingRowStatus, string> = {
  available: 'Còn chỗ',
  full: 'Đã đầy',
  maintenance: 'Bảo trì',
};

const emptyForm: ParkingRowPayload = { floorId: undefined, rowCode: '', capacity: 1, note: '' };

export default function ParkingRowsPage() {
  const [rows, setRows] = useState<ParkingRow[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [status, setStatus] = useState<ParkingRowStatus | ''>('');
  const [editing, setEditing] = useState<ParkingRow | null>(null);
  const [form, setForm] = useState<ParkingRowPayload>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const visibleFloors = useMemo(
    () => floors.filter((floor) => !buildingId || floor.buildingId === Number(buildingId)),
    [buildingId, floors],
  );

  const loadRows = async (page = pagination.page, reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await parkingRowService.getRows({
        page,
        limit: 10,
        buildingId: reset || !buildingId ? undefined : Number(buildingId),
        floorId: reset || !floorId ? undefined : Number(floorId),
        status: reset ? undefined : status || undefined,
      });
      setRows(result.rows);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách dãy xe máy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      buildingService.getBuildings({ page: 1, limit: 100, isActive: true }),
      floorService.getFloors({ page: 1, limit: 100, vehicleType: 'motorcycle', isActive: true }),
      parkingRowService.getRows({ page: 1, limit: 10 }),
    ]).then(([buildingResult, floorResult, rowResult]) => {
      setBuildings(buildingResult.buildings);
      setFloors(floorResult.floors);
      setRows(rowResult.rows);
      setPagination(rowResult.pagination);
    }).catch((err) => setError(err instanceof Error ? err.message : 'Không tải được dữ liệu'))
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, floorId: visibleFloors[0]?.id ?? floors[0]?.id });
    setModalOpen(true);
  };

  const openEdit = (row: ParkingRow) => {
    setEditing(row);
    setForm({ floorId: row.floorId, rowCode: row.rowCode, capacity: row.capacity, note: row.note ?? '' });
    setModalOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        rowCode: form.rowCode.trim(),
        capacity: Number(form.capacity),
        note: form.note?.trim() || null,
      };
      if (editing) await parkingRowService.updateRow(editing.id, payload);
      else {
        if (!form.floorId) throw new Error('Vui lòng chọn tầng xe máy');
        await parkingRowService.createRow({ ...payload, floorId: Number(form.floorId) });
      }
      setSuccess(editing ? 'Đã cập nhật dãy xe máy' : 'Đã tạo dãy xe máy');
      setModalOpen(false);
      await loadRows(editing ? pagination.page : 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được dãy xe máy');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (row: ParkingRow, nextStatus: ParkingRowStatus) => {
    setError(null);
    try {
      await parkingRowService.updateStatus(row.id, nextStatus, row.note);
      setSuccess(`Đã chuyển dãy ${row.rowCode} sang ${statusLabels[nextStatus]}`);
      await loadRows(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được trạng thái');
    }
  };

  return (
    <AdminLayout
      eyebrow="Hạ tầng xe máy"
      title="Quản lý dãy xe máy"
      subtitle="Tạo, cập nhật sức chứa và trạng thái các dãy trên tầng xe máy."
      meta={<button onClick={openCreate} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Thêm dãy</button>}
    >
      <div className="space-y-5">
        {(error || success) && <div className={`rounded-2xl border px-4 py-3 text-sm ${error ? 'border-red-400/20 bg-red-400/10 text-red-200' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'}`}>{error ?? success}</div>}

        <section className="rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-5">
          <div className="grid gap-3 md:grid-cols-4">
            <select value={buildingId} onChange={(e) => { setBuildingId(e.target.value); setFloorId(''); }} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white">
              <option value="">Tất cả tòa nhà</option>
              {buildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}
            </select>
            <select value={floorId} onChange={(e) => setFloorId(e.target.value)} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white">
              <option value="">Tất cả tầng xe máy</option>
              {visibleFloors.map((floor) => <option key={floor.id} value={floor.id}>{floor.building.name} - Tầng {floor.floorNumber}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value as ParkingRowStatus | '')} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white">
              <option value="">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button onClick={() => loadRows(1)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-400/10 text-sm font-semibold text-blue-200"><Search className="h-4 w-4" />Lọc</button>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="text-xs uppercase tracking-wider text-slate-500"><tr><th className="pb-3">Dãy</th><th className="pb-3">Tòa nhà / tầng</th><th className="pb-3">Đang dùng</th><th className="pb-3">Sức chứa</th><th className="pb-3">Trạng thái</th><th className="pb-3 text-right">Thao tác</th></tr></thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? <tr><td colSpan={6} className="py-12 text-center text-slate-400">Đang tải...</td></tr> : rows.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-slate-400">Chưa có dãy xe máy.</td></tr> : rows.map((row) => (
                  <tr key={row.id} className="text-sm text-slate-300">
                    <td className="py-4 font-bold text-white"><span className="inline-flex items-center gap-2"><Bike className="h-4 w-4 text-blue-300" />{row.rowCode}</span></td>
                    <td className="py-4">{row.floor.building.name} · Tầng {row.floor.floorNumber}</td>
                    <td className="py-4">{row.occupiedCount}</td><td className="py-4">{row.capacity}</td>
                    <td className="py-4"><select value={row.status} onChange={(e) => changeStatus(row, e.target.value as ParkingRowStatus)} className="h-9 rounded-xl border border-white/10 bg-[#111827] px-3 text-white">{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
                    <td className="py-4 text-right"><button onClick={() => openEdit(row)} className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-2 text-blue-200" title="Sửa"><Edit3 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5 text-sm text-slate-400">
            <span>Trang {pagination.page}/{pagination.totalPages || 1} · {pagination.total} dãy</span>
            <div className="flex gap-2">
              <button onClick={() => loadRows(pagination.page - 1)} disabled={loading || pagination.page <= 1} className="rounded-xl border border-white/10 p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => loadRows(pagination.page + 1)} disabled={loading || pagination.page >= pagination.totalPages} className="rounded-xl border border-white/10 p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </section>
      </div>

      {modalOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
        <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0F172A] p-6">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-white">{editing ? 'Cập nhật dãy' : 'Thêm dãy xe máy'}</h2><button onClick={() => setModalOpen(false)} className="text-slate-400"><X className="h-5 w-5" /></button></div>
          <form onSubmit={submit} className="space-y-4">
            <select value={form.floorId ?? ''} disabled={Boolean(editing)} required onChange={(e) => setForm((current) => ({ ...current, floorId: Number(e.target.value) }))} className="h-12 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 text-white disabled:opacity-50"><option value="">Chọn tầng xe máy</option>{floors.map((floor) => <option key={floor.id} value={floor.id}>{floor.building.name} - Tầng {floor.floorNumber}</option>)}</select>
            <input value={form.rowCode} required maxLength={20} onChange={(e) => setForm((current) => ({ ...current, rowCode: e.target.value }))} placeholder="Mã dãy, ví dụ A" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white" />
            <input type="number" min={1} max={500} value={form.capacity} required onChange={(e) => setForm((current) => ({ ...current, capacity: Number(e.target.value) }))} placeholder="Sức chứa" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white" />
            <textarea value={form.note ?? ''} maxLength={1000} rows={3} onChange={(e) => setForm((current) => ({ ...current, note: e.target.value }))} placeholder="Ghi chú" className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white" />
            <button disabled={saving} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 font-semibold text-white disabled:opacity-50">{saving && <RefreshCw className="h-4 w-4 animate-spin" />}{editing ? 'Lưu thay đổi' : 'Tạo dãy'}</button>
          </form>
        </div>
      </div>}
    </AdminLayout>
  );
}

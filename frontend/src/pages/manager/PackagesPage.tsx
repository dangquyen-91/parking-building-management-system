import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Bike, Boxes, Car, CheckCircle2, Edit3, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { cn } from '../../lib/utils';
import { packageService, type PackagePayload, type PackageVehicleType, type ParkingPackage } from '../../services/package.service';

const emptyForm: PackagePayload = {
  name: '',
  vehicleType: 'car',
  durationDays: 30,
  price: 0,
  description: '',
  isActive: true,
};

const formatCurrency = (price: string | number) => `${Number(price).toLocaleString('vi-VN')} VND`;

const vehicleLabels: Record<PackageVehicleType, string> = {
  car: 'Ô tô',
  motorcycle: 'Xe máy',
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<ParkingPackage[]>([]);
  const [vehicleType, setVehicleType] = useState<PackageVehicleType | ''>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingPackage, setEditingPackage] = useState<ParkingPackage | null>(null);
  const [form, setForm] = useState<PackagePayload>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const stats = useMemo(() => ({
    total: packages.length,
    active: packages.filter((pkg) => pkg.isActive).length,
    car: packages.filter((pkg) => pkg.vehicleType === 'car').length,
    motorcycle: packages.filter((pkg) => pkg.vehicleType === 'motorcycle').length,
  }), [packages]);

  const loadPackages = async (
    filters: { vehicleType?: PackageVehicleType | ''; statusFilter?: 'all' | 'active' | 'inactive' } = {},
  ) => {
    setLoading(true);
    setError(null);
    const nextVehicleType = filters.vehicleType ?? vehicleType;
    const nextStatusFilter = filters.statusFilter ?? statusFilter;

    try {
      const result = await packageService.getPackages({
        vehicleType: nextVehicleType || undefined,
        isActive: nextStatusFilter === 'all' ? undefined : nextStatusFilter === 'active',
      });
      setPackages(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách gói gửi xe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const openCreateModal = () => {
    setEditingPackage(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (pkg: ParkingPackage) => {
    setEditingPackage(pkg);
    setForm({
      name: pkg.name,
      vehicleType: pkg.vehicleType,
      durationDays: pkg.durationDays,
      price: Number(pkg.price),
      description: pkg.description ?? '',
      isActive: pkg.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload: PackagePayload = {
      ...form,
      name: form.name.trim(),
      durationDays: Number(form.durationDays),
      price: Number(form.price),
      description: form.description?.trim() || null,
      isActive: Boolean(form.isActive),
    };

    try {
      if (editingPackage) {
        await packageService.updatePackage(editingPackage.id, payload);
        setSuccess(`Đã cập nhật gói ${payload.name}`);
      } else {
        await packageService.createPackage(payload);
        setSuccess(`Đã tạo gói ${payload.name}`);
      }
      setModalOpen(false);
      setVehicleType('');
      setStatusFilter('all');
      await loadPackages({ vehicleType: '', statusFilter: 'all' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu gói gửi xe thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pkg: ParkingPackage) => {
    if (!window.confirm(`Ngừng hoạt động gói "${pkg.name}"?`)) return;

    setDeletingId(pkg.id);
    setError(null);
    setSuccess(null);
    try {
      await packageService.deletePackage(pkg.id);
      setSuccess(`Đã ngừng hoạt động gói ${pkg.name}`);
      await loadPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xóa gói gửi xe thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout
      eyebrow="Dịch vụ cư dân"
      title="Gói gửi xe"
      subtitle="Tạo, cập nhật và quản lý các gói gửi xe trong hệ thống."
      meta={
        <button onClick={openCreateModal} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.24)] transition hover:from-blue-500 hover:to-purple-500">
          <Plus className="h-4 w-4" />
          Thêm gói
        </button>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Tổng gói gửi xe', value: stats.total, icon: Boxes, tone: 'text-blue-300' },
            { label: 'Gói đang hoạt động', value: stats.active, icon: CheckCircle2, tone: 'text-emerald-300' },
            { label: 'Gói ô tô', value: stats.car, icon: Car, tone: 'text-purple-300' },
            { label: 'Gói xe máy', value: stats.motorcycle, icon: Bike, tone: 'text-amber-300' },
          ].map((item, index) => (
            <motion.article key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.35 }} whileHover={{ y: -4, scale: 1.01 }} className="rounded-[26px] border border-white/10 bg-[#0F172A]/80 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]"><item.icon className={cn('h-5 w-5', item.tone)} /></div>
              <p className="text-sm font-medium text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{item.value}</p>
            </motion.article>
          ))}
        </section>

        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.4 }} className="rounded-[30px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-sm font-medium text-slate-400">Danh mục gói gửi xe</p><h2 className="mt-1 text-xl font-bold tracking-tight text-white">Danh sách gói gửi xe</h2></div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select value={vehicleType} onChange={(event) => setVehicleType(event.target.value as PackageVehicleType | '')} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60">
                <option value="">Tất cả phương tiện</option>
                <option value="car">Ô tô</option>
                <option value="motorcycle">Xe máy</option>
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60">
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>
              <button onClick={() => loadPackages()} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-400/10 px-5 text-sm font-semibold text-blue-200 transition hover:border-blue-300/50 disabled:opacity-50">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Lọc
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-4 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200"><AlertTriangle className="h-4 w-4" />{error}</motion.div>}
            {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200"><CheckCircle2 className="h-4 w-4" />{success}</motion.div>}
          </AnimatePresence>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead><tr className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-500"><th className="pb-3 font-semibold">Gói gửi xe</th><th className="pb-3 font-semibold">Phương tiện</th><th className="pb-3 font-semibold">Thời hạn</th><th className="pb-3 font-semibold">Giá</th><th className="pb-3 font-semibold">Mô tả</th><th className="pb-3 font-semibold">Trạng thái</th><th className="pb-3 text-right font-semibold">Thao tác</th></tr></thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">Đang tải gói gửi xe...</td></tr>
                ) : packages.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">Không có gói gửi xe phù hợp.</td></tr>
                ) : packages.map((pkg, index) => (
                  <motion.tr key={pkg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.28 }} className="transition hover:bg-white/[0.03]">
                    <td className="py-4"><p className="text-sm font-bold text-white">{pkg.name}</p><p className="mt-1 text-xs text-slate-500">ID #{pkg.id}</p></td>
                    <td className="py-4 text-sm text-slate-300">{vehicleLabels[pkg.vehicleType]}</td>
                    <td className="py-4 text-sm font-semibold text-white">{pkg.durationDays} ngày</td>
                    <td className="py-4 text-sm font-semibold text-blue-200">{formatCurrency(pkg.price)}</td>
                    <td className="max-w-xs truncate py-4 text-sm text-slate-400">{pkg.description || '--'}</td>
                    <td className="py-4"><span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', pkg.isActive ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-red-400/20 bg-red-400/10 text-red-300')}>{pkg.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}</span></td>
                    <td className="py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => openEditModal(pkg)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10 text-blue-200 transition hover:border-blue-300/50 hover:bg-blue-400/20" title="Sửa gói"><Edit3 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(pkg)} disabled={deletingId === pkg.id} className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-200 transition hover:border-red-300/50 hover:bg-red-400/20 disabled:opacity-50" title="Ngừng hoạt động">{deletingId === pkg.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#0F172A] p-6 shadow-2xl shadow-black/50">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div><p className="text-sm font-medium text-blue-300">{editingPackage ? 'Sửa gói gửi xe' : 'Gói gửi xe mới'}</p><h2 className="mt-1 text-2xl font-bold text-white">{editingPackage ? 'Cập nhật gói' : 'Thêm gói mới'}</h2></div>
                <button onClick={() => setModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white" title="Đóng"><X className="h-4 w-4" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Tên gói</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required minLength={2} maxLength={100} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60" /></label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Phương tiện</span><select value={form.vehicleType} onChange={(event) => setForm((current) => ({ ...current, vehicleType: event.target.value as PackageVehicleType }))} className="h-12 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white outline-none focus:border-blue-400/60"><option value="car">Ô tô</option><option value="motorcycle">Xe máy</option></select></label>
                  <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Thời hạn ngày</span><input type="number" min={1} max={3650} value={form.durationDays} onChange={(event) => setForm((current) => ({ ...current, durationDays: Number(event.target.value) }))} required className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-blue-400/60" /></label>
                </div>
                <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Giá</span><input type="number" min={0} max={1000000000} value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))} required className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-blue-400/60" /></label>
                <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Mô tả</span><textarea value={form.description ?? ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} maxLength={255} className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-blue-400/60" /></label>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"><input checked={Boolean(form.isActive)} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} type="checkbox" className="h-4 w-4 accent-blue-500" /><span className="text-sm font-medium text-slate-300">Gói đang hoạt động</span></label>
                <button type="submit" disabled={saving} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500 disabled:opacity-50">{saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{editingPackage ? 'Lưu thay đổi' : 'Tạo gói'}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

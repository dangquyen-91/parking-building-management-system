import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Boxes,
  Car,
  Check,
  CheckCircle2,
  Edit3,
  Motorbike,
  Plus,
  Power,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { cn } from '../../lib/utils';
import {
  packageService,
  type PackagePayload,
  type PackageVehicleType,
  type ParkingPackage,
} from '../../services/package.service';

type StatusFilter = 'all' | 'active' | 'inactive';

const emptyForm: PackagePayload = {
  name: '',
  vehicleType: 'car',
  durationDays: 30,
  price: 0,
  description: '',
  isActive: true,
};

const vehicleLabels: Record<PackageVehicleType, string> = {
  car: 'Ô tô',
  motorcycle: 'Xe máy',
};

const formatCurrency = (value: string | number) =>
  Number(value).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

function packageFeatures(pkg: ParkingPackage) {
  if (pkg.vehicleType === 'car') {
    return ['Giữ ô cư dân', 'Check-in cư dân', 'Checkout phí 0'];
  }
  return ['Gửi theo dãy cư dân', 'Check-in cư dân', 'Checkout phí 0'];
}

function getSavings(pkg: ParkingPackage, packages: ParkingPackage[]) {
  const monthly = packages.find(
    (item) => item.vehicleType === pkg.vehicleType && item.durationDays <= 31 && item.id !== pkg.id,
  );
  if (!monthly || pkg.durationDays <= monthly.durationDays) return 0;
  const cycles = Math.round(pkg.durationDays / monthly.durationDays);
  return Math.max(0, Number(monthly.price) * cycles - Number(pkg.price));
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<ParkingPackage[]>([]);
  const [vehicleType, setVehicleType] = useState<PackageVehicleType | ''>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
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

  const sortedPackages = useMemo(
    () => [...packages].sort((a, b) => {
      if (a.vehicleType !== b.vehicleType) return a.vehicleType.localeCompare(b.vehicleType);
      return a.durationDays - b.durationDays || Number(a.price) - Number(b.price);
    }),
    [packages],
  );

  const loadPackages = async (
    filters: { vehicleType?: PackageVehicleType | ''; statusFilter?: StatusFilter } = {},
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
    let active = true;
    packageService.getPackages()
      .then((result) => { if (active) setPackages(result); })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Không tải được danh sách gói gửi xe');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const openCreateModal = () => {
    setEditingPackage(null);
    setForm({ ...emptyForm });
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

  const handleDeactivate = async (pkg: ParkingPackage) => {
    if (!window.confirm(`Ngừng hoạt động gói "${pkg.name}"?`)) return;
    setDeletingId(pkg.id);
    setError(null);
    setSuccess(null);
    try {
      await packageService.deletePackage(pkg.id);
      setSuccess(`Đã ngừng hoạt động gói ${pkg.name}`);
      await loadPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể ngừng hoạt động gói');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout
      eyebrow="Dịch vụ cư dân"
      title="Gói gửi xe"
      subtitle="Quản lý các gói hiển thị cho người dùng trên trang mua gói."
      meta={
        <button onClick={openCreateModal} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.24)] transition hover:from-blue-500 hover:to-purple-500">
          <Plus className="h-4 w-4" />Thêm gói
        </button>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Tổng gói hiển thị', value: stats.total, icon: Boxes, tone: 'text-blue-300' },
            { label: 'Đang hoạt động', value: stats.active, icon: CheckCircle2, tone: 'text-emerald-300' },
            { label: 'Gói ô tô', value: stats.car, icon: Car, tone: 'text-purple-300' },
            { label: 'Gói xe máy', value: stats.motorcycle, icon: Motorbike, tone: 'text-amber-300' },
          ].map((item, index) => (
            <motion.article key={item.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-[26px] border border-white/10 bg-[#0F172A]/80 p-5 shadow-2xl shadow-black/20">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]"><item.icon className={cn('h-5 w-5', item.tone)} /></div>
              <p className="text-sm font-medium text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{item.value}</p>
            </motion.article>
          ))}
        </section>

        <section className="rounded-[30px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div><p className="text-sm font-medium text-slate-400">Xem trước giao diện người dùng</p><h2 className="mt-1 text-xl font-bold text-white">Các thẻ gói thành viên</h2></div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select value={vehicleType} onChange={(event) => setVehicleType(event.target.value as PackageVehicleType | '')} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white">
                <option value="">Tất cả phương tiện</option><option value="car">Ô tô</option><option value="motorcycle">Xe máy</option>
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white">
                <option value="all">Tất cả trạng thái</option><option value="active">Hoạt động</option><option value="inactive">Ngừng hoạt động</option>
              </select>
              <button onClick={() => loadPackages()} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-400/10 px-5 text-sm font-semibold text-blue-200 disabled:opacity-50">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Lọc
              </button>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-5 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"><AlertTriangle className="h-4 w-4" />{error}</motion.div>}
            {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4" />{success}</motion.div>}
          </AnimatePresence>

          {loading ? (
            <div className="grid min-h-72 place-items-center text-sm text-slate-400"><RefreshCw className="mb-3 h-7 w-7 animate-spin text-blue-300" />Đang tải các gói...</div>
          ) : sortedPackages.length === 0 ? (
            <div className="grid min-h-72 place-items-center rounded-[24px] border border-dashed border-white/10 text-sm text-slate-400">Không có gói phù hợp.</div>
          ) : (
            <div className="grid items-stretch gap-5 md:grid-cols-2 2xl:grid-cols-4">
              {sortedPackages.map((pkg, index) => {
                const Icon = pkg.vehicleType === 'car' ? Car : Motorbike;
                const savings = getSavings(pkg, packages);
                const longTerm = pkg.durationDays > 31;
                return (
                  <motion.article
                    layout
                    key={pkg.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={cn(
                      'group relative flex min-h-[440px] flex-col overflow-hidden rounded-[24px] border bg-white p-5 text-slate-950 shadow-[0_16px_34px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:shadow-[0_22px_46px_rgba(37,99,235,0.20)]',
                      longTerm ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200',
                      !pkg.isActive && 'opacity-65 grayscale-[0.25]',
                    )}
                  >
                    <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-300 transition', pkg.isActive ? 'opacity-100' : 'opacity-30')} />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{vehicleLabels[pkg.vehicleType]}</span>
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{pkg.durationDays} ngày</span>
                          <span className={cn('rounded-full px-3 py-1 text-xs font-bold', pkg.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>{pkg.isActive ? 'Đang bán' : 'Đã ẩn'}</span>
                        </div>
                        <h3 className="mt-4 text-xl font-black tracking-tight">{pkg.name}</h3>
                      </div>
                      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition group-hover:scale-110', pkg.vehicleType === 'car' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600')}><Icon className="h-5 w-5" /></div>
                    </div>

                    <p className="mt-4 min-h-[48px] text-sm font-light leading-6 text-slate-600">{pkg.description || `Gói gửi xe cư dân dành cho ${vehicleLabels[pkg.vehicleType].toLowerCase()}.`}</p>

                    <div className="mt-5">
                      <div className="flex flex-wrap items-end gap-2"><span className="text-3xl font-black tracking-tight">{formatCurrency(pkg.price)}</span><span className="mb-1.5 text-sm text-slate-500">/{pkg.durationDays} ngày</span></div>
                      <p className="mt-1 text-xs font-medium text-slate-400">≈ {formatCurrency(Math.round(Number(pkg.price) / pkg.durationDays))}/ngày</p>
                      {savings > 0 && <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Tiết kiệm {formatCurrency(savings)}</span>}
                    </div>

                    <div className="mt-5 flex-1 space-y-2.5">
                      {packageFeatures(pkg).map((feature) => <div key={feature} className="flex items-center gap-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600"><Check className="h-3.5 w-3.5 stroke-[3]" /></span><span className="text-sm text-slate-600">{feature}</span></div>)}
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-2">
                      <button onClick={() => openEditModal(pkg)} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 text-sm font-bold text-blue-700 transition hover:border-blue-400"><Edit3 className="h-4 w-4" />Sửa</button>
                      {pkg.isActive ? <button onClick={() => handleDeactivate(pkg)} disabled={deletingId === pkg.id} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 text-sm font-bold text-red-600 transition hover:border-red-400 disabled:opacity-50">{deletingId === pkg.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}Ngừng</button> : <button onClick={() => openEditModal(pkg)} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Bật lại</button>}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#0F172A] p-6 shadow-2xl shadow-black/50">
              <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-blue-300">{editingPackage ? 'Sửa gói gửi xe' : 'Gói gửi xe mới'}</p><h2 className="mt-1 text-2xl font-bold text-white">{editingPackage ? 'Cập nhật gói' : 'Thêm gói mới'}</h2></div><button type="button" onClick={() => setModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300"><X className="h-4 w-4" /></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Tên gói</span><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required minLength={2} maxLength={100} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none focus:border-blue-400/60" /></label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Phương tiện</span><select value={form.vehicleType} onChange={(event) => setForm((current) => ({ ...current, vehicleType: event.target.value as PackageVehicleType }))} className="h-12 w-full rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white"><option value="car">Ô tô</option><option value="motorcycle">Xe máy</option></select></label>
                  <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Thời hạn (ngày)</span><input type="number" min={1} max={3650} value={form.durationDays} onChange={(event) => setForm((current) => ({ ...current, durationDays: Number(event.target.value) }))} required className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white" /></label>
                </div>
                <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Giá (VND)</span><input type="number" min={0} max={1000000000} value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))} required className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white" /></label>
                <label className="block"><span className="mb-2 block text-sm font-medium text-slate-300">Mô tả trên thẻ gói</span><textarea value={form.description ?? ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} maxLength={255} className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white" /></label>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"><input checked={Boolean(form.isActive)} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} type="checkbox" className="h-4 w-4 accent-blue-500" /><span className="text-sm font-medium text-slate-300">Hiển thị gói cho người dùng</span></label>
                <button type="submit" disabled={saving} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 text-sm font-semibold text-white disabled:opacity-50">{saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{editingPackage ? 'Lưu thay đổi' : 'Tạo gói'}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

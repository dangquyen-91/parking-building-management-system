import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bike, Boxes, Car, CheckCircle2, Eye, RefreshCw, Search } from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { cn } from '../../lib/utils';
import { packageService, type PackageVehicleType, type ParkingPackage } from '../../services/package.service';

const formatCurrency = (price: string) => `${Number(price).toLocaleString('vi-VN')} VND`;

const vehicleLabels: Record<PackageVehicleType, string> = {
  car: 'Ô tô',
  motorcycle: 'Xe máy',
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<ParkingPackage[]>([]);
  const [vehicleType, setVehicleType] = useState<PackageVehicleType | ''>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => ({
    total: packages.length,
    active: packages.filter((pkg) => pkg.isActive).length,
    car: packages.filter((pkg) => pkg.vehicleType === 'car').length,
    motorcycle: packages.filter((pkg) => pkg.vehicleType === 'motorcycle').length,
  }), [packages]);

  const loadPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await packageService.getPackages({
        vehicleType: vehicleType || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
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

  return (
    <AdminLayout
      eyebrow="Dịch vụ cư dân"
      title="Gói gửi xe"
      subtitle="Theo dõi các gói gửi xe đang được cấu hình trong hệ thống."
      meta={<span className="inline-flex items-center gap-2 rounded-2xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-sm font-semibold text-blue-200"><Eye className="h-4 w-4" />Chỉ xem</span>}
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
              <button onClick={loadPackages} disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-400/10 px-5 text-sm font-semibold text-blue-200 transition hover:border-blue-300/50 disabled:opacity-50">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Lọc
              </button>
            </div>
          </div>

          {error && <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200">{error}</div>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead><tr className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-500"><th className="pb-3 font-semibold">Gói gửi xe</th><th className="pb-3 font-semibold">Phương tiện</th><th className="pb-3 font-semibold">Thời hạn</th><th className="pb-3 font-semibold">Giá</th><th className="pb-3 font-semibold">Mô tả</th><th className="pb-3 font-semibold">Trạng thái</th></tr></thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">Đang tải gói gửi xe...</td></tr>
                ) : packages.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">Không có gói gửi xe phù hợp.</td></tr>
                ) : packages.map((pkg, index) => (
                  <motion.tr key={pkg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.28 }} className="transition hover:bg-white/[0.03]">
                    <td className="py-4"><p className="text-sm font-bold text-white">{pkg.name}</p><p className="mt-1 text-xs text-slate-500">ID #{pkg.id}</p></td>
                    <td className="py-4 text-sm text-slate-300">{vehicleLabels[pkg.vehicleType]}</td>
                    <td className="py-4 text-sm font-semibold text-white">{pkg.durationDays} ngày</td>
                    <td className="py-4 text-sm font-semibold text-blue-200">{formatCurrency(pkg.price)}</td>
                    <td className="max-w-xs truncate py-4 text-sm text-slate-400">{pkg.description || '--'}</td>
                    <td className="py-4"><span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', pkg.isActive ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-red-400/20 bg-red-400/10 text-red-300')}>{pkg.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </AdminLayout>
  );
}

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleParking,
  Edit3,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { cn } from '../../lib/utils';
import { buildingService, type Building, type BuildingPayload } from '../../services/building.service';

const emptyForm: BuildingPayload = {
  name: '',
  address: '',
  description: '',
  isActive: true,
};

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [form, setForm] = useState<BuildingPayload>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const stats = useMemo(() => {
    return {
      total: pagination.total,
      active: buildings.filter((building) => building.isActive).length,
      inactive: buildings.filter((building) => !building.isActive).length,
    };
  }, [buildings, pagination.total]);

  const loadBuildings = async (page = pagination.page) => {
    setLoading(true);
    setError(null);
    try {
      const result = await buildingService.getBuildings({
        search: search.trim() || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        page,
        limit: 5,
      });
      setBuildings(result.buildings);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách tòa nhà');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuildings(1);
  }, []);

  const openCreateModal = () => {
    setEditingBuilding(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (building: Building) => {
    setEditingBuilding(building);
    setForm({
      name: building.name,
      address: building.address,
      description: building.description ?? '',
      isActive: building.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        description: form.description?.trim() || null,
        isActive: form.isActive,
      };

      if (editingBuilding) {
        await buildingService.updateBuilding(editingBuilding.id, payload);
        setSuccess(`Đã cập nhật tòa nhà ${payload.name}`);
      } else {
        await buildingService.createBuilding(payload);
        setSuccess(`Đã tạo tòa nhà ${payload.name}`);
      }

      setModalOpen(false);
      await loadBuildings(editingBuilding ? pagination.page : 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu tòa nhà thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      eyebrow="Hạ tầng"
      title="Quản lý tòa nhà"
      subtitle="Quản lý danh sách tòa nhà trong hệ thống Smart Parking."
      meta={
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.24)] transition hover:from-blue-500 hover:to-purple-500"
        >
          <Plus className="h-4 w-4" />
          Thêm tòa nhà
        </button>
      }
    >
      <motion.div className="space-y-6" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
        <motion.section
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          className="grid gap-4 md:grid-cols-3"
        >
          {[
            { label: 'Tổng tòa nhà', value: stats.total, icon: Building2, tone: 'text-blue-300' },
            { label: 'Hoạt động trang này', value: stats.active, icon: CheckCircle2, tone: 'text-emerald-300' },
            { label: 'Ngừng hoạt động trang này', value: stats.inactive, icon: CircleParking, tone: 'text-amber-300' },
          ].map((item, index) => (
            <motion.article
              key={item.label}
              variants={{ hidden: { opacity: 0, y: 18, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1 } }}
              transition={{ delay: index * 0.03, duration: 0.35 }}
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
        </motion.section>

        <motion.section
          variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
          className="rounded-[30px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
        >
          <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Danh mục tòa nhà</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-white">Danh sách tòa nhà</h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') loadBuildings(1);
                  }}
                  placeholder="Tìm theo tên hoặc địa chỉ"
                  className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60 sm:w-72"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm font-medium text-white outline-none transition focus:border-blue-400/60"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>

              <button
                onClick={() => loadBuildings(1)}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-400/10 px-5 text-sm font-semibold text-blue-200 transition hover:border-blue-300/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Tìm kiếm
              </button>
            </div>
          </div>

          <AnimatePresence mode="popLayout">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-4 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200"
              >
                <AlertTriangle className="h-4 w-4" />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200"
              >
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <th className="pb-3 font-semibold">Tòa nhà</th>
                  <th className="pb-3 font-semibold">Địa chỉ</th>
                  <th className="pb-3 font-semibold">Mô tả</th>
                  <th className="pb-3 font-semibold">Trạng thái</th>
                  <th className="pb-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                      Đang tải tòa nhà...
                    </td>
                  </tr>
                ) : buildings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                      Không có tòa nhà phù hợp.
                    </td>
                  </tr>
                ) : (
                  buildings.map((building, index) => (
                    <motion.tr
                      key={building.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.28 }}
                      className="transition hover:bg-white/[0.03]"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/70 to-purple-500/70">
                            <Building2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{building.name}</p>
                            <p className="text-xs text-slate-500">ID #{building.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-slate-300">{building.address}</td>
                      <td className="max-w-xs truncate py-4 text-sm text-slate-400">{building.description || '--'}</td>
                      <td className="py-4">
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                            building.isActive
                              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                              : 'border-red-400/20 bg-red-400/10 text-red-300',
                          )}
                        >
                          {building.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(building)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10 text-blue-200 transition hover:border-blue-300/50 hover:bg-blue-400/20"
                            title="Sửa tòa nhà"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">
              Đang hiển thị trang <span className="font-semibold text-white">{pagination.page}</span> /{' '}
              <span className="font-semibold text-white">{pagination.totalPages || 1}</span>, 5 tòa nhà mỗi trang
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadBuildings(Math.max(1, pagination.page - 1))}
                disabled={loading || pagination.page <= 1}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:border-blue-400/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </button>
              <button
                onClick={() => loadBuildings(Math.min(pagination.totalPages || 1, pagination.page + 1))}
                disabled={loading || pagination.page >= (pagination.totalPages || 1)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:border-blue-400/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.section>
      </motion.div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              className="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#0F172A] p-6 shadow-2xl shadow-black/50"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-300">{editingBuilding ? 'Sửa tòa nhà' : 'Tòa nhà mới'}</p>
                  <h2 className="mt-1 text-2xl font-bold text-white">{editingBuilding ? 'Cập nhật tòa nhà' : 'Thêm tòa nhà mới'}</h2>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                  title="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Tên tòa nhà</span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="Tòa nhà Smart Parking"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Địa chỉ</span>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      value={form.address}
                      onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                      required
                      minLength={5}
                      maxLength={255}
                      placeholder="123 Nguyễn Huệ, Quận 1"
                      className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Mô tả</span>
                  <textarea
                    value={form.description ?? ''}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    maxLength={1000}
                    rows={4}
                    placeholder="Mô tả tòa nhà"
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60"
                  />
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <input
                    checked={form.isActive}
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                    type="checkbox"
                    className="h-4 w-4 accent-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-300">Tòa nhà đang hoạt động</span>
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.24)] transition hover:from-blue-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {editingBuilding ? 'Lưu thay đổi' : 'Tạo tòa nhà'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

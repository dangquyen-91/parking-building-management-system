import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserCog,
  UsersRound,
} from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { cn } from '../../lib/utils';
import { userService } from '../../services/user.service';
import type { UserProfile } from '../../services/auth.service';

const formatDate = (value: string) => new Date(value).toLocaleDateString('vi-VN');

export default function StaffPage() {
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      total: pagination.total,
      active: staff.filter((item) => item.isActive).length,
      inactive: staff.filter((item) => !item.isActive).length,
      pageTotal: staff.length,
    }),
    [pagination.total, staff],
  );

  const loadStaff = async (nextPage = pagination.page) => {
    setLoading(true);
    setError(null);

    try {
      const result = await userService.getUsers({
        search: search.trim() || undefined,
        role: 'staff',
        page: nextPage,
        limit: 5,
      });
      setStaff(result.users);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff(1);
  }, []);

  return (
    <AdminLayout
      eyebrow="Nhân sự vận hành"
      title="Quản lý nhân viên"
      subtitle="Theo dõi danh sách nhân viên vận hành bãi đỗ và trạng thái tài khoản trong hệ thống."
      meta={
        <button
          onClick={() => loadStaff(pagination.page)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-400/10 px-4 py-3 text-sm font-semibold text-blue-200 transition hover:border-blue-300/50 hover:bg-blue-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Làm mới
        </button>
      }
    >
      <motion.div className="space-y-6" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
        <motion.section variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Tổng nhân viên', value: stats.total, icon: UsersRound, tone: 'text-blue-300' },
            { label: 'Hiển thị trang này', value: stats.pageTotal, icon: UserCog, tone: 'text-purple-300' },
            { label: 'Đang hoạt động', value: stats.active, icon: CheckCircle2, tone: 'text-emerald-300' },
            { label: 'Ngừng hoạt động', value: stats.inactive, icon: AlertTriangle, tone: 'text-amber-300' },
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
              <p className="text-sm font-medium text-slate-400">Danh sách nhân viên</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-white">Nhân viên vận hành</h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') loadStaff(1);
                  }}
                  placeholder="Tìm theo tên hoặc email"
                  className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60 sm:w-72"
                />
              </div>

              <button
                onClick={() => loadStaff(1)}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.24)] transition hover:from-blue-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                Tìm kiếm
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <th className="pb-3 font-semibold">Nhân viên</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Số điện thoại</th>
                  <th className="pb-3 font-semibold">Ngày tạo</th>
                  <th className="pb-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                      Đang tải nhân viên...
                    </td>
                  </tr>
                ) : staff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                      Không có nhân viên phù hợp.
                    </td>
                  </tr>
                ) : (
                  staff.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.28 }}
                      className="transition hover:bg-white/[0.03]"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/70 to-purple-500/70 text-sm font-bold text-white">
                            {item.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{item.fullName}</p>
                            <p className="text-xs text-slate-500">ID #{item.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-slate-300">
                        <span className="inline-flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-500" />
                          {item.email}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-slate-300">
                        <span className="inline-flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-500" />
                          {item.phone || '--'}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-slate-300">{formatDate(item.createdAt)}</td>
                      <td className="py-4">
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                            item.isActive
                              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                              : 'border-red-400/20 bg-red-400/10 text-red-300',
                          )}
                        >
                          {item.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </span>
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
              <span className="font-semibold text-white">{pagination.totalPages || 1}</span>, 5 nhân viên mỗi trang
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadStaff(Math.max(1, pagination.page - 1))}
                disabled={loading || pagination.page <= 1}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:border-blue-400/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </button>
              <button
                onClick={() => loadStaff(Math.min(pagination.totalPages || 1, pagination.page + 1))}
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
    </AdminLayout>
  );
}

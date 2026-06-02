import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UserCog,
  UsersRound,
} from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { userService, type AssignableRole, type UserRole } from '../../services/user.service';
import type { UserProfile } from '../../services/auth.service';

const assignableRoles: AssignableRole[] = ['user', 'manager', 'staff'];
const filterRoles: UserRole[] = ['admin', 'manager', 'staff', 'user'];

const isAssignableRole = (role: UserRole): role is AssignableRole => role === 'user' || role === 'manager' || role === 'staff';

const roleClasses: Record<UserRole, string> = {
  admin: 'border-purple-400/30 bg-purple-400/10 text-purple-200',
  manager: 'border-blue-400/30 bg-blue-400/10 text-blue-200',
  staff: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  user: 'border-slate-400/30 bg-slate-400/10 text-slate-200',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<number, UserRole>>({});
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [pagination, setPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const stats = useMemo(() => {
    return {
      total: pagination.total,
      admins: users.filter((item) => item.role === 'admin').length,
      staff: users.filter((item) => item.role === 'staff').length,
      active: users.filter((item) => item.isActive).length,
    };
  }, [pagination.total, users]);

  const loadUsers = async (nextPage = pagination.page) => {
    setLoading(true);
    setError(null);
    try {
      const result = await userService.getUsers({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        page: nextPage,
        limit: 5,
      });
      setUsers(result.users);
      setPagination(result.pagination);
      setSelectedRoles(Object.fromEntries(result.users.map((item) => [item.id, item.role])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong tai duoc danh sach users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
  }, []);

  const handleUpdateRole = async (targetUser: UserProfile) => {
    const nextRole = selectedRoles[targetUser.id];
    if (!nextRole || nextRole === targetUser.role) return;
    if (!isAssignableRole(nextRole)) {
      setError('Admin chi duoc gan role user, staff hoac manager');
      return;
    }

    setSavingId(targetUser.id);
    setError(null);
    setSuccess(null);

    try {
      const updated = await userService.updateRole(targetUser.id, nextRole);
      setUsers((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedRoles((items) => ({ ...items, [updated.id]: updated.role }));
      setSuccess(`Da cap nhat role cua ${updated.fullName} thanh ${updated.role}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cap nhat role that bai');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout
      eyebrow="Access Control"
      title="User Role Management"
      subtitle=""
      meta={
        <button
          onClick={() => loadUsers(pagination.page)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-400/10 px-4 py-3 text-sm font-semibold text-blue-200 transition hover:border-blue-300/50 hover:bg-blue-400/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </button>
      }
    >
      <motion.div className="space-y-6" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
        <motion.section
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {[
            { label: 'Total Users', value: stats.total, icon: UsersRound, tone: 'text-blue-300' },
            { label: 'Admins This Page', value: stats.admins, icon: ShieldCheck, tone: 'text-purple-300' },
            { label: 'Staff This Page', value: stats.staff, icon: UserCog, tone: 'text-emerald-300' },
            { label: 'Active This Page', value: stats.active, icon: CheckCircle2, tone: 'text-cyan-300' },
          ].map((item, index) => (
            <motion.article
              key={item.label}
              variants={{ hidden: { opacity: 0, y: 18, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1 } }}
              transition={{ delay: index * 0.03, duration: 0.35 }}
              whileHover={{ y: -4, scale: 1.015 }}
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
              <p className="text-sm font-medium text-slate-400">Admin Function</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-white">Cap nhat staff va manager</h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') loadUsers(1);
                  }}
                  placeholder="Search name or email"
                  className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60 sm:w-72"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as UserRole | '')}
                className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm font-medium text-white outline-none transition focus:border-blue-400/60"
              >
                <option value="">All roles</option>
                {filterRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <button
                onClick={() => loadUsers(1)}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.24)] transition hover:from-blue-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                Search
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
            <table className="w-full min-w-[920px] text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Current Role</th>
                  <th className="pb-3 font-semibold">New Role</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                      Khong co user phu hop.
                    </td>
                  </tr>
                ) : (
                  users.map((item, index) => {
                    const selectedRole = selectedRoles[item.id] ?? item.role;
                    const selectedValue = isAssignableRole(selectedRole) ? selectedRole : '';
                    const isAdminAccount = item.role === 'admin';
                    const changed = selectedValue !== '' && selectedValue !== item.role;
                    const locked = currentUser?.id === item.id || isAdminAccount;

                    return (
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
                        <td className="py-4 text-sm text-slate-300">{item.email}</td>
                        <td className="py-4">
                          <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize', roleClasses[item.role])}>
                            {item.role}
                          </span>
                        </td>
                        <td className="py-4">
                          <select
                            value={selectedValue}
                            onChange={(event) =>
                              setSelectedRoles((roles) => ({ ...roles, [item.id]: event.target.value as UserRole }))
                            }
                            disabled={savingId === item.id || locked}
                            className="h-10 rounded-2xl border border-white/10 bg-[#111827] px-3 text-sm font-medium text-white outline-none transition focus:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <option value="">{isAdminAccount ? 'Admin locked' : 'Choose role'}</option>
                            {assignableRoles.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-4">
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                              item.isActive
                                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                                : 'border-red-400/20 bg-red-400/10 text-red-300',
                            )}
                          >
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleUpdateRole(item)}
                            disabled={!changed || savingId === item.id || locked}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-400/10 px-4 text-sm font-semibold text-blue-200 transition hover:border-blue-300/50 hover:bg-blue-400/15 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {savingId === item.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Save
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-400">
              Showing page <span className="font-semibold text-white">{pagination.page}</span> of{' '}
              <span className="font-semibold text-white">{pagination.totalPages || 1}</span>, 5 users per page
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadUsers(Math.max(1, pagination.page - 1))}
                disabled={loading || pagination.page <= 1}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:border-blue-400/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <button
                onClick={() => loadUsers(Math.min(pagination.totalPages || 1, pagination.page + 1))}
                disabled={loading || pagination.page >= (pagination.totalPages || 1)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:border-blue-400/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </AdminLayout>
  );
}

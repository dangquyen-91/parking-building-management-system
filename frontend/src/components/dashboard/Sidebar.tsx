import { motion } from 'framer-motion';
import {
  BarChart3,
  Boxes,
  Building2,
  CalendarCheck,
  Car,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Layers3,
  MapPinned,
  ScrollText,
  Settings,
  ShieldCheck,
  SquareParking,
  UsersRound,
  Zap,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

type DashboardRole = 'admin' | 'manager';

const menuItems = [
  { label: 'Tổng quan', icon: LayoutDashboard, path: 'dashboard', roles: ['admin', 'manager'] },
  { label: 'Tòa nhà', icon: Building2, path: 'buildings', roles: ['admin', 'manager'] },
  { label: 'Tầng', icon: Layers3, path: 'floors', roles: ['admin', 'manager'] },
  { label: 'Khu vực', icon: MapPinned, path: 'zones', roles: [] },
  { label: 'Vị trí đỗ xe', icon: SquareParking, path: 'slots', roles: ['admin', 'manager'] },
  { label: 'Phương tiện', icon: Car, path: 'vehicles', roles: [] },
  { label: 'Đặt chỗ', icon: CalendarCheck, path: 'bookings', roles: [] },
  { label: 'Phiên gửi xe', icon: Clock3, path: 'parking-sessions', roles: [] },
  { label: 'Thanh toán', icon: CreditCard, path: 'payments', roles: ['admin', 'manager'] },
  { label: 'Gói gửi xe', icon: Boxes, path: 'packages', roles: ['admin', 'manager'] },
  { label: 'Người dùng', icon: UsersRound, path: 'users', roles: ['admin', 'manager'] },
  { label: 'Nhân viên', icon: ShieldCheck, path: 'staff', roles: ['manager'] },
  { label: 'Báo cáo', icon: BarChart3, path: 'reports', roles: [] },
  { label: 'Cài đặt', icon: Settings, path: 'settings', roles: [] },
  { label: 'Nhật ký hệ thống', icon: ScrollText, path: 'system-logs', roles: [] },
] satisfies Array<{
  label: string;
  icon: typeof LayoutDashboard;
  path: string;
  roles: DashboardRole[];
}>;

export function Sidebar() {
  const { user } = useAuth();
  const dashboardRole: DashboardRole = user?.role === 'manager' ? 'manager' : 'admin';
  const basePath = dashboardRole === 'manager' ? '/manager' : '/admin';
  const roleLabel = dashboardRole === 'manager' ? 'Quản lý bãi đỗ' : 'Quản trị hệ thống';
  const visibleMenuItems = menuItems.filter((item) => item.roles.includes(dashboardRole));

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] border-r border-white/10 bg-[#070B14]/85 backdrop-blur-2xl lg:block">
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-500/70 to-transparent" />
      <div className="flex h-full flex-col px-5 py-6">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/25 to-purple-500/25 text-blue-200 shadow-[0_0_35px_rgba(59,130,246,0.35)]">
            <SquareParking className="h-6 w-6" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#070B14] bg-blue-500 text-white shadow-[0_0_14px_rgba(59,130,246,0.75)]">
              <Zap className="h-3 w-3" />
            </span>
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-white">Smart Parking</p>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">{roleLabel}</p>
          </div>
        </div>

        <nav className="space-y-1 overflow-y-auto pr-1">
          {visibleMenuItems.map((item) => (
            <NavLink key={item.label} to={`${basePath}/${item.path}`}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 4, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-400 transition-colors',
                    'hover:bg-white/[0.06] hover:text-white',
                    isActive &&
                      'border border-blue-400/30 bg-gradient-to-r from-blue-500/20 to-purple-500/10 text-white shadow-[0_0_28px_rgba(59,130,246,0.18)]',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="admin-sidebar-active"
                      className="absolute left-0 h-7 w-1 rounded-r-full bg-gradient-to-b from-blue-400 to-purple-400"
                    />
                  )}
                  <item.icon className={cn('h-4.5 w-4.5', isActive ? 'text-blue-300' : 'text-slate-500 group-hover:text-blue-300')} />
                  <span>{item.label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}

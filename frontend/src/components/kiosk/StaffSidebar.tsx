import { motion } from 'framer-motion';
import {
  Car,
  Clock3,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPinned,
  Zap,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

const menuItems = [
  { label: 'Tổng quan', icon: LayoutDashboard, to: '/staff/dashboard', shortcut: null },
  { label: 'Check-in', icon: LogIn, to: '/staff/check-in', shortcut: 'F1' },
  { label: 'Check-out', icon: LogOut, to: '/staff/check-out', shortcut: 'F2' },
  { label: 'Phiên đang gửi', icon: Clock3, to: '/staff/sessions', shortcut: 'F3' },
  { label: 'Sơ đồ bãi xe', icon: MapPinned, to: '/staff/map', shortcut: 'F4' },
];

export function StaffSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] border-r border-white/10 bg-[#070B14]/85 backdrop-blur-2xl lg:block">
      {/* Edge gradient rule */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-500/70 to-transparent" />

      <div className="flex h-full flex-col px-5 py-6">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/25 to-purple-500/25 text-blue-200 shadow-[0_0_35px_rgba(59,130,246,0.35)]">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-white">Smart Parking</p>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
              Kiosk nhân viên
            </p>
          </div>
        </div>

        {/* Shortcut hint */}
        <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
          Điều hướng
        </p>

        <nav className="space-y-1 overflow-y-auto pr-1">
          {menuItems.map((item) => (
            <NavLink key={item.label} to={item.to}>
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
                      layoutId="staff-sidebar-active"
                      className="absolute left-0 h-7 w-1 rounded-r-full bg-gradient-to-b from-blue-400 to-purple-400"
                    />
                  )}
                  <item.icon
                    className={cn(
                      'h-4 w-4',
                      isActive ? 'text-blue-300' : 'text-slate-500 group-hover:text-blue-300',
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <span className="rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-mono text-slate-500 group-hover:border-blue-400/20 group-hover:text-blue-400">
                      {item.shortcut}
                    </span>
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer: car slots indicator */}
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <Car className="h-4 w-4 text-slate-500" />
            <div>
              <p className="text-xs font-semibold text-slate-400">Cổng nhân viên</p>
              <p className="mt-0.5 text-[11px] text-slate-600">
                F1-F4 để chuyển nhanh
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

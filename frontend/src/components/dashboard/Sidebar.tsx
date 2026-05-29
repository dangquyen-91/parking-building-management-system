import { motion } from 'framer-motion';
import {
  BarChart3,
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
import { cn } from '../../lib/utils';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Buildings', icon: Building2, to: '/admin/buildings' },
  { label: 'Floors', icon: Layers3, to: '/admin/floors' },
  { label: 'Zones', icon: MapPinned, to: '/admin/zones' },
  { label: 'Slots', icon: SquareParking, to: '/admin/slots' },
  { label: 'Vehicles', icon: Car, to: '/admin/vehicles' },
  { label: 'Bookings', icon: CalendarCheck, to: '/admin/bookings' },
  { label: 'Parking Sessions', icon: Clock3, to: '/admin/parking-sessions' },
  { label: 'Payments', icon: CreditCard, to: '/admin/payments' },
  { label: 'Users', icon: UsersRound, to: '/admin/users' },
  { label: 'Staff', icon: ShieldCheck, to: '/admin/staff' },
  { label: 'Reports', icon: BarChart3, to: '/admin/reports' },
  { label: 'Settings', icon: Settings, to: '/admin/settings' },
  { label: 'System Logs', icon: ScrollText, to: '/admin/system-logs' },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] border-r border-white/10 bg-[#070B14]/85 backdrop-blur-2xl lg:block">
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-blue-500/70 to-transparent" />
      <div className="flex h-full flex-col px-5 py-6">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/30 bg-gradient-to-br from-blue-500/25 to-purple-500/25 text-blue-200 shadow-[0_0_35px_rgba(59,130,246,0.35)]">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-white">Smart Parking</p>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-500">Admin Console</p>
          </div>
        </div>

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

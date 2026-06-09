import { Bell, LogOut, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { StaffSidebar } from './StaffSidebar';

interface KioskLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  headerRight?: React.ReactNode;
}

export function KioskLayout({
  children,
  title,
  subtitle,
  eyebrow,
  headerRight,
}: KioskLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.fullName
    ? user.fullName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
    : 'ST';

  return (
    <div className="min-h-screen bg-[#070B14] text-white">
      {/* Background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-[14%] top-[-18%] h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[8%] top-[16%] h-[380px] w-[380px] rounded-full bg-purple-500/18 blur-[120px]" />
        <div className="absolute bottom-[-12%] left-[44%] h-[320px] w-[320px] rounded-full bg-cyan-500/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.055),transparent_32%)]" />
      </div>

      <StaffSidebar />

      <div className="relative lg:pl-[280px]">
        {/* Sticky top header */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070B14]/75 backdrop-blur-2xl">
          <div className="flex min-h-20 items-center gap-4 px-4 sm:px-6 xl:px-8">
            <div className="flex-1">
              {eyebrow && (
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-400">
                  {eyebrow}
                </p>
              )}
              <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
              {subtitle && (
                <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
              )}
            </div>

            {headerRight && <div className="flex items-center">{headerRight}</div>}

            {/* Khối Actions đã được sửa lỗi căn chỉnh */}
            <div className="ml-auto flex items-center gap-3">

              {/* Nút Bell */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="relative hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-0 text-slate-300 transition hover:border-blue-400/40 hover:text-white sm:flex"
              >
                <Bell className="h-5 w-5" />
              </motion.button>

              {/* User chip */}
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] pl-2 pr-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white shadow-[0_0_22px_rgba(139,92,246,0.38)]">
                  {user?.fullName ? initials : <UserRound className="h-4 w-4" />}
                </div>
                <div className="hidden flex-col justify-center md:flex">
                  <p className="text-sm font-semibold leading-none text-white">
                    {user?.fullName ?? 'Staff'}
                  </p>
                  <p className="mt-1.5 text-xs capitalize leading-none text-slate-500">
                    {user?.role ?? 'staff'}
                  </p>
                </div>
              </div>

              {/* Nút LogOut */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLogout}
                title="Đăng xuất"
                className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-0 text-slate-300 transition hover:border-red-400/40 hover:text-red-400 sm:flex"
              >
                <LogOut className="h-5 w-5" />
              </motion.button>

            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 xl:px-8">{children}</main>
      </div>
    </div>
  );
}
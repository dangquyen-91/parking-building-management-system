import { Bell, Menu, Moon, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070B14]/75 backdrop-blur-2xl">
      <div className="flex min-h-20 items-center gap-4 px-4 sm:px-6 xl:px-8">
        <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 lg:hidden">
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative max-w-2xl flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
          <input
            aria-label="Tìm kiếm trên bảng điều khiển"
            placeholder="Tìm tòa nhà, phiên gửi xe, đặt chỗ..."
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(59,130,246,0.10)]"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="relative hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-blue-400/40 hover:text-white sm:flex"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#EF4444] shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-purple-400/40 hover:text-white sm:flex"
          >
            <Moon className="h-5 w-5" />
          </motion.button>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] py-1.5 pl-2 pr-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white shadow-[0_0_22px_rgba(139,92,246,0.38)]">
              SA
            </div>
            <div className="hidden leading-tight md:block">
              <p className="text-sm font-semibold text-white">Quản trị viên hệ thống</p>
              <p className="text-xs text-slate-500">Quản trị hệ thống</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

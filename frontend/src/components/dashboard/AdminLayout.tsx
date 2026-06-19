import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface AdminLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  meta?: ReactNode;
  children: ReactNode;
}

export function AdminLayout({ eyebrow, title, subtitle, meta, children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-[#070B14] text-white">
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute left-[14%] top-[-18%] h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[8%] top-[16%] h-[380px] w-[380px] rounded-full bg-purple-500/18 blur-[120px]" />
        <div className="absolute bottom-[-12%] left-[44%] h-[320px] w-[320px] rounded-full bg-cyan-500/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.055),transparent_32%)]" />
      </div>

      <Sidebar />

      <div className="relative lg:pl-[280px]">
        <Header />
        <main className="px-4 py-6 sm:px-6 xl:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-300">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{subtitle}</p>
            </div>
            {meta}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, delay: 0.08 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

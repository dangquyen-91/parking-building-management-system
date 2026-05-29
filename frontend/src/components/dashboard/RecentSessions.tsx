import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import type { ParkingSession, ParkingSessionStatus } from '../../types/dashboard';

interface RecentSessionsProps {
  sessions: ParkingSession[];
}

const statusClasses: Record<ParkingSessionStatus, string> = {
  Parking: 'border-blue-400/20 bg-blue-400/10 text-blue-300',
  Completed: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  Overdue: 'border-red-400/20 bg-red-400/10 text-red-300',
};

export function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="rounded-[30px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
    >
      <div className="mb-5">
        <p className="text-sm font-medium text-slate-400">Recent Parking Sessions</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-white">Phien gui xe gan day</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-500">
              <th className="pb-3 font-semibold">Bien so</th>
              <th className="pb-3 font-semibold">Ten khach</th>
              <th className="pb-3 font-semibold">Check In</th>
              <th className="pb-3 font-semibold">Check Out</th>
              <th className="pb-3 font-semibold">Phi</th>
              <th className="pb-3 text-right font-semibold">Trang thai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {sessions.map((session) => (
              <tr key={session.id} className="group transition hover:bg-white/[0.03]">
                <td className="py-4 text-sm font-bold text-white">{session.plateNumber}</td>
                <td className="py-4 text-sm text-slate-300">{session.customerName}</td>
                <td className="py-4 text-sm text-slate-400">{session.checkIn}</td>
                <td className="py-4 text-sm text-slate-400">{session.checkOut}</td>
                <td className="py-4 text-sm font-semibold text-slate-200">{session.fee}</td>
                <td className="py-4 text-right">
                  <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', statusClasses[session.status])}>
                    {session.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}

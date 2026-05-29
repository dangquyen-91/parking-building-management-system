import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import type { Booking, BookingStatus } from '../../types/dashboard';

interface RecentBookingsProps {
  bookings: Booking[];
}

const statusClasses: Record<BookingStatus, string> = {
  Confirmed: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  Pending: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  Cancelled: 'border-red-400/20 bg-red-400/10 text-red-300',
};

export function RecentBookings({ bookings }: RecentBookingsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-[30px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl"
    >
      <div className="mb-5">
        <p className="text-sm font-medium text-slate-400">Recent Bookings</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-white">Dat cho gan day</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-500">
              <th className="pb-3 font-semibold">Booking Code</th>
              <th className="pb-3 font-semibold">Bien so</th>
              <th className="pb-3 font-semibold">Ngay</th>
              <th className="pb-3 font-semibold">Gio</th>
              <th className="pb-3 text-right font-semibold">Trang thai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {bookings.map((booking) => (
              <tr key={booking.id} className="group transition hover:bg-white/[0.03]">
                <td className="py-4 text-sm font-bold text-white">{booking.code}</td>
                <td className="py-4 text-sm text-slate-300">{booking.plateNumber}</td>
                <td className="py-4 text-sm text-slate-400">{booking.date}</td>
                <td className="py-4 text-sm text-slate-400">{booking.time}</td>
                <td className="py-4 text-right">
                  <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', statusClasses[booking.status])}>
                    {booking.status}
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

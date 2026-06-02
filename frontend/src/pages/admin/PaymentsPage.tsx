import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Banknote, CreditCard, Eye, Hash, Search } from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { cn } from '../../lib/utils';
import { paymentService, type Payment, type PaymentStatus } from '../../services/payment.service';

const statusClasses: Record<PaymentStatus, string> = {
  pending: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  failed: 'border-red-400/20 bg-red-400/10 text-red-300',
  cancelled: 'border-slate-400/20 bg-slate-400/10 text-slate-300',
};

const formatCurrency = (amount: string) => `${Number(amount).toLocaleString('vi-VN')} VND`;
const formatDate = (value: string | null) => value ? new Date(value).toLocaleString('vi-VN') : '--';

export default function PaymentsPage() {
  const [orderId, setOrderId] = useState('');
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setPayment(null);
    try {
      setPayment(await paymentService.getByOrderId(orderId.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong tim thay payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      eyebrow="Financial Lookup"
      title="Payments"
      subtitle="Tra cuu chi tiet giao dich theo order ID."
      meta={<span className="inline-flex items-center gap-2 rounded-2xl border border-blue-400/20 bg-blue-400/10 px-4 py-3 text-sm font-semibold text-blue-200"><Eye className="h-4 w-4" />View only</span>}
    >
      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-white/10 bg-[#0F172A]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="mb-5"><p className="text-sm font-medium text-slate-400">Payment Lookup</p><h2 className="mt-1 text-xl font-bold tracking-tight text-white">Tim giao dich</h2></div>
        <form onSubmit={handleLookup} className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <Hash className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={orderId} onChange={(event) => setOrderId(event.target.value)} required placeholder="Enter payment order ID" className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60" />
          </label>
          <button type="submit" disabled={loading} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500 disabled:opacity-50"><Search className={cn('h-4 w-4', loading && 'animate-pulse')} />Lookup</button>
        </form>

        {error && <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200">{error}</div>}

        {payment && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              { label: 'Order ID', value: payment.orderId, icon: Hash },
              { label: 'Amount', value: formatCurrency(payment.amount), icon: Banknote },
              { label: 'Provider', value: payment.provider.toUpperCase(), icon: CreditCard },
              { label: 'Transaction No.', value: payment.vnpTransactionNo || '--', icon: Hash },
              { label: 'Bank Code', value: payment.vnpBankCode || '--', icon: CreditCard },
              { label: 'Paid At', value: formatDate(payment.paidAt), icon: Banknote },
            ].map((item) => (
              <article key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2 text-slate-500"><item.icon className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-[0.16em]">{item.label}</span></div>
                <p className="break-words text-sm font-semibold text-white">{item.value}</p>
              </article>
            ))}
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</p>
              <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize', statusClasses[payment.status])}>{payment.status}</span>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Order Info</p>
              <p className="text-sm font-semibold text-white">{payment.orderInfo || '--'}</p>
            </article>
          </motion.div>
        )}
      </motion.section>
    </AdminLayout>
  );
}

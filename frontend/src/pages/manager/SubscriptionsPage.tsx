import { useEffect, useMemo, useState } from 'react';
import { Bike, Car, Clock3, RefreshCw, Search, ShieldCheck, TimerOff } from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import {
  subscriptionService,
  type ResidentSubscription,
  type SubscriptionStatus,
} from '../../services/subscription.service';

const statusLabels: Record<SubscriptionStatus, string> = {
  pending: 'Chờ thanh toán',
  active: 'Đang hoạt động',
  expired: 'Hết hạn',
  cancelled: 'Đã hủy',
};

const statusClasses: Record<SubscriptionStatus, string> = {
  pending: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  active: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  expired: 'border-red-400/20 bg-red-400/10 text-red-200',
  cancelled: 'border-slate-400/20 bg-slate-400/10 text-slate-300',
};

const formatDate = (value: string | null) => value ? new Date(value).toLocaleString('vi-VN') : '--';
const formatMoney = (value: string) => `${Number(value).toLocaleString('vi-VN')} VND`;

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<ResidentSubscription[]>([]);
  const [licensePlate, setLicensePlate] = useState('');
  const [status, setStatus] = useState<SubscriptionStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [expiring, setExpiring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const stats = useMemo(() => ({
    total: subscriptions.length,
    active: subscriptions.filter((item) => item.status === 'active').length,
    pending: subscriptions.filter((item) => item.status === 'pending').length,
    expired: subscriptions.filter((item) => item.status === 'expired').length,
  }), [subscriptions]);

  const loadSubscriptions = async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await subscriptionService.getAll({
        status: reset ? undefined : status || undefined,
        licensePlate: reset ? undefined : licensePlate.trim() || undefined,
      });
      setSubscriptions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách người dùng gói');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    subscriptionService.getAll()
      .then((result) => { if (active) setSubscriptions(result); })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Không tải được danh sách người dùng gói');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const expire = async () => {
    setExpiring(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await subscriptionService.expireSubscriptions();
      setSuccess(`Đã hủy ${result.pendingCancelled} giao dịch chờ, hết hạn ${result.activeExpired} người dùng gói và giải phóng ${result.orphanSlotsFreed} vị trí.`);
      await loadSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể quét người dùng gói hết hạn');
    } finally {
      setExpiring(false);
    }
  };

  return (
    <AdminLayout
      eyebrow="Dịch vụ cư dân"
      title="Quản lý người dùng gói"
      subtitle="Theo dõi gói gửi xe theo biển số và xử lý người dùng gói đã hết hạn."
      meta={<button onClick={expire} disabled={expiring} className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-200 disabled:opacity-50"><TimerOff className="h-4 w-4" />{expiring ? 'Đang quét...' : 'Quét hết hạn'}</button>}
    >
      <div className="space-y-5">
        {(error || success) && <div className={`rounded-2xl border px-4 py-3 text-sm ${error ? 'border-red-400/20 bg-red-400/10 text-red-200' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'}`}>{error ?? success}</div>}

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Tổng kết quả', value: stats.total, icon: ShieldCheck },
            { label: 'Đang hoạt động', value: stats.active, icon: RefreshCw },
            { label: 'Chờ thanh toán', value: stats.pending, icon: Clock3 },
            { label: 'Đã hết hạn', value: stats.expired, icon: TimerOff },
          ].map((item) => <article key={item.label} className="rounded-[24px] border border-white/10 bg-[#0F172A]/80 p-5"><item.icon className="mb-4 h-5 w-5 text-blue-300" /><p className="text-sm text-slate-400">{item.label}</p><p className="mt-2 text-3xl font-bold text-white">{item.value}</p></article>)}
        </section>

        <section className="rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_240px_auto_auto]">
            <input value={licensePlate} onChange={(e) => setLicensePlate(e.target.value.toUpperCase())} placeholder="Biển số xe chính xác" className="h-11 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold tracking-wider text-white" />
            <select value={status} onChange={(e) => setStatus(e.target.value as SubscriptionStatus | '')} className="h-11 rounded-2xl border border-white/10 bg-[#111827] px-4 text-sm text-white"><option value="">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <button onClick={() => loadSubscriptions()} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-400/25 bg-blue-400/10 px-5 text-sm font-semibold text-blue-200"><Search className="h-4 w-4" />Lọc</button>
            <button onClick={() => { setLicensePlate(''); setStatus(''); loadSubscriptions(true); }} className="rounded-2xl border border-white/10 px-5 text-sm font-semibold text-slate-300">Đặt lại</button>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0F172A]/80 p-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="text-xs uppercase tracking-wider text-slate-500"><tr><th className="pb-3">Biển số</th><th className="pb-3">Khách hàng</th><th className="pb-3">Gói</th><th className="pb-3">Vị trí</th><th className="pb-3">Thời hạn</th><th className="pb-3">Số tiền</th><th className="pb-3">Trạng thái</th></tr></thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? <tr><td colSpan={7} className="py-12 text-center text-slate-400">Đang tải...</td></tr> : subscriptions.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-slate-400">Không có người dùng gói phù hợp.</td></tr> : subscriptions.map((item) => {
                  const VehicleIcon = item.vehicleType === 'car' ? Car : Bike;
                  return <tr key={item.id} className="text-sm text-slate-300">
                    <td className="py-4"><span className="inline-flex items-center gap-2 font-bold tracking-wider text-white"><VehicleIcon className="h-4 w-4 text-blue-300" />{item.licensePlate}</span><p className="mt-1 text-xs text-slate-500">#{item.id}</p></td>
                    <td className="py-4"><p className="font-semibold text-white">{item.user?.fullName ?? `User #${item.userId}`}</p><p className="text-xs text-slate-500">{item.user?.email ?? '--'}</p></td>
                    <td className="py-4">{item.package?.name ?? `#${item.packageId}`}</td>
                    <td className="py-4">{item.vehicleType === 'car' ? item.slot?.slotCode ?? '--' : 'Dãy xe máy'}</td>
                    <td className="py-4"><p>{formatDate(item.startDate)}</p><p className="mt-1 text-xs text-slate-500">đến {formatDate(item.endDate)}</p></td>
                    <td className="py-4 font-semibold text-white">{formatMoney(item.amount)}</td>
                    <td className="py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[item.status]}`}>{statusLabels[item.status]}</span></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

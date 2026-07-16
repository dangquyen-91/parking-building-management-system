import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Car,
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  Motorbike,
  RefreshCw,
  Search,
} from 'lucide-react';
import { AdminLayout } from '../../components/dashboard/AdminLayout';
import { cn } from '../../lib/utils';
import { getSessions, type SessionListParams } from '../../services/kiosk.service';
import type { ActiveSessionApiItem, SessionStatus, VehicleType } from '../../types/kiosk';

type StatusFilter = SessionStatus | 'all';
type CustomerType = 'resident' | 'visitor' | 'booking';

const statusTabs: Array<{ value: StatusFilter; label: string }> = [
  { value: 'active', label: 'Đang trong bãi' },
  { value: 'completed', label: 'Đã checkout' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'all', label: 'Tất cả' },
];

const statusMeta: Record<SessionStatus, { label: string; className: string }> = {
  active: { label: 'Đang gửi', className: 'border-blue-400/20 bg-blue-400/10 text-blue-200' },
  completed: { label: 'Đã checkout', className: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' },
  cancelled: { label: 'Đã hủy', className: 'border-slate-400/20 bg-slate-400/10 text-slate-300' },
};

const customerLabels: Record<CustomerType, string> = {
  resident: 'Cư dân',
  visitor: 'Vãng lai',
  booking: 'Có booking',
};

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '--';

const formatCurrency = (value?: string | number | null) =>
  value == null ? '--' : `${Number(value).toLocaleString('vi-VN')} đ`;

const formatDuration = (session: ActiveSessionApiItem) => {
  const end = session.exitTime ? new Date(session.exitTime).getTime() : Date.now();
  const minutes = Math.max(0, Math.floor((end - new Date(session.entryTime).getTime()) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  if (days) return `${days} ngày ${hours} giờ`;
  if (hours) return `${hours} giờ ${rest} phút`;
  return `${rest} phút`;
};

const getLocation = (session: ActiveSessionApiItem) => {
  const placeCode = session.slot?.slotCode ?? session.row?.rowCode;
  const floor = session.floor ?? session.slot?.floor ?? session.row?.floor;
  const parts = [placeCode, floor?.floorNumber != null ? `Tầng ${floor.floorNumber}` : null, floor?.building?.name]
    .filter(Boolean);
  return parts.length ? parts.join(' · ') : session.floorId ? `Tầng #${session.floorId}` : '--';
};

const getCustomerName = (session: ActiveSessionApiItem) =>
  session.booking?.customerName || session.user?.fullName || 'Khách vãng lai';

export default function ParkingSessionsPage() {
  const [sessions, setSessions] = useState<ActiveSessionApiItem[]>([]);
  const [status, setStatus] = useState<StatusFilter>('active');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [customerType, setCustomerType] = useState<CustomerType | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | ''>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: SessionListParams = {
        status,
        page,
        limit: 20,
        search: search || undefined,
        vehicleType: vehicleType || undefined,
        customerType: customerType || undefined,
        paymentStatus: paymentStatus || undefined,
      };
      const result = await getSessions(params);
      setSessions(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được lịch sử phiên gửi xe.');
    } finally {
      setLoading(false);
    }
  }, [customerType, page, paymentStatus, search, status, vehicleType]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadSessions(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadSessions]);

  const pageStats = useMemo(
    () => ({
      cars: sessions.filter((item) => item.vehicleType === 'car').length,
      motorcycles: sessions.filter((item) => item.vehicleType === 'motorcycle').length,
      paid: sessions.filter((item) => item.paymentStatus === 'paid').length,
    }),
    [sessions],
  );

  const changeStatus = (value: StatusFilter) => {
    setStatus(value);
    setPage(1);
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim().toUpperCase());
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setVehicleType('');
    setCustomerType('');
    setPaymentStatus('');
    setPage(1);
  };

  return (
    <AdminLayout
      eyebrow="Lịch sử vận hành"
      title="Phiên gửi xe"
      subtitle="Theo dõi đầy đủ thời gian check-in, checkout, khách hàng, vị trí và thanh toán."
      meta={
        <button
          type="button"
          onClick={() => void loadSessions()}
          disabled={loading}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-400/25 bg-blue-400/10 px-4 text-sm font-semibold text-blue-200 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Làm mới
        </button>
      }
    >
      <div className="space-y-5">
        <section className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => changeStatus(tab.value)}
              className={cn(
                'h-10 rounded-xl border px-4 text-sm font-semibold transition',
                status === tab.value
                  ? 'border-blue-400/40 bg-blue-500/15 text-blue-200'
                  : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white',
              )}
            >
              {tab.label}
            </button>
          ))}
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {[
            { label: 'Tổng kết quả', value: pagination.total, icon: History, color: 'text-blue-300' },
            { label: 'Ô tô trang này', value: pageStats.cars, icon: Car, color: 'text-emerald-300' },
            { label: 'Xe máy trang này', value: pageStats.motorcycles, icon: Motorbike, color: 'text-amber-300' },
          ].map((item) => (
            <div key={item.label} className="border border-white/10 bg-[#0F172A]/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{item.value}</p>
                </div>
                <item.icon className={cn('h-5 w-5', item.color)} />
              </div>
            </div>
          ))}
        </section>

        <section className="border border-white/10 bg-[#0F172A]/80 p-5">
          <form onSubmit={submitSearch} className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_170px_170px_170px_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value.toUpperCase())}
                placeholder="Tìm biển số"
                className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-10 pr-3 text-sm font-semibold text-white outline-none focus:border-blue-400/60"
              />
            </label>
            <select value={customerType} onChange={(event) => { setCustomerType(event.target.value as CustomerType | ''); setPage(1); }} className="h-11 rounded-lg border border-white/10 bg-[#111827] px-3 text-sm text-white">
              <option value="">Tất cả khách</option>
              <option value="resident">Cư dân</option>
              <option value="visitor">Vãng lai</option>
              <option value="booking">Có booking</option>
            </select>
            <select value={vehicleType} onChange={(event) => { setVehicleType(event.target.value as VehicleType | ''); setPage(1); }} className="h-11 rounded-lg border border-white/10 bg-[#111827] px-3 text-sm text-white">
              <option value="">Tất cả xe</option>
              <option value="car">Ô tô</option>
              <option value="motorcycle">Xe máy</option>
            </select>
            <select value={paymentStatus} onChange={(event) => { setPaymentStatus(event.target.value as 'paid' | 'unpaid' | ''); setPage(1); }} className="h-11 rounded-lg border border-white/10 bg-[#111827] px-3 text-sm text-white">
              <option value="">Mọi thanh toán</option>
              <option value="paid">Đã thanh toán</option>
              <option value="unpaid">Chưa thanh toán</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500">Tìm</button>
              <button type="button" onClick={clearFilters} className="h-11 rounded-lg border border-white/10 px-4 text-sm font-semibold text-slate-300">Xóa lọc</button>
            </div>
          </form>

          {error && <div className="mt-4 border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr className="border-b border-white/10">
                  <th className="px-3 py-3">Phương tiện</th>
                  <th className="px-3 py-3">Khách hàng</th>
                  <th className="px-3 py-3">Vị trí</th>
                  <th className="px-3 py-3">Check-in</th>
                  <th className="px-3 py-3">Checkout</th>
                  <th className="px-3 py-3">Phí</th>
                  <th className="px-3 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="h-56 text-center text-slate-400"><Loader2 className="mr-2 inline h-5 w-5 animate-spin" />Đang tải...</td></tr>
                ) : sessions.length === 0 ? (
                  <tr><td colSpan={7} className="h-56 text-center text-slate-500">Không có phiên phù hợp.</td></tr>
                ) : sessions.map((session) => {
                  const meta = statusMeta[session.status];
                  const resolvedCustomerType = session.customerType ?? 'visitor';
                  return (
                    <tr key={session.id} className="border-b border-white/5 hover:bg-white/[0.025]">
                      <td className="px-3 py-4"><p className="font-bold tracking-wider text-white">{session.licensePlate}</p><p className="mt-1 text-xs text-slate-500">{session.vehicleType === 'car' ? 'Ô tô' : 'Xe máy'} · #{session.id}</p></td>
                      <td className="px-3 py-4"><p className="font-medium text-slate-200">{getCustomerName(session)}</p><p className="mt-1 text-xs text-blue-300">{customerLabels[resolvedCustomerType]}</p></td>
                      <td className="px-3 py-4 text-slate-300">{getLocation(session)}</td>
                      <td className="px-3 py-4 text-slate-300"><p>{formatDateTime(session.entryTime)}</p><p className="mt-1 text-xs text-slate-500">{formatDuration(session)}</p></td>
                      <td className="px-3 py-4 text-slate-300">{formatDateTime(session.exitTime)}</td>
                      <td className="px-3 py-4"><p className="font-semibold text-white">{formatCurrency(session.fee)}</p><p className={cn('mt-1 text-xs', session.paymentStatus === 'paid' ? 'text-emerald-300' : 'text-amber-300')}>{session.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p></td>
                      <td className="px-3 py-4"><span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', meta.className)}>{meta.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <p className="text-sm text-slate-500">Trang {pagination.page}/{pagination.totalPages || 1} · {pagination.total} phiên · {pageStats.paid} đã thanh toán trên trang</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={loading || page <= 1} className="inline-flex h-10 items-center gap-1 rounded-lg border border-white/10 px-3 text-sm text-slate-300 disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Trước</button>
              <button type="button" onClick={() => setPage((value) => Math.min(pagination.totalPages || 1, value + 1))} disabled={loading || page >= (pagination.totalPages || 1)} className="inline-flex h-10 items-center gap-1 rounded-lg border border-white/10 px-3 text-sm text-slate-300 disabled:opacity-40">Sau<ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Car, Clock3, Plus, ReceiptText, RefreshCw } from 'lucide-react';
import { BookingCard } from '../components/booking/BookingCard';
import { BookingHero } from '../components/booking/BookingHero';
import { useAuth } from '../hooks/useAuth';
import { bookingService, type Booking } from '../services/booking.service';

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeBookings = useMemo(() => bookings.filter((item) => item.status === 'pending' || item.status === 'confirmed'), [bookings]);

  useEffect(() => { if (!authLoading && !isAuthenticated) navigate('/login'); }, [authLoading, isAuthenticated, navigate]);
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    bookingService.getMine().then((result) => { if (!cancelled) setBookings(result); })
      .catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Không tải được danh sách đặt chỗ.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const handleCancel = async (id: number) => {
    setCancellingId(id); setError(null);
    try { const updated = await bookingService.cancelBooking(id); setBookings((items) => items.map((item) => item.id === id ? updated : item)); }
    catch (cancelError) { setError(cancelError instanceof Error ? cancelError.message : 'Không thể hủy đặt chỗ.'); }
    finally { setCancellingId(null); }
  };

  if (authLoading || !isAuthenticated) return <div className="grid min-h-screen place-items-center bg-[#f8fbff]"><div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-[#f8fbff] pt-28 text-slate-950"><main className="container mx-auto px-6 pb-20 md:px-12">
      <BookingHero eyebrow="Đặt chỗ của tôi" title={`Theo dõi booking của ${user?.fullName ?? 'bạn'}`} description="Kiểm tra trạng thái thanh toán, thời gian gửi xe và hủy các booking chưa hoàn tất khi cần." />
      <section className="mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-3">
        <Stat icon={ReceiptText} label="Tổng booking" value={bookings.length} tone="text-blue-600" /><Stat icon={Clock3} label="Đang hiệu lực" value={activeBookings.length} tone="text-emerald-600" />
        <Link to="/booking" className="flex min-h-[132px] items-center justify-center gap-3 rounded-[24px] border border-blue-200 bg-blue-600 p-5 text-sm font-bold text-white shadow-lg"><Plus className="h-5 w-5" />Tạo đặt chỗ mới</Link>
      </section>
      {error && <div role="alert" className="mx-auto mt-6 flex max-w-6xl gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      <section className="mx-auto mt-8 max-w-6xl">
        {loading ? <div className="flex items-center justify-center gap-3 rounded-[28px] border border-slate-200 bg-white py-16 text-sm font-semibold text-slate-500"><RefreshCw className="h-5 w-5 animate-spin text-blue-600" />Đang tải danh sách đặt chỗ</div>
          : bookings.length === 0 ? <Empty />
          : <div className="grid gap-4">{bookings.map((item, index) => <BookingCard key={item.id} booking={item} index={index} cancelling={cancellingId === item.id} onCancel={handleCancel} />)}</div>}
      </section>
    </main></div>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof ReceiptText; label: string; value: number; tone: string }) { return <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><Icon className={`mb-3 h-6 w-6 ${tone}`} /><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></div>; }
function Empty() { return <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><Car className="mx-auto mb-4 h-10 w-10 text-blue-600" /><h2 className="text-2xl font-black">Bạn chưa có booking nào</h2><p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Tạo booking vãng lai để thanh toán trước và nhân viên có thể nhận diện biển số khi check-in.</p><Link to="/booking" className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white"><Plus className="h-4 w-4" />Đặt chỗ ngay</Link></div>; }

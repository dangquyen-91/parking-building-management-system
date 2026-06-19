import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, CreditCard, Loader2, Receipt, XCircle } from 'lucide-react';
import { paymentService, type Payment } from '../services/payment.service';
import { useAuth } from '../hooks/useAuth';

const formatCurrency = (value: string | number) =>
  Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  success: 'Thanh toán thành công',
  failed: 'Thanh toán thất bại',
  cancelled: 'Đã hủy',
};

const typeLabels: Record<string, string> = {
  subscription: 'Mua gói cư dân',
  session: 'Thanh toán checkout',
  booking: 'Thanh toán đặt chỗ',
};

export default function PaymentReturnPage() {
  const [params] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const orderId = params.get('orderId') ?? '';
  const returnStatus = params.get('status') ?? '';
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId && isAuthenticated));
  const [error, setError] = useState<string | null>(null);

  const optimisticSuccess = returnStatus === 'success';
  const resolvedSuccess = payment?.status === 'success';
  const isSuccess = resolvedSuccess || (optimisticSuccess && !payment);
  const paymentType = payment?.paymentType ?? (orderId.startsWith('BOOK-') ? 'booking' : orderId.startsWith('SUB-') ? 'subscription' : orderId.startsWith('SESS-') ? 'session' : '');
  const isBookingPayment = paymentType === 'booking';
  const isSubscriptionPayment = paymentType === 'subscription';
  const isSessionPayment = paymentType === 'session';

  const title = useMemo(() => {
    if (!orderId) return 'Thiếu mã thanh toán';
    if (loading) return 'Đang kiểm tra thanh toán';
    if (error) return 'Cần kiểm tra lại thanh toán';
    return isSuccess ? 'Thanh toán thành công' : 'Thanh toán chưa hoàn tất';
  }, [error, isSuccess, loading, orderId]);

  useEffect(() => {
    let cancelled = false;

    async function loadPayment() {
      if (!orderId || !isAuthenticated) {
        setPayment(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await paymentService.getByOrderId(orderId);
        if (!cancelled) setPayment(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không đọc được trạng thái thanh toán.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPayment();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, orderId]);

  return (
    <div className="min-h-screen bg-slate-50 px-6 pt-32 pb-20">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5"
        >
          <div className="mb-6 flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
              loading ? 'bg-blue-50 text-blue-600' : isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {loading ? <Loader2 className="h-7 w-7 animate-spin" /> : isSuccess ? <CheckCircle2 className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Kết quả VNPay</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {!isAuthenticated
                  ? isBookingPayment
                    ? 'Thanh toán booking đã được VNPay chuyển về hệ thống. Nếu giao dịch thành công, email xác nhận sẽ được gửi về địa chỉ bạn đã nhập khi đặt chỗ.'
                    : 'Thanh toán đã được VNPay chuyển về hệ thống. Vì bạn chưa đăng nhập, trang này chỉ hiển thị kết quả cơ bản và mã đơn hàng.'
                  : isBookingPayment
                    ? 'Nếu VNPay xác nhận thành công, booking sẽ được chuyển sang trạng thái đã xác nhận và email xác nhận sẽ được gửi cho khách.'
                    : isSubscriptionPayment
                      ? 'Nếu thanh toán thành công, gói cư dân sẽ được kích hoạt hoặc cộng dồn vào gói còn hạn của cùng biển số.'
                      : 'Backend redirect về trang này kèm orderId. Nếu IPN từ VNPay đã xử lý, trạng thái payment sẽ được cập nhật tự động.'}
              </p>
            </div>
          </div>

          {!isAuthenticated && (
            <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
              {isBookingPayment
                ? 'Bạn có thể dùng mã đơn hàng để đối chiếu khi cần hỗ trợ. Vé booking chi tiết sẽ được gửi qua email sau khi thanh toán thành công.'
                : 'Bạn cần đăng nhập lại để xem chi tiết thanh toán và tiếp tục thao tác với tài khoản.'}
              {' '}Mã đơn hàng: <span className="font-bold">{orderId || '--'}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 flex gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-slate-500">
                <Receipt className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em]">Mã đơn hàng</span>
              </div>
              <p className="break-all text-sm font-bold text-slate-950">{orderId || '--'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-slate-500">
                <CreditCard className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em]">Trạng thái</span>
              </div>
              <p className="text-sm font-bold text-slate-950">
                {payment ? statusLabels[payment.status] ?? payment.status : returnStatus || '--'}
              </p>
            </div>
          </div>

          {payment && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Loại thanh toán</p>
                  <p className="mt-1 font-bold text-slate-950">{typeLabels[paymentType] ?? paymentType ?? '--'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Số tiền</p>
                  <p className="mt-1 font-bold text-slate-950">{formatCurrency(payment.amount)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Thông tin</p>
                  <p className="mt-1 font-bold text-slate-950">{payment.orderInfo || '--'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {isBookingPayment ? 'Booking' : isSessionPayment ? 'Phiên checkout' : 'Gói cư dân'}
                  </p>
                  <p className="mt-1 font-bold text-slate-950">
                    {isBookingPayment
                      ? `#${payment.bookingId ?? '--'}`
                      : isSessionPayment
                        ? `#${payment.sessionId ?? '--'}`
                        : payment.status === 'success'
                          ? 'Đã xử lý'
                          : payment.subscription?.status ?? '--'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            {!isAuthenticated ? (
              <>
                <Link
                  to={isBookingPayment ? '/booking' : '/login'}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  {isBookingPayment ? 'Đặt booking khác' : 'Đăng nhập lại'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
                >
                  Về trang chủ
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={isBookingPayment ? '/my-bookings' : '/membership'}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  {isBookingPayment ? 'Xem booking của tôi' : 'Quay lại mua gói'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/staff/check-in"
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
                >
                  Sang check-in
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

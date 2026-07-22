import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, CreditCard, Loader2, Receipt, XCircle } from 'lucide-react';
import { paymentService, type Payment } from '../services/payment.service';
import { subscriptionService, type ResidentSubscription } from '../services/subscription.service';
import { useAuth } from '../hooks/useAuth';

const POLL_INTERVAL = 2000;
const POLL_MAX = 5;

const formatCurrency = (value: string | number) =>
  Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString('vi-VN') : '--');

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

const VT_LABEL: Record<string, string> = { car: 'Ô tô', motorcycle: 'Xe máy' };

export default function PaymentReturnPage() {
  const [params] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const orderId = params.get('orderId') ?? '';
  const returnStatus = params.get('status') ?? '';
  const optimisticSuccess = returnStatus === 'success';

  const [payment, setPayment] = useState<Payment | null>(null);
  const [subDetail, setSubDetail] = useState<ResidentSubscription | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId && isAuthenticated));
  const [error, setError] = useState<string | null>(null);

  const paymentType =
    payment?.paymentType ??
    (orderId.startsWith('BOOK-') ? 'booking' : orderId.startsWith('SUB-') ? 'subscription' : orderId.startsWith('SESS-') ? 'session' : '');
  const isBooking = paymentType === 'booking';
  const isSubscription = paymentType === 'subscription';
  const isSession = paymentType === 'session';

  const resolvedSuccess = payment?.status === 'success';
  const resolvedFailed = payment?.status === 'failed' || payment?.status === 'cancelled';
  const isSuccess = resolvedSuccess || (!isAuthenticated && optimisticSuccess);
  const isChecking = isAuthenticated && !resolvedSuccess && !resolvedFailed && (loading || payment?.status === 'pending');
  const isFailed = !isSuccess && !isChecking && resolvedFailed;

  useEffect(() => {
    if (!orderId || !isAuthenticated) {
      setPayment(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = async (attempt: number) => {
      try {
        const result = await paymentService.getByOrderId(orderId);
        if (cancelled) return;
        setPayment(result);
        setError(null);
        if (result.status === 'pending' && optimisticSuccess && attempt < POLL_MAX) {
          timer = setTimeout(() => run(attempt + 1), POLL_INTERVAL);
        } else {
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Không đọc được trạng thái thanh toán.');
        setLoading(false);
      }
    };

    setLoading(true);
    setError(null);
    run(1);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [isAuthenticated, orderId, optimisticSuccess]);

  useEffect(() => {
    const isSub = payment?.paymentType === 'subscription' || payment?.orderId?.startsWith('SUB-');
    if (!isAuthenticated || !payment || !isSub || payment.status !== 'success' || !payment.subscriptionId) {
      return;
    }
    let cancelled = false;
    subscriptionService
      .getById(payment.subscriptionId)
      .then((s) => !cancelled && setSubDetail(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [payment, isAuthenticated]);

  const title = useMemo(() => {
    if (!orderId) return 'Thiếu mã thanh toán';
    if (isChecking) return 'Đang xác nhận thanh toán';
    if (isSuccess) return 'Thanh toán thành công';
    if (isFailed) return 'Thanh toán chưa hoàn tất';
    return 'Kết quả thanh toán';
  }, [orderId, isChecking, isSuccess, isFailed]);

  const description = useMemo(() => {
    if (isChecking) return 'Chúng tôi đang xác nhận giao dịch với VNPay, vui lòng đợi trong giây lát…';
    if (!isAuthenticated) {
      return isBooking
        ? 'Nếu giao dịch thành công, email xác nhận đặt chỗ sẽ được gửi tới địa chỉ bạn đã nhập.'
        : 'Đăng nhập lại để xem chi tiết giao dịch và tiếp tục thao tác với tài khoản của bạn.';
    }
    if (isFailed) return 'Giao dịch chưa hoàn tất. Bạn có thể thử thanh toán lại hoặc liên hệ hỗ trợ nếu đã bị trừ tiền.';
    if (isBooking) return 'Đặt chỗ của bạn đã được xác nhận. Email xác nhận đã được gửi tới bạn.';
    if (isSubscription) return 'Gói cư dân của bạn đã được kích hoạt. Bạn có thể xem chi tiết trong mục Gói của tôi.';
    return 'Giao dịch đã hoàn tất.';
  }, [isChecking, isAuthenticated, isFailed, isBooking, isSubscription]);

  const ctas = useMemo<{ primary: { to: string; label: string }; secondary: { to: string; label: string } | null }>(() => {
    if (!isAuthenticated) {
      return {
        primary: isBooking ? { to: '/booking', label: 'Đặt chỗ khác' } : { to: '/login', label: 'Đăng nhập lại' },
        secondary: { to: '/', label: 'Về trang chủ' },
      };
    }
    if (isFailed) {
      return {
        primary: { to: isBooking ? '/booking' : '/membership', label: 'Thử thanh toán lại' },
        secondary: { to: '/contact', label: 'Liên hệ hỗ trợ' },
      };
    }
    if (isBooking) return { primary: { to: '/my-bookings', label: 'Xem booking của tôi' }, secondary: { to: '/booking', label: 'Đặt chỗ khác' } };
    if (isSubscription) return { primary: { to: '/profile?tab=packages', label: 'Xem gói của tôi' }, secondary: { to: '/', label: 'Về trang chủ' } };
    return { primary: { to: '/', label: 'Về trang chủ' }, secondary: null };
  }, [isAuthenticated, isFailed, isBooking, isSubscription]);

  return (
    <div className="min-h-screen bg-slate-50 px-6 pt-32 pb-20">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5"
        >
          <div className="mb-6 flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                isChecking ? 'bg-blue-50 text-blue-600' : isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              {isChecking ? <Loader2 className="h-7 w-7 animate-spin" /> : isSuccess ? <CheckCircle2 className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Kết quả VNPay</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          </div>

          {!isAuthenticated && (
            <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
              Mã đơn hàng: <span className="font-bold">{orderId || '--'}</span> — dùng để đối chiếu khi cần hỗ trợ.
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
                {isChecking ? 'Đang xác nhận…' : payment ? statusLabels[payment.status] ?? payment.status : isSuccess ? 'Thanh toán thành công' : returnStatus || '--'}
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

                {isSubscription && (
                  <>
                    {(() => {
                      const vt = subDetail?.vehicleType ?? payment.subscription?.vehicleType;
                      const endDate = subDetail?.endDate ?? payment.subscription?.endDate;
                      const plate = subDetail?.licensePlate ?? payment.subscription?.licensePlate ?? '--';
                      const subStatus = subDetail?.status ?? payment.subscription?.status;
                      return (
                        <>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Gói</p>
                            <p className="mt-1 font-bold text-slate-950">
                              {subDetail?.package?.name ?? payment.orderInfo ?? '--'}
                              {vt ? ` · ${VT_LABEL[vt]}` : ''}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Hiệu lực đến</p>
                            <p className="mt-1 font-bold text-slate-950">{formatDate(endDate)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Biển số</p>
                            <p className="mt-1 font-bold text-slate-950">{plate}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Trạng thái gói</p>
                            <p className="mt-1 font-bold text-slate-950">{subStatus === 'active' ? 'Đã kích hoạt' : subStatus ?? '--'}</p>
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}

                {isBooking && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Mã booking</p>
                    <p className="mt-1 font-bold text-slate-950">#{payment.bookingId ?? '--'}</p>
                  </div>
                )}
                {isSession && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Phiên checkout</p>
                    <p className="mt-1 font-bold text-slate-950">#{payment.sessionId ?? '--'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to={ctas.primary.to}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              {ctas.primary.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {ctas.secondary && (
              <Link
                to={ctas.secondary.to}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
              >
                {ctas.secondary.label}
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

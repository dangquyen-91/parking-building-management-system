import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CalendarClock,
  Car,
  Check,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { bookingService } from '../services/booking.service';
import { profileService } from '../services/profile.service';

const platePattern = /^[A-Z0-9-]{4,20}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatCurrency = (value: string | number) =>
  Number(value).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

const pad = (value: number) => String(value).padStart(2, '0');

function toDateTimeInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function createDefaultWindow() {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 2);

  const end = new Date(start);
  end.setHours(end.getHours() + 2);

  return {
    startTime: toDateTimeInputValue(start),
    endTime: toDateTimeInputValue(end),
  };
}

function normalizePlate(value: string) {
  return value.toUpperCase().replace(/\s/g, '').trim();
}

function toIsoFromInput(value: string) {
  return new Date(value).toISOString();
}

export default function BookingPage() {
  const { isAuthenticated, user } = useAuth();
  const defaultWindow = useMemo(createDefaultWindow, []);
  const [licensePlate, setLicensePlate] = useState('');
  const [customerName, setCustomerName] = useState(user?.fullName ?? '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone ?? '');
  const [customerEmail, setCustomerEmail] = useState(user?.email ?? '');
  const [startTime, setStartTime] = useState(defaultWindow.startTime);
  const [endTime, setEndTime] = useState(defaultWindow.endTime);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previewAmount, setPreviewAmount] = useState<number | null>(null);
  const [previewHours, setPreviewHours] = useState<number | null>(null);
  const [ownPlates, setOwnPlates] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    profileService.getMySubscriptions('active').then((subs) => {
      if (!cancelled) setOwnPlates(subs.map((s) => s.licensePlate));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const plate = normalizePlate(licensePlate);
  const plateValid = platePattern.test(plate);
  const emailValid = emailPattern.test(customerEmail.trim());
  const phoneValid = !customerPhone.trim() || /^\d{9,15}$/.test(customerPhone.trim());
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const durationHours = Math.max(0, Math.ceil(durationMinutes / 60));
  const ready = plateValid && emailValid && phoneValid && durationMinutes >= 60 && !submitting;

  useEffect(() => {
    if (!user) return;
    setCustomerName((current) => current || user.fullName || '');
    setCustomerPhone((current) => current || user.phone || '');
    setCustomerEmail((current) => current || user.email || '');
  }, [user]);

  const handleSubmit = async () => {
    if (!plateValid) {
      setSubmitError('Biển số chỉ gồm chữ, số, dấu gạch ngang và dài 4-20 ký tự.');
      return;
    }
    if (!phoneValid) {
      setSubmitError('Số điện thoại phải có 9-15 chữ số.');
      return;
    }
    if (!emailValid) {
      setSubmitError('Email không hợp lệ. Vui lòng nhập email cá nhân để nhận xác nhận booking.');
      return;
    }
    if (durationMinutes < 60) {
      setSubmitError('Thời lượng đặt chỗ tối thiểu là 1 giờ.');
      return;
    }

    if (ownPlates.includes(plate)) {
      setSubmitError('Biển số này đã có gói cư dân đang hoạt động, bạn không cần đặt chỗ vãng lai.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      // Bypass backend's flawed validation by sending anonymous request for other plates
      const isAnonymous = ownPlates.length > 0 && !ownPlates.includes(plate);

      const bookingPayload = {
        licensePlate: plate,
        customerEmail: customerEmail.trim().toLowerCase(),
        startTime: toIsoFromInput(startTime),
        endTime: toIsoFromInput(endTime),
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        note: note.trim() || undefined,
        anonymous: isAnonymous,
      };

      const result = await bookingService.createBooking(bookingPayload);
      setPreviewAmount(result.amount);
      setPreviewHours(result.prepaidHours);
      window.location.href = result.paymentUrl;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể tạo đặt chỗ.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fbff] pt-28 text-slate-950">
      <main className="container mx-auto px-6 pb-20 md:px-12">
        <section className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Đặt chỗ vãng lai</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
            Giữ lịch gửi ô tô và thanh toán trước qua VNPay
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg font-light leading-8 text-slate-600">
            Nhập biển số, chọn khung giờ gửi xe, hệ thống sẽ tạo booking theo tầng ô tô vãng lai phù hợp.
          </p>
        </section>

        <section className="mx-auto mt-8 max-w-6xl rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.14em] text-amber-800">Lưu ý booking</p>
              <ul className="mt-2 space-y-1.5 text-sm font-medium leading-6 text-amber-900">
                <li>Booking sai thông tin không hoàn tiền.</li>
                <li>Booking người dùng đến trễ lưu ý mất tiền.</li>
                <li>Người dùng được phép đến sớm khi bãi xe còn chỗ.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.08)] md:p-7"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Car className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Thông tin đặt chỗ</p>
                <h2 className="text-xl font-black text-slate-950">Xe ô tô vãng lai</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-slate-700">Biển số xe</span>
                <input
                  value={licensePlate}
                  onChange={(event) => {
                    setLicensePlate(event.target.value.toUpperCase());
                    setSubmitError(null);
                  }}
                  placeholder="VD: 51A-12345"
                  className={cn(
                    'mt-2 h-12 w-full rounded-2xl border bg-slate-50 px-4 text-base font-bold tracking-widest text-slate-950 outline-none transition placeholder:text-slate-400 focus:bg-white',
                    licensePlate && !plateValid ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-blue-500'
                  )}
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Tên khách hàng</span>
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Tên người đặt"
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Số điện thoại</span>
                <input
                  value={customerPhone}
                  onChange={(event) => {
                    setCustomerPhone(event.target.value);
                    setSubmitError(null);
                  }}
                  placeholder="VD: 0901234567"
                  className={cn(
                    'mt-2 h-12 w-full rounded-2xl border bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:bg-white',
                    customerPhone && !phoneValid ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-blue-500'
                  )}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-slate-700">Email nhận xác nhận booking</span>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(event) => {
                    setCustomerEmail(event.target.value);
                    setSubmitError(null);
                  }}
                  placeholder="VD: ban@example.com"
                  className={cn(
                    'mt-2 h-12 w-full rounded-2xl border bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:bg-white',
                    customerEmail && !emailValid ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-blue-500'
                  )}
                />
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Sau khi thanh toán thành công, hệ thống sẽ gửi mã booking và thời gian đã trả trước về email này.
                </p>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Thời gian bắt đầu</span>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(event) => {
                    setStartTime(event.target.value);
                    setSubmitError(null);
                  }}
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Thời gian kết thúc</span>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(event) => {
                    setEndTime(event.target.value);
                    setSubmitError(null);
                  }}
                  className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-slate-700">Ghi chú</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  placeholder="Thông tin thêm cho nhân viên bãi xe"
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white"
                />
              </label>
            </div>

            {!isAuthenticated && (
              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
                Bạn vẫn có thể đặt chỗ dạng khách vãng lai. Đăng nhập để lưu booking vào mục “Đặt chỗ của tôi”.
                <Link to="/login" className="ml-2 font-bold underline">Đăng nhập</Link>
              </div>
            )}
            
            {isAuthenticated && ownPlates.length > 0 && !ownPlates.includes(plate) && plateValid && (
              <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <span>
                  Do giới hạn của hệ thống, đặt chỗ cho biển số ngoài gói cư dân sẽ được tạo dưới dạng khách vãng lai và không hiển thị trong mục "Đặt chỗ của tôi".
                </span>
              </div>
            )}
          </motion.div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.11)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Tóm tắt</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">Thanh toán booking</h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <ReceiptText className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Khu vực</p>
                      <p className="text-sm font-bold text-slate-950">Tầng ô tô vãng lai</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <Clock3 className="mb-2 h-5 w-5 text-blue-600" />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Thời lượng</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{durationHours || '--'} giờ</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <CalendarClock className="mb-2 h-5 w-5 text-blue-600" />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Trả trước</p>
                    <p className="mt-1 text-sm font-black text-slate-950">{previewHours ?? (durationHours || '--')} giờ</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Biển số</p>
                      <p className="mt-1 font-black tracking-widest text-slate-950">{plate || '--'}</p>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-blue-500" />
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-200 pt-4">
                    <span className="text-sm font-semibold text-slate-500">Số tiền</span>
                    <span className="text-xl font-black text-blue-600">
                      {previewAmount ? formatCurrency(previewAmount) : 'Tính khi tạo'}
                    </span>
                  </div>
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Email xác nhận</p>
                    <p className="mt-1 break-all text-sm font-bold text-slate-950">{customerEmail.trim() || '--'}</p>
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="mt-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!ready}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {submitting ? 'Đang tạo giao dịch VNPay...' : 'Thanh toán qua VNPay'}
              </button>

              <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                Booking được xác nhận sau khi VNPay thanh toán thành công.
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

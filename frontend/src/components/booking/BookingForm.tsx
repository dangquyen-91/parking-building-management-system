import { motion } from 'framer-motion';
import { AlertCircle, Car } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { BOOKING_DURATION_OPTIONS, estimateCarFee, CAR_HOUR_PRICE, CAR_NIGHT_SURCHARGE, CAR_NIGHT_START, CAR_NIGHT_END, type BookingFormValues } from '../../hooks/useBookingForm';
import { formatBookingCurrency } from './booking.utils';

interface Props {
  values: BookingFormValues;
  onChange: <K extends keyof BookingFormValues>(field: K, value: BookingFormValues[K]) => void;
  isAuthenticated: boolean;
  hasActiveSubscriptions: boolean;
  isOutsideSubscription: boolean;
  plateValid: boolean;
  emailValid: boolean;
  phoneValid: boolean;
}

export function BookingForm({ values, onChange, isAuthenticated, hasActiveSubscriptions,
  isOutsideSubscription, plateValid, emailValid, phoneValid }: Props) {
  const inputClass = 'mt-2 h-12 w-full rounded-2xl border bg-slate-50 px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:bg-white';

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.08)] md:p-7">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Car className="h-6 w-6" /></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Thông tin đặt chỗ</p><h2 className="text-xl font-black">Xe ô tô vãng lai</h2></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Biển số xe" wide>
          <input value={values.licensePlate} onChange={(e) => onChange('licensePlate', e.target.value.toUpperCase())} placeholder="VD: 51A-12345"
            className={cn(inputClass, 'text-base font-bold tracking-widest', values.licensePlate && !plateValid ? 'border-red-300' : 'border-slate-200 focus:border-blue-500')} />
        </Field>
        <Field label="Tên khách hàng"><input value={values.customerName} onChange={(e) => onChange('customerName', e.target.value)} placeholder="Tên người đặt" className={cn(inputClass, 'border-slate-200 focus:border-blue-500')} /></Field>
        <Field label="Số điện thoại"><input inputMode="numeric" value={values.customerPhone} onChange={(e) => onChange('customerPhone', e.target.value)} placeholder="VD: 0901234567" className={cn(inputClass, values.customerPhone && !phoneValid ? 'border-red-300' : 'border-slate-200 focus:border-blue-500')} /></Field>
        <Field label="Email nhận xác nhận booking" wide>
          <input type="email" value={values.customerEmail} onChange={(e) => onChange('customerEmail', e.target.value)} placeholder="VD: ban@example.com" className={cn(inputClass, values.customerEmail && !emailValid ? 'border-red-300' : 'border-slate-200 focus:border-blue-500')} />
          <p className="mt-2 text-xs font-medium text-slate-500">Sau khi thanh toán thành công, hệ thống sẽ gửi mã booking về email này.</p>
        </Field>
        <Field label="Thời gian bắt đầu">
          <input type="datetime-local" value={values.startTime} onChange={(e) => onChange('startTime', e.target.value)} className={cn(inputClass, 'border-slate-200 font-bold focus:border-blue-500')} />
        </Field>
        <Field label="Thời lượng đặt chỗ">
          <select value={values.durationHours} onChange={(e) => onChange('durationHours', Number(e.target.value))}
            className={cn(inputClass, 'border-slate-200 font-bold focus:border-blue-500')}>
            {BOOKING_DURATION_OPTIONS.map((hours) => (
              <option key={hours} value={hours}>
                {hours} giờ — {formatBookingCurrency(estimateCarFee(values.startTime, hours))}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs font-medium text-slate-500">
            {formatBookingCurrency(CAR_HOUR_PRICE)}/giờ · phụ thu {formatBookingCurrency(CAR_NIGHT_SURCHARGE)}/giờ khung đêm {CAR_NIGHT_START}:00–{String(CAR_NIGHT_END).padStart(2, '0')}:00.
          </p>
        </Field>
        <Field label="Ghi chú" wide><textarea value={values.note} onChange={(e) => onChange('note', e.target.value)} rows={4} placeholder="Thông tin thêm cho nhân viên bãi xe" className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-blue-500" /></Field>
      </div>
      {!isAuthenticated && <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">Bạn vẫn có thể đặt chỗ dạng khách vãng lai. <Link to="/login" className="font-bold underline">Đăng nhập</Link> để lưu booking.</div>}
      {isAuthenticated && hasActiveSubscriptions && isOutsideSubscription && plateValid && (
        <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800"><AlertCircle className="h-5 w-5 shrink-0" /><span>Biển số ngoài gói cư dân sẽ được tạo dưới dạng khách vãng lai và không hiển thị trong mục “Đặt chỗ của tôi”.</span></div>
      )}
    </motion.div>
  );
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={cn('block', wide && 'md:col-span-2')}><span className="text-sm font-bold text-slate-700">{label}</span>{children}</label>;
}

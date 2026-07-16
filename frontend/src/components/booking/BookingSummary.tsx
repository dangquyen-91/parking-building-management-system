import { AlertCircle, CalendarClock, Check, Clock3, CreditCard, Loader2, MapPin, ReceiptText, ShieldCheck } from 'lucide-react';
import { formatBookingCurrency } from './booking.utils';

interface Props {
  plate: string; customerEmail: string; durationHours: number; estimatedAmount: number; previewHours: number | null;
  previewAmount: number | null; submitError: string | null; submitting: boolean; ready: boolean; onSubmit: () => void;
}

export function BookingSummary({ plate, customerEmail, durationHours, estimatedAmount, previewHours, previewAmount, submitError, submitting, ready, onSubmit }: Props) {
  return (
    <aside className="lg:sticky lg:top-28 lg:self-start"><div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.11)]">
      <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Tóm tắt</p><h3 className="mt-1 text-lg font-black">Thanh toán booking</h3></div><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><ReceiptText className="h-5 w-5" /></div></div>
      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-blue-600" /><div><Label>Khu vực</Label><p className="text-sm font-bold">Tầng ô tô vãng lai</p></div></div></div>
        <div className="grid grid-cols-2 gap-3"><Metric icon={Clock3} label="Thời lượng" value={`${durationHours || '--'} giờ`} /><Metric icon={CalendarClock} label="Trả trước" value={`${previewHours ?? (durationHours || '--')} giờ`} /></div>
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
          <div className="flex justify-between"><div><Label>Biển số</Label><p className="mt-1 font-black tracking-widest">{plate || '--'}</p></div><ShieldCheck className="h-5 w-5 text-blue-500" /></div>
          <div className="mt-4 flex items-end justify-between border-t border-slate-200 pt-4"><span className="text-sm font-semibold text-slate-500">Số tiền</span><span className="text-xl font-black text-blue-600">{formatBookingCurrency(previewAmount ?? estimatedAmount)}</span></div>
          <div className="mt-4 border-t border-slate-200 pt-4"><Label>Email xác nhận</Label><p className="mt-1 break-all text-sm font-bold">{customerEmail.trim() || '--'}</p></div>
        </div>
      </div>
      {submitError && <div role="alert" className="mt-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{submitError}</div>}
      <button type="button" onClick={onSubmit} disabled={!ready} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}{submitting ? 'Đang tạo giao dịch VNPay...' : 'Thanh toán qua VNPay'}</button>
      <div className="mt-4 flex gap-2 text-xs text-slate-500"><Check className="h-4 w-4 shrink-0 text-emerald-500" />Booking được xác nhận sau khi VNPay thanh toán thành công.</div>
    </div></aside>
  );
}

function Label({ children }: { children: React.ReactNode }) { return <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{children}</p>; }
function Metric({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><Icon className="mb-2 h-5 w-5 text-blue-600" /><Label>{label}</Label><p className="mt-1 text-sm font-black">{value}</p></div>; }

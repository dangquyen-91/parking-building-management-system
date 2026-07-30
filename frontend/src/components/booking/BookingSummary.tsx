import { useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  Check,
  CircleParking,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  Moon,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import { formatBookingCurrency } from "./booking.utils";
import {
  CAR_HOUR_PRICE,
  CAR_NIGHT_HOUR_PRICE,
  CAR_NIGHT_SURCHARGE,
  type BookingFormValues,
  type CarFeeBreakdown,
} from "../../hooks/useBookingForm";
import type { BookingAvailability } from "../../services/booking.service";

interface Props {
  values: BookingFormValues;
  plate: string;
  durationHours: number;
  estimatedAmount: number;
  previewHours: number | null;
  previewAmount: number | null;
  breakdown: CarFeeBreakdown;
  submitError: string | null;
  submitting: boolean;
  ready: boolean;
  availability: BookingAvailability | null;
  availabilityLoading: boolean;
  availabilityError: string | null;
  onSubmit: () => void;
}

export function BookingSummary({
  values,
  plate,
  durationHours,
  estimatedAmount,
  previewHours,
  previewAmount,
  breakdown,
  submitError,
  submitting,
  ready,
  availability,
  availabilityLoading,
  availabilityError,
  onSubmit,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const amount = previewAmount ?? estimatedAmount;

  const confirmPayment = () => {
    setConfirming(false);
    onSubmit();
  };

  return (
    <>
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.11)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                Tóm tắt
              </p>
              <h3 className="mt-1 text-lg font-black">Thanh toán booking</h3>
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
                  <Label>Khu vực</Label>
                  <p className="text-sm font-bold">Tầng ô tô vãng lai</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric
                icon={Clock3}
                label="Thời lượng"
                value={`${durationHours || "--"} giờ`}
              />
              <Metric
                icon={CalendarClock}
                label="Trả trước"
                value={`${previewHours ?? (durationHours || "--")} giờ`}
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-4">
              <div className="flex justify-between">
                <div>
                  <Label>Biển số</Label>
                  <p className="mt-1 font-black tracking-widest">
                    {plate || "--"}
                  </p>
                </div>
                <ShieldCheck className="h-5 w-5 text-blue-500" />
              </div>
              <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                {breakdown.dayHours > 0 && (
                  <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5 ring-1 ring-amber-100">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                        <Sun className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Ban ngày
                        </p>
                        <p className="text-xs font-medium text-slate-400">
                          {breakdown.dayHours} giờ ×{" "}
                          {formatBookingCurrency(CAR_HOUR_PRICE)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-slate-900">
                      {formatBookingCurrency(breakdown.dayFee)}
                    </span>
                  </div>
                )}
                {breakdown.nightHours > 0 && (
                  <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-3 py-2.5 ring-1 ring-indigo-100">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                        <Moon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-bold text-indigo-700">
                          Ban đêm
                          <span className="rounded-full bg-indigo-600/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
                            +{formatBookingCurrency(CAR_NIGHT_SURCHARGE)}/giờ
                          </span>
                        </p>
                        <p className="text-xs font-medium text-slate-400">
                          {breakdown.nightHours} giờ ×{" "}
                          {formatBookingCurrency(CAR_NIGHT_HOUR_PRICE)} · khung
                          22:00–05:00
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-indigo-700">
                      {formatBookingCurrency(breakdown.nightFee)}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-end justify-between border-t border-slate-200 pt-3">
                <span className="text-sm font-semibold text-slate-500">
                  Số tiền
                </span>
                <span className="text-xl font-black text-blue-600">
                  {formatBookingCurrency(amount)}
                </span>
              </div>
              <div className="mt-4 border-t border-slate-200 pt-4">
                <Label>Email xác nhận</Label>
                <p className="mt-1 break-all text-sm font-bold">
                  {values.customerEmail.trim() || "--"}
                </p>
              </div>
            </div>
          </div>
          <div
            role="status"
            className={`mt-4 overflow-hidden rounded-2xl border-2 shadow-sm ${
              availability?.acceptingBookings
                ? "border-emerald-300 bg-linear-to-br from-emerald-50 to-white"
                : "animate-pulse border-red-400 bg-linear-to-br from-red-50 to-orange-50 shadow-red-100"
            }`}
          >
            <div
              className={`flex items-center gap-3 px-4 py-3 ${
                availability?.acceptingBookings
                  ? "bg-emerald-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {availability?.acceptingBookings ? (
                <CircleParking className="h-6 w-6 shrink-0" />
              ) : (
                <ShieldAlert className="h-6 w-6 shrink-0" />
              )}
              <p className="text-sm font-black uppercase tracking-wide">
                {availabilityLoading
                  ? "Đang kiểm tra sức chứa"
                  : availability?.acceptingBookings
                    ? "Bãi đang nhận booking"
                    : "Tạm ngừng nhận booking"}
              </p>
            </div>
            <div className="px-4 py-4">
              {availabilityLoading ? (
                <div className="flex items-center gap-2 font-bold text-slate-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Vui lòng chờ trong giây lát…
                </div>
              ) : availabilityError ? (
                <p className="font-bold text-red-700">
                  Không kiểm tra được sức chứa: {availabilityError}
                </p>
              ) : (
                <>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Chỗ còn lại
                      </p>
                      <p
                        className={`mt-1 text-4xl font-black ${
                          availability?.acceptingBookings
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {availability?.available ?? 0}
                        <span className="ml-1 text-lg text-slate-400">
                          / {availability?.total ?? 0}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-black ${
                        availability?.acceptingBookings
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      Khóa khi còn {availability?.minimumFree ?? 10} chỗ
                    </span>
                  </div>
                  {!availability?.acceptingBookings && (
                    <p className="mt-3 border-t border-red-200 pt-3 text-sm font-bold text-red-700">
                      Bãi đã chạm ngưỡng an toàn. Vui lòng đến trực tiếp để check-in.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          {submitError && (
            <div
              role="alert"
              className="mt-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {submitError}
            </div>
          )}
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={!ready}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {submitting
              ? "Đang tạo giao dịch VNPay..."
              : availability?.acceptingBookings
                ? "Kiểm tra và thanh toán"
                : "Tạm ngừng nhận booking"}
          </button>
          <div className="mt-4 flex gap-2 text-xs text-slate-500">
            <Check className="h-4 w-4 shrink-0 text-emerald-500" />
            Booking được xác nhận sau khi VNPay thanh toán thành công.
          </div>
        </div>
      </aside>
      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-confirm-title"
          className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirming(false);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-5 shadow-2xl md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                  Xác nhận booking
                </p>
                <h2
                  id="booking-confirm-title"
                  className="mt-1 text-xl font-black text-slate-950"
                >
                  Kiểm tra thông tin trước khi thanh toán
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                aria-label="Đóng"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <ConfirmRow label="Biển số xe" value={plate} />
              <ConfirmRow
                label="Tên khách hàng"
                value={values.customerName.trim() || "Không cung cấp"}
              />
              <ConfirmRow
                label="Số điện thoại"
                value={values.customerPhone.trim() || "Không cung cấp"}
              />
              <ConfirmRow
                label="Email xác nhận"
                value={values.customerEmail.trim()}
              />
              <ConfirmRow
                label="Thời gian bắt đầu"
                value={formatBookingDateTime(values.startTime)}
              />
              <ConfirmRow label="Thời lượng" value={`${durationHours} giờ`} />
              <ConfirmRow label="Khu vực" value="Tầng ô tô vãng lai" />
              <ConfirmRow
                label="Ghi chú"
                value={values.note.trim() || "Không có"}
              />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-blue-50 px-4 py-4">
              <span className="font-bold text-slate-700">Tổng thanh toán</span>
              <span className="text-xl font-black text-blue-600">
                {formatBookingCurrency(amount)}
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Vui lòng kiểm tra kỹ thông tin. Sau khi xác nhận, bạn sẽ được
              chuyển đến VNPay để hoàn tất thanh toán.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="h-12 rounded-2xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Quay lại chỉnh sửa
              </button>
              <button
                type="button"
                onClick={confirmPayment}
                disabled={submitting}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                Xác nhận thanh toán
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
      {children}
    </p>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <Icon className="mb-2 h-5 w-5 text-blue-600" />
      <Label>{label}</Label>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 py-3 text-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="wrap-break-word text-right font-bold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function formatBookingDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "--"
    : date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
}

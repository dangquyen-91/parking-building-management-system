import {
  BadgeDollarSign,
  Ban,
  CalendarClock,
  Car,
  CheckCircle2,
  CircleParking,
  Clock3,
  Hourglass,
  ReceiptText,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

interface BookingNoticeProps {
  acceptanceRequired?: boolean;
  accepted?: boolean;
  onAcceptedChange?: (accepted: boolean) => void;
  onContinue?: () => void;
}

const policies = [
  {
    icon: Car,
    title: "Dành cho ô tô vãng lai",
    description:
      "Thời gian bắt đầu phải ở tương lai và chỉ được đặt trước tối đa 24 giờ.",
    iconClass: "bg-sky-100 text-sky-700",
  },
  {
    icon: Hourglass,
    title: "Tối thiểu 1 giờ",
    description: "Mỗi booking phải có thời lượng gửi xe từ 1 giờ trở lên.",
    iconClass: "bg-cyan-100 text-cyan-700",
  },
  {
    icon: Clock3,
    title: "Thanh toán trong 15 phút",
    description:
      "Booking chỉ được xác nhận sau khi giao dịch VNPay thành công.",
    iconClass: "bg-blue-100 text-blue-700",
  },
  {
    icon: ReceiptText,
    title: "Một booking cho mỗi biển số",
    description:
      "Mỗi biển số chỉ được có một booking đang chờ thanh toán hoặc đã xác nhận.",
    iconClass: "bg-indigo-100 text-indigo-700",
  },
  {
    icon: CalendarClock,
    title: "Đến sớm tối đa 30 phút",
    description:
      "Sau giờ kết thúc, booking sẽ hết hiệu lực nếu xe chưa vào bãi.",
    iconClass: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: ShieldAlert,
    title: "Hủy booking và hoàn tiền",
    description:
      "Chỉ người dùng đã đăng nhập và sở hữu booking mới có thể hủy khi đang chờ hoặc đã xác nhận. Booking tạo khi chưa đăng nhập không thể tự hủy; booking đã thanh toán không được hoàn tiền.",
    iconClass: "bg-amber-100 text-amber-700",
  },
  {
    icon: BadgeDollarSign,
    title: "Phí gửi xe vượt giờ",
    description:
      "Thời gian vượt quá số giờ trả trước được tính theo giá xe vãng lai.",
    iconClass: "bg-violet-100 text-violet-700",
  },
  {
    icon: CircleParking,
    title: "Phụ thuộc sức chứa của bãi",
    description:
      "Booking chỉ được tiếp nhận khi khu vực xe vãng lai còn ít nhất 10 chỗ trống.",
    iconClass: "bg-orange-100 text-orange-700",
  },
  {
    icon: Ban,
    title: "Không áp dụng cho gói cư dân",
    description:
      "Biển số có gói cư dân đang hoạt động không cần và không được booking vãng lai.",
    iconClass: "bg-rose-100 text-rose-700",
  },
] as const;

export function BookingNotice({
  acceptanceRequired = false,
  accepted = false,
  onAcceptedChange,
  onContinue,
}: BookingNoticeProps) {
  return (
    <section
      aria-labelledby="booking-policy-title"
      className="mx-auto mt-8 max-w-6xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.07)]"
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Chính sách người dùng
            </p>
            <h2
              id="booking-policy-title"
              className="mt-0.5 text-lg font-black text-slate-950"
            >
              Lưu ý trước khi booking
            </h2>
          </div>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Đọc kỹ trước khi thanh toán
        </div>
      </div>

      <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-3">
        {policies.map(({ icon: Icon, title, description, iconClass }) => (
          <article
            key={title}
            className="bg-white p-5 transition-colors hover:bg-slate-50 md:p-6"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconClass}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-black text-slate-900">{title}</h3>
            <p className="mt-1.5 text-sm font-medium leading-6 text-slate-500">
              {description}
            </p>
          </article>
        ))}
      </div>

      {acceptanceRequired && (
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 md:px-7">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => onAcceptedChange?.(event.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-blue-600"
            />
            <span>
              Tôi đã đọc, hiểu và đồng ý tuân thủ toàn bộ chính sách booking ở
              trên.
            </span>
          </label>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={!accepted}
              onClick={onContinue}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              Đồng ý và tiếp tục đặt chỗ
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

import { AlertCircle } from 'lucide-react';

export function BookingNotice() {
  return (
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
  );
}

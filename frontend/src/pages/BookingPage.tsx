import { useState } from 'react';
import { BookingForm } from '../components/booking/BookingForm';
import { BookingHero } from '../components/booking/BookingHero';
import { BookingNotice } from '../components/booking/BookingNotice';
import { BookingSummary } from '../components/booking/BookingSummary';
import { useBookingForm } from '../hooks/useBookingForm';

export default function BookingPage() {
  const [policyAccepted, setPolicyAccepted] = useState(false);

  if (!policyAccepted) {
    return <BookingPolicyGate onAccept={() => setPolicyAccepted(true)} />;
  }

  return <BookingContent />;
}

function BookingPolicyGate({ onAccept }: { onAccept: () => void }) {
  const [agreementChecked, setAgreementChecked] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fbff] pt-28 text-slate-950">
      <main className="container mx-auto px-6 pb-20 md:px-12">
        <BookingHero
          eyebrow="Chính sách đặt chỗ"
          title="Vui lòng đọc chính sách trước khi booking"
          description="Bạn cần xác nhận đã đọc và đồng ý với các điều kiện dưới đây trước khi tiếp tục đến trang đặt chỗ."
        />
        <BookingNotice
          acceptanceRequired
          accepted={agreementChecked}
          onAcceptedChange={setAgreementChecked}
          onContinue={onAccept}
        />
      </main>
    </div>
  );
}

function BookingContent() {
  const booking = useBookingForm();

  return (
    <div className="min-h-screen bg-[#f8fbff] pt-28 text-slate-950"><main className="container mx-auto px-6 pb-20 md:px-12">
      <BookingHero eyebrow="Đặt chỗ vãng lai" title="Giữ lịch gửi ô tô và thanh toán trước qua VNPay" description="Nhập biển số, chọn khung giờ gửi xe, hệ thống sẽ tạo booking theo tầng ô tô vãng lai phù hợp." />
      <section className="mx-auto mt-12 grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <BookingForm values={booking.values} onChange={booking.updateField} isAuthenticated={booking.isAuthenticated} hasActiveSubscriptions={booking.ownPlates.length > 0} isOutsideSubscription={!booking.ownPlates.includes(booking.plate)} plateValid={booking.plateValid} emailValid={booking.emailValid} phoneValid={booking.phoneValid} />
        <BookingSummary plate={booking.plate} customerEmail={booking.values.customerEmail} durationHours={booking.durationHours} estimatedAmount={booking.estimatedAmount} previewHours={booking.previewHours} previewAmount={booking.previewAmount} submitError={booking.submitError} submitting={booking.submitting} ready={booking.ready} onSubmit={booking.submit} />
      </section>
    </main></div>
  );
}

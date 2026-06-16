import { brevoConfig, isBrevoConfigured } from '../config/brevo.config.js';

const sendEmail = async ({ to, toName, subject, htmlContent }) => {
  if (!isBrevoConfigured()) {
    console.warn(`[email] Brevo not configured — skip sending "${subject}" to ${to}`);
    return { sent: false, reason: 'not_configured' };
  }

  const body = {
    sender: { email: brevoConfig.senderEmail, name: brevoConfig.senderName },
    to: [{ email: to, name: toName || to }],
    subject,
    htmlContent,
  };

  const resp = await fetch(brevoConfig.apiUrl, {
    method: 'POST',
    headers: {
      'api-key': brevoConfig.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    throw new Error(`Brevo send failed (${resp.status}): ${errText}`);
  }
  return { sent: true };
};

const fmtVND = (n) => Number(n).toLocaleString('vi-VN') + 'đ';
const fmtTime = (d) =>
  new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export const sendBookingConfirmation = async (booking) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #2e7d32;">✅ Đặt chỗ thành công</h2>
      <p>Cảm ơn bạn đã đặt chỗ gửi xe. Chi tiết booking:</p>
      <table style="width:100%; border-collapse: collapse;">
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Mã booking</b></td><td style="padding:8px; border-bottom:1px solid #eee;">#${booking.id}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Biển số xe</b></td><td style="padding:8px; border-bottom:1px solid #eee;">${booking.licensePlate}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Loại xe</b></td><td style="padding:8px; border-bottom:1px solid #eee;">Ô tô</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Giờ bắt đầu</b></td><td style="padding:8px; border-bottom:1px solid #eee;">${fmtTime(booking.startTime)}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Giờ kết thúc</b></td><td style="padding:8px; border-bottom:1px solid #eee;">${fmtTime(booking.endTime)}</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Số giờ đã trả</b></td><td style="padding:8px; border-bottom:1px solid #eee;">${booking.prepaidHours}h</td></tr>
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Số tiền</b></td><td style="padding:8px; border-bottom:1px solid #eee; color:#2e7d32;"><b>${fmtVND(booking.amount)}</b></td></tr>
      </table>
      <p style="margin-top:16px; font-size:13px; color:#666;">
        Vui lòng xuất trình biển số khi vào bãi. Nếu gửi quá ${booking.prepaidHours}h, phần vượt sẽ tính phí vãng lai khi xe ra.
      </p>
      <p style="font-size:12px; color:#999;">Email tự động — vui lòng không trả lời.</p>
    </div>
  `;

  return sendEmail({
    to: booking.customerEmail,
    toName: booking.customerName || booking.customerEmail,
    subject: `Xác nhận đặt chỗ #${booking.id} — ${booking.licensePlate}`,
    htmlContent: html,
  });
};

export default { sendEmail, sendBookingConfirmation };

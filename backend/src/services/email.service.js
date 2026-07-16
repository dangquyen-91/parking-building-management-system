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
  new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' });

export const sendBookingConfirmation = async (booking) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #2e7d32;">✅ Đặt chỗ thành công</h2>
      <p>Cảm ơn bạn đã đặt chỗ gửi xe. Chi tiết booking:</p>
      <table style="width:100%; border-collapse: collapse;">
        <tr><td style="padding:8px; border-bottom:1px solid #eee;"><b>Mã đặt chỗ</b></td><td style="padding:8px; border-bottom:1px solid #eee;">${booking.orderId || '#' + booking.id}</td></tr>
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
    subject: `Xác nhận đặt chỗ ${booking.orderId || '#' + booking.id} — ${booking.licensePlate}`,
    htmlContent: html,
  });
};

export const sendVerificationEmail = async ({ to, toName, token }) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = `${frontendUrl}/verify-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1565c0;">📧 Xác minh email của bạn</h2>
      <p>Xin chào <b>${toName || to}</b>,</p>
      <p>Bạn vừa đăng ký tài khoản tại hệ thống quản lý bãi xe. Vui lòng nhấn vào nút bên dưới để xác minh địa chỉ email:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${link}"
           style="background:#1565c0; color:#fff; padding:14px 28px; border-radius:6px; text-decoration:none; font-size:16px; font-weight:bold;">
          Xác minh Email
        </a>
      </div>
      <p style="font-size:13px; color:#555;">
        Hoặc copy đường link sau vào trình duyệt:<br/>
        <a href="${link}" style="color:#1565c0;">${link}</a>
      </p>
      <p style="font-size:13px; color:#888;">Link có hiệu lực trong <b>24 giờ</b>. Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.</p>
      <hr style="border:none; border-top:1px solid #eee; margin-top:24px;"/>
      <p style="font-size:12px; color:#999;">Email tự động — vui lòng không trả lời.</p>
    </div>
  `;

  return sendEmail({
    to,
    toName,
    subject: 'Xác minh email đăng ký tài khoản',
    htmlContent: html,
  });
};

export const sendPasswordResetEmail = async ({ to, toName, token }) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = `${frontendUrl}/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #c62828;">🔐 Đặt lại mật khẩu</h2>
      <p>Xin chào <b>${toName || to}</b>,</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tiếp tục:</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${link}"
           style="background:#c62828; color:#fff; padding:14px 28px; border-radius:6px; text-decoration:none; font-size:16px; font-weight:bold;">
          Đặt lại mật khẩu
        </a>
      </div>
      <p style="font-size:13px; color:#555;">
        Hoặc copy đường link sau vào trình duyệt:<br/>
        <a href="${link}" style="color:#c62828;">${link}</a>
      </p>
      <p style="font-size:13px; color:#888;">Link có hiệu lực trong <b>1 giờ</b>. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này — tài khoản của bạn vẫn an toàn.</p>
      <hr style="border:none; border-top:1px solid #eee; margin-top:24px;"/>
      <p style="font-size:12px; color:#999;">Email tự động — vui lòng không trả lời.</p>
    </div>
  `;

  return sendEmail({
    to,
    toName,
    subject: 'Đặt lại mật khẩu tài khoản',
    htmlContent: html,
  });
};

export default { sendEmail, sendBookingConfirmation, sendVerificationEmail, sendPasswordResetEmail };

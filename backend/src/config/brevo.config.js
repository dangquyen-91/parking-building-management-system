export const brevoConfig = {
  apiKey: (process.env.BREVO_API_KEY || '').trim(),
  senderEmail: (process.env.BREVO_SENDER_EMAIL || '').trim(),
  senderName: (process.env.BREVO_SENDER_NAME || 'Parking System').trim(),
  apiUrl: 'https://api.brevo.com/v3/smtp/email',
};

export const isBrevoConfigured = () =>
  Boolean(brevoConfig.apiKey && brevoConfig.senderEmail);

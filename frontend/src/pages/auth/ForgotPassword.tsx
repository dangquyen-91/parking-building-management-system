import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import { motion } from 'framer-motion';
import { Mail, Send, MailCheck, ArrowLeft } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { forgotPasswordSchema } from '../../validation/authSchema';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input } from '../../components/ui/Input';
import { useCooldown } from '../../hooks/useCooldown';

export const ForgotPassword: React.FC = () => {
  const [sent, setSent] = useState(false);
  const [serverMsg, setServerMsg] = useState('');
  const cooldown = useCooldown('cooldown:forgot', 60);

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await authService.forgotPassword(values.email);
        setServerMsg(res.message);
        setSent(true);
        cooldown.start();
      } catch (err) {
        // Backend luôn trả message chung; nếu lỗi mạng thì vẫn hiện màn xác nhận chung
        setServerMsg(err instanceof Error ? err.message : 'Đã xảy ra lỗi, vui lòng thử lại.');
        setSent(true);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <AuthLayout title="Quên mật khẩu" subtitle="Nhập email để nhận link đặt lại mật khẩu.">
      {sent ? (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-5 text-center" aria-live="polite">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 shadow-[0_0_24px_rgba(59,130,246,0.3)]">
            <MailCheck size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Kiểm tra hộp thư của bạn</h3>
            <p className="mt-1 text-sm text-slate-400">{serverMsg}</p>
            <p className="mt-2 text-xs text-slate-500">Link có hiệu lực trong 1 giờ. Không thấy mail? Kiểm tra mục Spam.</p>
          </div>
          <button
            onClick={() => formik.submitForm()}
            disabled={cooldown.active || formik.isSubmitting}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {cooldown.active ? `Gửi lại sau ${cooldown.remaining}s` : 'Gửi lại email'}
          </button>
          <Link to="/login" className="flex items-center gap-1.5 text-sm font-medium text-blue-400 transition hover:text-blue-300">
            <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="name@example.com"
            icon={<Mail className="h-4 w-4" />}
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.email}
            touched={formik.touched.email}
            disabled={formik.isSubmitting}
          />
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={!formik.isValid || formik.isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 font-semibold text-white shadow-[0_4px_20px_rgba(37,99,235,0.25)] transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {formik.isSubmitting ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Send className="h-4 w-4" /> Gửi link đặt lại</>}
          </motion.button>
          <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm font-medium text-blue-400 transition hover:text-blue-300">
            <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
          </Link>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;

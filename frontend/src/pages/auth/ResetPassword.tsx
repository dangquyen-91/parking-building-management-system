import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useFormik } from 'formik';
import { motion } from 'framer-motion';
import { Lock, AlertTriangle, CheckCircle2, KeyRound } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { resetPasswordSchema } from '../../validation/authSchema';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input } from '../../components/ui/Input';

export const ResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [apiError, setApiError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (token) window.history.replaceState({}, '', '/reset-password');
  }, [token]);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => navigate('/login', { state: { passwordReset: true } }), 2000);
    return () => clearTimeout(id);
  }, [done, navigate]);

  const formik = useFormik({
    initialValues: { newPassword: '', confirmPassword: '' },
    validationSchema: resetPasswordSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        await authService.resetPassword(token as string, values.newPassword, values.confirmPassword);
        setDone(true);
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại.');
        setSubmitting(false);
      }
    },
  });

  if (!token) {
    return (
      <AuthLayout title="Link không hợp lệ" subtitle="Không tìm thấy mã đặt lại mật khẩu.">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <AlertTriangle size={32} />
          </div>
          <p className="text-sm text-slate-400">Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
          <Link to="/forgot-password" className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-center font-semibold text-white transition hover:from-blue-500 hover:to-indigo-500">
            Yêu cầu link mới
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Thành công" subtitle="Mật khẩu của bạn đã được cập nhật.">
        <div className="flex flex-col items-center gap-5 text-center" aria-live="polite">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
            <CheckCircle2 size={34} />
          </div>
          <p className="text-sm text-slate-400">Đổi mật khẩu thành công! Đang chuyển tới trang đăng nhập…</p>
          <Link to="/login" className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-center font-semibold text-white transition hover:from-blue-500 hover:to-indigo-500">
            Đăng nhập ngay
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Đặt lại mật khẩu" subtitle="Tạo mật khẩu mới cho tài khoản của bạn.">
      {apiError && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{apiError}</span>
        </motion.div>
      )}
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-5">
        <Input
          label="Mật khẩu mới"
          name="newPassword"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="h-4 w-4" />}
          value={formik.values.newPassword}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.newPassword}
          touched={formik.touched.newPassword}
          disabled={formik.isSubmitting}
        />
        <Input
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="h-4 w-4" />}
          value={formik.values.confirmPassword}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.confirmPassword}
          touched={formik.touched.confirmPassword}
          disabled={formik.isSubmitting}
        />
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={!formik.isValid || formik.isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 font-semibold text-white shadow-[0_4px_20px_rgba(37,99,235,0.25)] transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {formik.isSubmitting ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><KeyRound className="h-4 w-4" /> Đặt lại mật khẩu</>}
        </motion.button>
        <Link to="/login" className="text-center text-sm font-medium text-blue-400 transition hover:text-blue-300">
          Quay lại đăng nhập
        </Link>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import { motion, type Variants } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, AlertTriangle, MailCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';
import { registerSchema } from '../../validation/authSchema';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input } from '../../components/ui/Input';
import { useCooldown } from '../../hooks/useCooldown';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const cooldown = useCooldown('cooldown:verify', 60);

  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
    validationSchema: registerSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      try {
        await register({
          fullName: values.fullName,
          email: values.email,
          password: values.password,
        });

        sessionStorage.setItem('pendingEmail', values.email);
        setRegisteredEmail(values.email);
        cooldown.start();
      } catch (err: any) {
        setApiError(err.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
        setSubmitting(false);
      }
    },
  });

  const handleResend = async () => {
    if (!registeredEmail || cooldown.active) return;
    setResendMsg(null);
    try {
      const res = await authService.resendVerification(registeredEmail);
      setResendMsg(res.message);
      cooldown.start();
    } catch (err) {
      setResendMsg(err instanceof Error ? err.message : 'Không gửi được email.');
    }
  };

  if (registeredEmail) {
    return (
      <AuthLayout title="Kiểm tra email của bạn" subtitle="Chỉ còn một bước nữa để kích hoạt tài khoản.">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-5 text-center" aria-live="polite">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 shadow-[0_0_24px_rgba(59,130,246,0.3)]">
            <MailCheck size={32} />
          </div>
          <div>
            <p className="text-sm text-slate-300">Đã gửi link xác minh tới <b className="text-white">{registeredEmail}</b>.</p>
            <p className="mt-1 text-sm text-slate-400">Mở email và bấm "Xác minh" để kích hoạt tài khoản (link hiệu lực 24 giờ).</p>
            <p className="mt-2 text-xs text-slate-500">Không thấy mail? Kiểm tra mục Spam hoặc gửi lại.</p>
          </div>
          <button
            onClick={handleResend}
            disabled={cooldown.active}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {cooldown.active ? `Gửi lại sau ${cooldown.remaining}s` : 'Gửi lại email xác minh'}
          </button>
          {resendMsg && <p className="text-xs text-slate-400">{resendMsg}</p>}
          <Link to="/login" className="text-sm font-medium text-blue-400 transition hover:text-blue-300">Quay lại đăng nhập</Link>
        </motion.div>
      </AuthLayout>
    );
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <AuthLayout 
      title="Tạo tài khoản mới" 
      subtitle="Đăng ký tài khoản ParkEase để quản lý bãi xe thông minh."
    >
      {apiError && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="font-medium">{apiError}</span>
        </motion.div>
      )}

      <form onSubmit={formik.handleSubmit}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-4"
        >
          <motion.div variants={itemVariants}>
            <Input
              label="Họ và tên"
              name="fullName"
              placeholder="Nguyễn Văn A"
              icon={<User className="w-4 h-4" />}
              value={formik.values.fullName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.fullName}
              touched={formik.touched.fullName}
              disabled={formik.isSubmitting}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="name@example.com"
              icon={<Mail className="w-4 h-4" />}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.email}
              touched={formik.touched.email}
              disabled={formik.isSubmitting}
            />
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div variants={itemVariants}>
              <Input
                label="Mật khẩu"
                name="password"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.password}
                touched={formik.touched.password}
                disabled={formik.isSubmitting}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Input
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.confirmPassword}
                touched={formik.touched.confirmPassword}
                disabled={formik.isSubmitting}
              />
            </motion.div>
          </div>
          <motion.div variants={itemVariants} className="mt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-slate-400 hover:text-slate-300 select-none text-xs sm:text-sm">
              <input
                type="checkbox"
                name="terms"
                checked={formik.values.terms}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={formik.isSubmitting}
                className="mt-0.5 w-4.5 h-4.5 rounded-lg bg-slate-950 border border-white/10 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer accent-blue-600 flex-shrink-0"
              />
              <span className="leading-snug">
                Tôi đồng ý với{' '}
                <a href="#terms" className="text-blue-400 hover:underline" onClick={(e) => { e.preventDefault(); alert('Điều khoản dịch vụ...'); }}>
                  Điều khoản Dịch vụ
                </a>{' '}
                và{' '}
                <a href="#privacy" className="text-blue-400 hover:underline" onClick={(e) => { e.preventDefault(); alert('Chính sách bảo mật...'); }}>
                  Chính sách Bảo mật
                </a>.
              </span>
            </label>
            {formik.touched.terms && formik.errors.terms && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400 font-medium">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>{formik.errors.terms}</span>
              </div>
            )}
          </motion.div>
          <motion.div variants={itemVariants} className="mt-2">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={!formik.isValid || formik.isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-[0_4px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_25px_rgba(37,99,235,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {formik.isSubmitting ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <span>Tạo Tài Khoản</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.div>
          <motion.div variants={itemVariants} className="text-center mt-3">
            <span className="text-slate-400 text-sm">Đã có tài khoản? </span>
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors">
              Đăng nhập
            </Link>
          </motion.div>
        </motion.div>
      </form>
    </AuthLayout>
  );
};
export default Register;

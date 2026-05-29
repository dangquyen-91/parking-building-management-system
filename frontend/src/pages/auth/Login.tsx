import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import { motion, type Variants } from 'framer-motion';
import { Mail, Lock, LogIn, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema } from '../../validation/authSchema';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input } from '../../components/ui/Input';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const registerSuccess = location.state?.registerSuccess;

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);
      setIsSuccess(false);
      try {
        const profile = await login({
          email: values.email,
          password: values.password,
        });
        
        if (values.rememberMe) {
          localStorage.setItem('rememberedEmail', values.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        setIsSuccess(true);
        setTimeout(() => {
          navigate(profile.role === 'admin' ? '/admin/dashboard' : '/');
        }, 800);
      } catch (err: any) {
        setApiError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
        setSubmitting(false);
      }
    },
  });

  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      formik.setFieldValue('email', savedEmail);
      formik.setFieldValue('rememberMe', true);
    }
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <AuthLayout 
      title="Chào mừng trở lại!" 
      subtitle="Nhập thông tin tài khoản của bạn để truy cập hệ thống ParkEase."
    >
      {registerSuccess && !apiError && !isSuccess && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2.5"
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Đăng ký tài khoản thành công!</p>
            <p className="text-xs text-emerald-400/80 mt-0.5">Vui lòng đăng nhập với tài khoản mới tạo.</p>
          </div>
        </motion.div>
      )}
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
      {isSuccess && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-5 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex flex-col items-center text-center gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h4 className="font-bold text-white text-base">Đăng nhập thành công!</h4>
            <p className="text-xs text-slate-400 mt-1">Đang chuyển hướng về trang chủ...</p>
          </div>
        </motion.div>
      )}

      <form onSubmit={formik.handleSubmit}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-5"
        >
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
              disabled={formik.isSubmitting || isSuccess}
            />
          </motion.div>
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
              disabled={formik.isSubmitting || isSuccess}
            />
          </motion.div>
          <motion.div variants={itemVariants} className="flex items-center justify-between mt-1 text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300 select-none">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formik.values.rememberMe}
                onChange={formik.handleChange}
                disabled={formik.isSubmitting || isSuccess}
                className="w-4.5 h-4.5 rounded-lg bg-slate-950 border border-white/10 text-blue-600 focus:ring-blue-500/20 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer accent-blue-600"
              />
              <span>Ghi nhớ tôi</span>
            </label>
            <Link 
              to="/forgot-password" 
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              onClick={(e) => { e.preventDefault(); alert('Chức năng Quên mật khẩu đang được phát triển!'); }}
            >
              Quên mật khẩu?
            </Link>
          </motion.div>
          <motion.div variants={itemVariants} className="mt-2">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={!formik.isValid || formik.isSubmitting || isSuccess}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-[0_4px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_25px_rgba(37,99,235,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {formik.isSubmitting ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập</span>
                </>
              )}
            </motion.button>
          </motion.div>
          <motion.div variants={itemVariants} className="text-center mt-4">
            <span className="text-slate-400 text-sm">Chưa có tài khoản? </span>
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors">
              Đăng ký ngay
            </Link>
          </motion.div>
        </motion.div>
      </form>
    </AuthLayout>
  );
};

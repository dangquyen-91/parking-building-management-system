import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Loader2, Mail, LogIn } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { Input } from '../../components/ui/Input';
import { useCooldown } from '../../hooks/useCooldown';

type Status = 'verifying' | 'success' | 'error' | 'invalid';

export const VerifyEmail: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'invalid');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(() => sessionStorage.getItem('pendingEmail') ?? '');
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const cooldown = useCooldown('cooldown:verify', 60);
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true; // chặn gọi 2 lần (StrictMode), nhưng vẫn nhận kết quả của lần gọi này
    authService
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err: Error) => {
        if ((err.message || '').includes('đã được xác minh')) {
          setStatus('success');
          setMessage('Email đã được xác minh. Bạn có thể đăng nhập ngay.');
        } else {
          setStatus('error');
          setMessage(err.message || 'Xác minh thất bại.');
        }
      })
      // Xoá token khỏi URL (tránh lọt vào lịch sử trình duyệt)
      .finally(() => window.history.replaceState({}, '', '/verify-email'));
  }, [token]);

  // Tự chuyển sang đăng nhập sau khi xác minh thành công
  useEffect(() => {
    if (status !== 'success') return;
    const id = setTimeout(() => navigate('/login', { state: { verified: true } }), 3000);
    return () => clearTimeout(id);
  }, [status, navigate]);

  const handleResend = async () => {
    if (!email || cooldown.active) return;
    setResendMsg(null);
    try {
      const res = await authService.resendVerification(email);
      setResendMsg(res.message);
      cooldown.start();
    } catch (err) {
      setResendMsg(err instanceof Error ? err.message : 'Không gửi được email.');
    }
  };

  return (
    <AuthLayout title="Xác minh email" subtitle="Kích hoạt tài khoản ParkEase của bạn.">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-5 text-center" aria-live="polite">
        {status === 'verifying' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
            <p className="text-slate-300">Đang xác minh email của bạn…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
              <CheckCircle2 size={34} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Xác minh thành công!</h3>
              <p className="mt-1 text-sm text-slate-400">{message} Đang chuyển tới trang đăng nhập…</p>
            </div>
            <Link to="/login" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-semibold text-white transition hover:from-blue-500 hover:to-indigo-500">
              <LogIn className="h-4 w-4" /> Đăng nhập ngay
            </Link>
          </>
        )}

        {(status === 'error' || status === 'invalid') && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Không xác minh được</h3>
              <p className="mt-1 text-sm text-slate-400">
                {status === 'invalid' ? 'Link không hợp lệ hoặc thiếu mã xác minh.' : message}
              </p>
            </div>

            <div className="w-full space-y-3 text-left">
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="name@example.com"
                icon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                onClick={handleResend}
                disabled={!email || cooldown.active}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-semibold text-white transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {cooldown.active ? `Gửi lại sau ${cooldown.remaining}s` : 'Gửi lại email xác minh'}
              </button>
              {resendMsg && <p className="text-center text-xs text-slate-400">{resendMsg}</p>}
            </div>
          </>
        )}

        <Link to="/login" className="text-sm font-medium text-blue-400 transition hover:text-blue-300">
          Quay lại đăng nhập
        </Link>
      </motion.div>
    </AuthLayout>
  );
};

export default VerifyEmail;

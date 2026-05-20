import React from 'react';
import { motion } from 'framer-motion';
import { Radar, Zap, ShieldCheck, Cpu, Car } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const features = [
    {
      icon: <Radar className="w-5 h-5 text-sky-400" />,
      text: 'Theo dõi slot thời gian thực',
      delay: 0.1,
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      text: 'Đặt chỗ nhanh chóng',
      delay: 0.2,
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      text: 'Bảo mật an toàn',
      delay: 0.3,
    },
    {
      icon: <Cpu className="w-5 h-5 text-indigo-400" />,
      text: 'AI hỗ trợ quản lý bãi xe',
      delay: 0.4,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col md:flex-row overflow-hidden relative font-sans">
      {/* Background Decorative Glow (Full Screen background blur circles) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* LEFT SIDE: Cinematic Feature Showcase (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 relative flex-col justify-between p-12 lg:p-20 overflow-hidden">
        {/* Background Image with Cinematic overlays */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 ease-out scale-105"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1600')`
          }}
        />
        {/* Gradients to blend image nicely */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
        <div className="absolute inset-0 bg-blue-950/20 mix-blend-overlay" />

        {/* Floating Neon Glow Line */}
        <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-transparent via-blue-500/30 to-transparent blur-[1px]" />

        {/* Top Header/Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform duration-300 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <Car size={24} className="stroke-[2.5]" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              ParkEase<span className="text-blue-500">.</span>
            </span>
          </Link>
        </motion.div>

        {/* Middle Main Content */}
        <div className="relative z-10 my-auto max-w-xl">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight"
          >
            Bắt đầu trải nghiệm <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(56,189,248,0.2)]">
              bãi đỗ xe thông minh
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-6 text-slate-300 text-base lg:text-lg leading-relaxed font-light"
          >
            Hệ thống giúp quản lý chỗ đỗ, đặt chỗ trước, gói thành viên và phương tiện một cách hiện đại và tiện lợi.
          </motion.p>

          {/* Floating Glass Cards Grid */}
          <div className="mt-12 grid grid-cols-2 gap-4">
            {features.map((feat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: feat.delay,
                  type: 'spring',
                  stiffness: 100 
                }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="p-4 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/[0.08] hover:border-blue-500/40 hover:bg-white/[0.07] transition-colors shadow-xl flex items-center gap-3.5 group cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all duration-300">
                  {feat.icon}
                </div>
                <span className="text-white text-xs lg:text-sm font-medium leading-snug">
                  {feat.text}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer Credit */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative z-10 text-xs text-slate-400 font-light"
        >
          © 2026 ParkEase. All rights reserved. Premium Smart Parking Platform.
        </motion.div>
      </div>

      {/* RIGHT SIDE: Auth Card Section */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10 min-h-screen">
        {/* Mobile Logo */}
        <div className="md:hidden absolute top-6 left-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Car size={18} className="stroke-[2.5]" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">ParkEase</span>
          </Link>
        </div>

        {/* Glassmorphic Auth Card Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring', damping: 25 }}
          className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden"
        >
          {/* Internal Glow Effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Form Header */}
          <div className="mb-8 text-center sm:text-left relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {title}
            </h2>
            <p className="mt-2 text-slate-400 text-sm font-light">
              {subtitle}
            </p>
          </div>

          {/* Form Content */}
          <div className="relative z-10">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

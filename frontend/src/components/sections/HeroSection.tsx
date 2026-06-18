import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ScanLine, ShieldCheck } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 pt-20">
      <div className="absolute inset-0 z-0">
        {/* animated grid */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(59,130,246,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.4) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 75%)',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 75%)',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(30,58,138,0.35),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent z-10"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-slate-950 to-transparent z-10"></div>
        <motion.div
          animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          className="absolute right-0 top-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] mix-blend-screen"
        ></motion.div>
        <div className="absolute right-10 top-1/3 w-[300px] h-[500px] border border-blue-500/20 rounded-3xl rotate-12 opacity-30 z-0"></div>
        <div className="absolute right-40 top-1/4 w-[200px] h-[400px] border border-cyan-500/10 rounded-3xl rotate-12 opacity-20 z-0"></div>
      </div>

      <div className="container relative z-20 mx-auto px-6 md:px-12 flex flex-col lg:flex-row items-center pt-10">
        <div className="w-full lg:w-1/2 flex flex-col items-start gap-6 lg:pr-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-2"
          >
            <ShieldCheck size={14} />
            Giải pháp quản lý bãi đỗ xe cho tòa nhà
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            className="text-5xl md:text-7xl lg:text-[76px] font-bold text-white leading-[1.08] tracking-tight"
          >
            Bãi Đỗ Xe <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">Thông Minh</span> <br />
            Cho Tòa Nhà Hiện Đại
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-lg md:text-xl text-slate-400 max-w-xl font-light leading-relaxed"
          >
            Đặt chỗ trước, check-in bằng biển số và thanh toán VNPay — quản lý xe ra vào, gói cư dân và sơ đồ tầng cho tòa nhà của bạn trong một hệ thống duy nhất.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto"
          >
            <Link to="/booking" className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-lg transition-all shadow-[0_0_25px_rgba(37,99,235,0.45)] hover:shadow-[0_0_35px_rgba(37,99,235,0.6)] flex items-center justify-center gap-2 group transform hover:-translate-y-0.5">
              Đặt chỗ ngay
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#pricing" className="px-8 py-4 rounded-full glass-panel-dark text-white font-medium text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 border-slate-700">
              Xem gói dịch vụ
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm text-slate-500"
          >
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Đặt chỗ trước 24h</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Check-in bằng biển số</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Thanh toán VNPay</span>
          </motion.div>
        </div>
        <div className="w-full lg:w-1/2 mt-16 lg:mt-0 relative h-[400px] md:h-[600px] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
            className="relative w-full max-w-[800px] h-full flex items-center justify-center"
          >
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-4/5 h-24 bg-blue-500/40 blur-[80px] rounded-[100%] z-0"></div>
            <img
              src="https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1600&auto=format&fit=crop"
              alt="Smart Parking"
              className="relative w-[115%] max-w-none object-cover rounded-2xl mix-blend-screen opacity-95 filter contrast-125 saturate-125 z-10"
              style={{ WebkitMaskImage: 'linear-gradient(to top, transparent 8%, black 45%, black 92%, transparent 100%)' }}
            />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="absolute top-1/4 left-0 glass-panel-dark px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-[0_0_30px_rgba(0,0,0,0.6)] z-20"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-lg">
                P
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Tòa Nhà A · Tầng 2</p>
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Còn chỗ trống
                </p>
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-1/4 right-0 glass-panel-dark px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-[0_0_30px_rgba(0,0,0,0.6)] z-20"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <ScanLine className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Check-in</p>
                <p className="text-xs font-bold text-blue-400">30A-123.45</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>
    </section>
  );
}

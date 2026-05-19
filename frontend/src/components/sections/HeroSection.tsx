import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 pt-20">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        {/* Futuristic city/building simulation backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(30,58,138,0.3),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent z-10"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-slate-950 to-transparent z-10"></div>
        
        {/* Futuristic building blueprint / lines overlay */}
        <div className="absolute right-0 top-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] mix-blend-screen"></div>
        <div className="absolute right-10 top-1/3 w-[300px] h-[500px] border border-blue-500/20 rounded-3xl rotate-12 opacity-30 z-0"></div>
        <div className="absolute right-40 top-1/4 w-[200px] h-[400px] border border-cyan-500/10 rounded-3xl rotate-12 opacity-20 z-0"></div>
      </div>

      <div className="container relative z-20 mx-auto px-6 md:px-12 flex flex-col lg:flex-row items-center pt-10">
        
        {/* Left Content */}
        <div className="w-full lg:w-1/2 flex flex-col items-start gap-6 lg:pr-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-2"
          >
            <Sparkles size={14} className="animate-pulse" />
            Hệ thống quản lý đỗ xe thông minh thế hệ mới
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-[76px] font-bold text-white leading-[1.08] tracking-tight"
          >
            Bãi Đỗ Xe <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">Thông Minh</span> <br />
            Cho Thành Phố Hiện Đại
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-slate-400 max-w-xl font-light leading-relaxed"
          >
            Hệ thống quản lý bãi đỗ xe hiện đại giúp tìm chỗ nhanh chóng, đặt chỗ trước và quản lý phương tiện hiệu quả trong các tòa nhà thông minh.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto"
          >
            <a href="#features" className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-lg transition-all shadow-[0_0_25px_rgba(37,99,235,0.45)] hover:shadow-[0_0_35px_rgba(37,99,235,0.6)] flex items-center justify-center gap-2 group transform hover:-translate-y-0.5">
              Tìm chỗ ngay
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a href="#pricing" className="px-8 py-4 rounded-full glass-panel-dark text-white font-medium text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 border-slate-700">
              Xem gói dịch vụ
            </a>
          </motion.div>
        </div>

        {/* Right Content - Cinematic White Luxury Car */}
        <div className="w-full lg:w-1/2 mt-16 lg:mt-0 relative h-[400px] md:h-[600px] flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
            className="relative w-full max-w-[800px] h-full flex items-center justify-center"
          >
            {/* Blue Ambient Neon Reflection Glow */}
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-4/5 h-24 bg-blue-500/40 blur-[80px] rounded-[100%] z-0"></div>
            
            {/* Luxury White Tesla / Car Image */}
            <img 
              src="https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=1600&auto=format&fit=crop" 
              alt="Luxury White Smart Car" 
              className="relative w-[115%] max-w-none object-cover rounded-2xl mix-blend-screen opacity-95 filter contrast-125 saturate-125 z-10" 
              style={{ WebkitMaskImage: 'linear-gradient(to top, transparent 8%, black 45%, black 92%, transparent 100%)' }}
            />

            {/* Neon Parking Badge Sign Overlay */}
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute top-1/4 left-0 glass-panel-dark px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-[0_0_30px_rgba(0,0,0,0.6)] z-20"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-lg">
                P
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Tòa Nhà A</p>
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  142 Slot Trống
                </p>
              </div>
            </motion.div>

            {/* Floating Spec Badge */}
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-1/4 right-0 glass-panel-dark px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-[0_0_30px_rgba(0,0,0,0.6)] z-20"
            >
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest text-right font-semibold">Hệ thống quét</p>
                <p className="text-xs font-bold text-blue-400">Đã kích hoạt AI</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
        
      </div>
      
      {/* Soft gradient fade overlay on the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>
    </section>
  );
}

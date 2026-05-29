import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="relative py-28 bg-slate-950 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(30,58,138,0.3),transparent_70%)]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container relative z-10 mx-auto px-6 md:px-12 text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-mono mb-2">
            HÃY LÀ MỘT PHẦN CỦA ĐÔ THỊ THÔNG MINH
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
            Trải Nghiệm Hệ Thống <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500">Bãi Đỗ Xe Tương Lai</span>
          </h2>
          
          <p className="text-lg text-slate-400 max-w-2xl font-light leading-relaxed mb-8">
            ParkEase đã sẵn sàng tích hợp vào cơ sở hạ tầng của bạn. Tăng hiệu suất đỗ xe, giảm chi phí vận hành và đem đến sự hài lòng vượt bậc cho khách hàng.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center sm:w-auto">
            <button className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-lg transition-all shadow-[0_0_25px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 group transform hover:-translate-y-0.5">
              Đăng ký ngay
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button className="px-8 py-4 rounded-full glass-panel-dark text-white font-medium text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 border-slate-700">
              <MessageSquare size={18} />
              Liên hệ tư vấn
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

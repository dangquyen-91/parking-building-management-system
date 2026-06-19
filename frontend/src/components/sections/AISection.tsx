import { motion } from 'framer-motion';
import { Cpu, TrendingUp, Compass, Sliders, ShieldCheck } from 'lucide-react';

export default function AISection() {
  const points = [
    {
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      title: "AI phân bổ slot thông minh",
      desc: "Tự động tính toán khoảng cách và thời gian di chuyển để xếp xe vào vị trí trống phù hợp nhất."
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-cyan-400" />,
      title: "Tối ưu tỷ lệ lấp đầy",
      desc: "Phân tích dữ liệu lịch sử để dự đoán số lượng xe, tối ưu không gian đỗ xe vào giờ cao điểm."
    },
    {
      icon: <Compass className="w-5 h-5 text-cyan-400" />,
      title: "Giảm thời gian tìm chỗ",
      desc: "Rút ngắn 80% thời gian tìm kiếm chỗ đỗ xe nhờ chỉ dẫn bản đồ động và vị trí được giữ sẵn."
    },
    {
      icon: <Sliders className="w-5 h-5 text-cyan-400" />,
      title: "Hỗ trợ phân tầng theo loại xe",
      desc: "Tách biệt xe máy, ô tô con, ô tô điện (gần trạm sạc) một cách logic nhờ thuật toán AI phân loại tự động."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-cyan-400" />,
      title: "Tối ưu lưu lượng giờ cao điểm",
      desc: "Hạn chế ùn tắc lối ra vào nhờ việc phân bổ đỗ xe dàn trải và mở rào chắn tự động ANPR thông minh."
    }
  ];

  return (
    <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:30px_30px] z-0"></div>
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 blur-[130px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-10 w-[300px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none z-0"></div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="w-full lg:w-1/2 relative flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative w-full max-w-[500px] aspect-square rounded-3xl border border-white/10 bg-slate-900/60 p-8 glass-panel-dark"
            >
              <div className="absolute inset-4 rounded-full border border-cyan-500/10 flex items-center justify-center">
                <div className="absolute w-3/4 h-3/4 rounded-full border border-cyan-500/20 flex items-center justify-center animate-ping opacity-40"></div>
                <div className="absolute w-1/2 h-1/2 rounded-full border border-blue-500/30"></div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-3xl bg-slate-950 border border-cyan-500/50 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.3)] z-10">
                <Cpu className="w-10 h-10 text-cyan-400 animate-pulse" />
                <span className="text-[10px] text-cyan-400 font-mono tracking-widest mt-2">AI CORE</span>
              </div>
              <div className="absolute top-12 left-12 glass-panel-dark px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                SLOT ACCESSIBILITY
              </div>
              <div className="absolute bottom-16 right-8 glass-panel-dark px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                TRAFFIC FLUIDITY: 98%
              </div>
              <div className="absolute top-1/3 right-12 glass-panel-dark px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                PEAK LOAD CONTROL
              </div>
            </motion.div>
          </div>
          <div className="w-full lg:w-1/2 flex flex-col items-start gap-8">
            <div>
              <h2 className="text-cyan-400 font-semibold tracking-wider uppercase text-sm mb-3">Tự Động Hóa Trí Tuệ Nhân Tạo</h2>
              <h3 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Tối Ưu Hóa Vận Hành Nhờ AI</h3>
              <p className="text-slate-400 leading-relaxed font-light">
                ParkEase tích hợp AI Engine tiên tiến để quản lý các kịch bản đỗ xe phức tạp, dự báo hành vi lái xe và đưa ra đề xuất vị trí thông minh theo thời gian thực.
              </p>
            </div>

            <div className="space-y-6 w-full">
              {points.map((point, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    {point.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{point.title}</h4>
                    <p className="text-slate-400 text-sm font-light leading-relaxed">{point.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

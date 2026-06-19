import { motion } from 'framer-motion';
import { CalendarCheck, ScanLine, CreditCard } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      icon: <CalendarCheck className="w-8 h-8 text-blue-500" />,
      title: "1. Đặt chỗ hoặc mua gói",
      desc: "Đặt chỗ trước trực tuyến cho lượt gửi xe, hoặc mua gói cư dân theo tháng/quý và thanh toán qua VNPay."
    },
    {
      icon: <ScanLine className="w-8 h-8 text-blue-500" />,
      title: "2. Check-in bằng biển số",
      desc: "Nhân viên nhập biển số tại quầy, hệ thống tra cứu gói cư dân hoặc lượt đặt chỗ và xếp chỗ đỗ ngay."
    },
    {
      icon: <CreditCard className="w-8 h-8 text-blue-500" />,
      title: "3. Check-out & thanh toán",
      desc: "Khi xe ra, hệ thống tính phí theo thời gian gửi và thu qua VNPay hoặc tiền mặt tại quầy."
    }
  ];

  return (
    <section className="py-24 bg-white relative z-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-blue-600 font-semibold tracking-wider uppercase text-sm mb-3">Quy Trình Hoạt Động</h2>
          <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Vận Hành Tối Giản Trong 3 Bước</h3>
          <p className="text-lg text-slate-600 leading-relaxed font-light">
            Chúng tôi loại bỏ hoàn toàn các bước thủ công rườm rà để mang lại trải nghiệm đỗ xe mượt mà và trực quan nhất.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto relative">
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-blue-100 via-blue-400 to-blue-100 opacity-60 z-0"></div>

          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className="w-24 h-24 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-blue-500 mb-8 shadow-sm group-hover:scale-105 group-hover:border-blue-300 group-hover:shadow-[0_0_25px_rgba(37,99,235,0.15)] transition-all duration-300">
                {step.icon}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">{step.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm font-light max-w-xs">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

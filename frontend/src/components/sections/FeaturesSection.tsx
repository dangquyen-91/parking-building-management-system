import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, CalendarCheck, Layers, ScanLine, CreditCard, Users } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Theo dõi chỗ còn trống",
      desc: "Sơ đồ tầng cập nhật tình trạng chỗ trống theo thời gian thực cho từng tầng, từng hàng xe."
    },
    {
      icon: <CalendarCheck className="w-6 h-6" />,
      title: "Đặt chỗ trước",
      desc: "Giữ chỗ trước tối đa 24 giờ và thanh toán online, tránh hết chỗ vào giờ cao điểm."
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Phân tầng cư dân & khách",
      desc: "Phân tầng cho cư dân (ô cố định) và khách vãng lai, phân hàng riêng cho xe máy và ô tô."
    },
    {
      icon: <ScanLine className="w-6 h-6" />,
      title: "Check-in bằng biển số",
      desc: "Nhân viên nhập biển số tại quầy, hệ thống tự tra cứu gói cư dân hoặc lượt đặt chỗ và xếp chỗ ngay."
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Thanh toán VNPay & tiền mặt",
      desc: "Thanh toán gói và phí gửi xe qua VNPay (thẻ, ngân hàng, QR) hoặc tiền mặt tại quầy."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Phân quyền theo vai trò",
      desc: "Phân quyền cho Quản trị, Quản lý, Nhân viên và Người dùng với chức năng phù hợp từng vai trò."
    }
  ];

  return (
    <section id="features" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-100/40 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-blue-600 font-semibold tracking-wider uppercase text-sm mb-3">Tính Năng Hệ Thống</h2>
          <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Trải Nghiệm Công Nghệ Vượt Trội</h3>
          <p className="text-lg text-slate-600 leading-relaxed font-light">
            Không chỉ là quản lý chỗ đỗ, chúng tôi đem đến giải pháp số hóa toàn diện giúp đơn giản hóa và nâng tầm trải nghiệm của bạn.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="glass-panel rounded-3xl p-8 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.12)] hover:border-blue-200 hover:bg-white transition-all duration-300 flex flex-col items-start border border-slate-200/60"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">{feature.title}</h4>
              <p className="text-slate-600 leading-relaxed text-sm font-light">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-16">
          <Link to="/features" className="px-8 py-3.5 rounded-full border border-slate-200 bg-white text-slate-700 font-medium hover:border-blue-500 hover:text-blue-600 transition-colors whitespace-nowrap shadow-sm">
            Khám phá tính năng
          </Link>
        </div>
      </div>
    </section>
  );
}

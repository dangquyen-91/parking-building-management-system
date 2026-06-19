import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Building2, LayoutGrid, CalendarClock, Wallet } from 'lucide-react';

export default function AboutSection() {
  const cards = [
    {
      icon: <Building2 className="w-7 h-7 text-blue-600" />,
      title: "Quản lý bãi đỗ tòa nhà",
      desc: "Theo dõi và kiểm soát toàn bộ lượt xe ra vào, gói cư dân và phí gửi xe trong một hệ thống tập trung."
    },
    {
      icon: <LayoutGrid className="w-7 h-7 text-blue-600" />,
      title: "Tự động xếp chỗ theo tầng",
      desc: "Hệ thống tự gán hàng/ô còn trống theo loại xe và phân tầng cư dân hoặc khách vãng lai khi check-in."
    },
    {
      icon: <CalendarClock className="w-7 h-7 text-blue-600" />,
      title: "Đặt chỗ trước trực tuyến",
      desc: "Cho phép giữ chỗ trước tối đa 24 giờ và thanh toán online, chủ động hơn vào giờ cao điểm."
    },
    {
      icon: <Wallet className="w-7 h-7 text-blue-600" />,
      title: "Thanh toán & gói linh hoạt",
      desc: "Gói cư dân theo tháng/quý qua VNPay, phí khách vãng lai tính theo giờ, thanh toán online hoặc tiền mặt."
    }
  ];

  return (
    <section id="about" className="py-24 bg-white relative z-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h2 className="text-blue-600 font-semibold tracking-wider uppercase text-sm mb-3">Về Dự Án</h2>
          <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Kiến Tạo Giải Pháp <br /> Đỗ Xe Tương Lai</h3>
          <p className="text-lg text-slate-600 leading-relaxed font-light">
            ParkEase mang đến bước nhảy vọt về công nghệ quản lý đỗ xe cho các tòa nhà và khu đô thị hiện đại. Chúng tôi số hóa toàn bộ trải nghiệm từ đặt chỗ đến thanh toán.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {cards.map((card, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group flex flex-col items-start"
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {card.icon}
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">{card.title}</h4>
              <p className="text-slate-600 leading-relaxed text-sm font-light">{card.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-16">
          <Link to="/about" className="px-8 py-3.5 rounded-full border border-slate-200 bg-white text-slate-700 font-medium hover:border-blue-500 hover:text-blue-600 transition-colors whitespace-nowrap shadow-sm">
            Tìm hiểu thêm
          </Link>
        </div>
      </div>
    </section>
  );
}

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Cpu, Zap, Server, ShieldAlert } from 'lucide-react';

export default function AboutSection() {
  const cards = [
    {
      icon: <Cpu className="w-7 h-7 text-blue-600" />,
      title: "Hệ thống Quản lý Tòa nhà Gửi xe",
      desc: "Điều phối thông minh dòng xe ra vào, tự động kiểm soát lưu lượng xe giúp giảm tắc nghẽn tối đa tại các cổng tòa nhà."
    },
    {
      icon: <Zap className="w-7 h-7 text-blue-600" />,
      title: "Phân bổ Slot bằng AI",
      desc: "Thuật toán tối ưu hóa vị trí đỗ xe tự động dựa trên loại xe, thời gian lưu trú dự kiến và tần suất của từng chủ xe."
    },
    {
      icon: <Server className="w-7 h-7 text-blue-600" />,
      title: "Đặt chỗ Trước Trực tuyến",
      desc: "Cho phép lái xe tìm kiếm và giữ chỗ trước khi tới, tạo thói quen đỗ xe văn minh, hiện đại và tiết kiệm thời gian."
    },
    {
      icon: <ShieldAlert className="w-7 h-7 text-blue-600" />,
      title: "Tối ưu hóa Đô thị Thông minh",
      desc: "Giảm thiểu khí thải do xe chạy vòng quanh tìm chỗ và xây dựng hạ tầng số hóa đồng bộ cho các tòa nhà thông minh."
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

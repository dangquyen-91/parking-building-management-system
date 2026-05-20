import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

interface PackageSectionProps {
  isPreview?: boolean;
}

export default function PackageSection({ isPreview = false }: PackageSectionProps) {
  const plans = [
    {
      name: "Basic",
      price: "Miễn Phí",
      desc: "Dành cho người đỗ xe không thường xuyên.",
      features: [
        "Xem tình trạng slot trống",
        "Thanh toán một chạm tại cổng",
        "Lưu trữ lịch sử đỗ xe 7 ngày"
      ],
      isPopular: false,
    },
    {
      name: "Premium",
      price: "199.000đ",
      period: "/tháng",
      desc: "Phù hợp nhất cho cư dân và người đi làm hàng ngày.",
      features: [
        "Tất cả quyền lợi của gói Basic",
        "Đặt giữ chỗ trước đến 24 giờ",
        "Khu vực ưu tiên VIP",
        "Xem camera giám sát xe thời gian thực",
        "Hỗ trợ khẩn cấp 24/7"
      ],
      isPopular: true,
    },
    {
      name: "Enterprise",
      price: "Liên Hệ",
      desc: "Giải pháp tùy biến toàn diện cho doanh nghiệp và ban quản lý.",
      features: [
        "Quản lý đội xe của doanh nghiệp",
        "Đồng bộ hóa API nội bộ",
        "Hóa đơn điện tử VAT tự động",
        "Tùy biến luồng đỗ xe theo yêu cầu"
      ],
      isPopular: false,
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-slate-50 relative z-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-blue-600 font-semibold tracking-wider uppercase text-sm mb-3">Gói Thành Viên</h2>
          <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Chi Phí Tối Ưu, Quyền Lợi Vượt Trội</h3>
          <p className="text-lg text-slate-600 leading-relaxed font-light">
            Lựa chọn gói thành viên phù hợp nhất với nhu cầu đỗ xe cá nhân hoặc quy mô quản lý của doanh nghiệp bạn.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`relative rounded-3xl p-8 bg-white border flex flex-col justify-between ${
                plan.isPopular 
                  ? 'border-blue-500 shadow-[0_20px_40px_-15px_rgba(37,99,235,0.22)] md:-translate-y-4 z-10' 
                  : 'border-slate-200/80 shadow-sm z-0'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-full whitespace-nowrap">
                  Gợi ý khuyên dùng
                </div>
              )}
              
              <div>
                <div className="mb-8 mt-2">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">{plan.name}</h3>
                  <p className="text-slate-500 text-xs font-light mb-6 min-h-[40px] leading-relaxed">{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{plan.price}</span>
                    {plan.period && <span className="text-slate-500 text-sm font-light">{plan.period}</span>}
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-3">
                      <div className="mt-1 bg-blue-100 text-blue-600 rounded-full p-0.5 shrink-0">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                      <span className="text-slate-600 text-sm font-light leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className={`w-full py-3 rounded-2xl font-medium transition-all ${
                plan.isPopular 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20' 
                  : 'bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100'
              }`}>
                Bắt đầu gói {plan.name}
              </button>
            </motion.div>
          ))}
        </div>

        {isPreview && (
          <div className="flex justify-center mt-16">
            <Link to="/membership" className="px-8 py-3.5 rounded-full border border-slate-200 bg-white text-slate-700 font-medium hover:border-blue-500 hover:text-blue-600 transition-colors whitespace-nowrap shadow-sm">
              Xem tất cả gói dịch vụ
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

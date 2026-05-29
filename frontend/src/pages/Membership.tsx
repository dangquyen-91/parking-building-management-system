import { Check, HelpCircle, ArrowRight } from 'lucide-react';
import PackageSection from '../components/sections/PackageSection';

export default function Membership() {
  const comparisonTable = [
    { feature: "Tìm kiếm & Kiểm tra vị trí trống", basic: true, premium: true, enterprise: true },
    { feature: "Thanh toán tự động qua App/Ví", basic: true, premium: true, enterprise: true },
    { feature: "Lịch sử đỗ xe", basic: "7 ngày", premium: "Vô thời hạn", enterprise: "Tùy chỉnh" },
    { feature: "Đặt chỗ trước tối đa", basic: "Không hỗ trợ", premium: "24 giờ trước", enterprise: "Không giới hạn" },
    { feature: "Khu vực gửi xe ưu tiên / VIP", basic: false, premium: true, enterprise: true },
    { feature: "Xem camera trực tiếp vị trí xe", basic: false, premium: true, enterprise: true },
    { feature: "Tích hợp API và Quản lý đội xe", basic: false, basicNote: "", premium: false, enterprise: true },
    { feature: "Hóa đơn đỏ VAT tự động", basic: false, premium: false, enterprise: true },
    { feature: "Hỗ trợ kỹ thuật", basic: "Email", premium: "24/7 Hotline", enterprise: "Kỹ sư riêng" },
  ];

  const faqs = [
    {
      q: "Gói Premium thanh toán định kỳ như thế nào?",
      a: "Bạn có thể lựa chọn thanh toán tự động theo tháng, quý hoặc năm thông qua thẻ tín dụng hoặc các ví điện tử được liên kết trực tiếp trên ứng dụng."
    },
    {
      q: "Tôi có thể thay đổi hoặc hủy gói dịch vụ không?",
      a: "Có, bạn hoàn toàn có thể nâng cấp, hạ cấp hoặc hủy bỏ gói dịch vụ bất kỳ lúc nào trực tiếp trên giao diện cài đặt tài khoản của ứng dụng mà không chịu thêm phí phát sinh."
    },
    {
      q: "Gói Enterprise phù hợp với những đối tượng nào?",
      a: "Gói Enterprise được thiết kế cho các ban quản lý tòa nhà chung cư, trung tâm thương mại lớn, văn phòng doanh nghiệp hoặc các đội xe công nghệ cần phân bổ vị trí đỗ đặc thù."
    },
    {
      q: "Hệ thống bảo vệ dữ liệu biển số xe của tôi như thế nào?",
      a: "Chúng tôi cam kết bảo mật tuyệt đối dữ liệu biển số xe và hành trình của bạn bằng công nghệ mã hóa đầu cuối và tuân thủ các chính sách bảo mật thông tin khách hàng nghiêm ngặt nhất."
    }
  ];

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[130px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 md:px-12">
        <PackageSection isPreview={false} />
        <div className="mt-28 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Bảng So Sánh Quyền Lợi Chi Tiết</h2>
            <p className="text-slate-600 font-light">So sánh trực quan các tính năng chính của từng gói dịch vụ.</p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-slate-200/80 shadow-sm bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="p-6 text-sm font-bold text-slate-900 w-1/2">Tính năng</th>
                  <th className="p-6 text-sm font-bold text-slate-900 text-center">Basic</th>
                  <th className="p-6 text-sm font-bold text-slate-900 text-center text-blue-600">Premium</th>
                  <th className="p-6 text-sm font-bold text-slate-900 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparisonTable.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                    <td className="p-6 text-slate-700 text-sm font-light">{row.feature}</td>
                    <td className="p-6 text-center text-slate-600 text-sm font-light">
                      {typeof row.basic === "boolean" ? (
                        row.basic ? <Check size={18} className="text-blue-500 mx-auto" /> : <span className="text-slate-300">—</span>
                      ) : (
                        row.basic
                      )}
                    </td>
                    <td className="p-6 text-center text-slate-900 text-sm font-medium bg-blue-50/20">
                      {typeof row.premium === "boolean" ? (
                        row.premium ? <Check size={18} className="text-blue-600 mx-auto" /> : <span className="text-slate-300">—</span>
                      ) : (
                        row.premium
                      )}
                    </td>
                    <td className="p-6 text-center text-slate-600 text-sm font-light">
                      {typeof row.enterprise === "boolean" ? (
                        row.enterprise ? <Check size={18} className="text-blue-500 mx-auto" /> : <span className="text-slate-300">—</span>
                      ) : (
                        row.enterprise
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-28 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Các Câu Hỏi Thường Gặp</h2>
            <p className="text-slate-600 font-light">Giải đáp những thắc mắc phổ biến về dịch vụ của chúng tôi.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">{faq.q}</h4>
                  <p className="text-slate-600 text-sm font-light leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-28 bg-slate-950 text-white rounded-[40px] p-8 md:p-16 border border-white/10 relative overflow-hidden text-center max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none" />
          <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Sẵn sàng trải nghiệm dịch vụ Premium?</h3>
          <p className="text-slate-400 font-light mb-8 max-w-xl mx-auto text-sm leading-relaxed">
            Nâng cấp tài khoản của bạn để trải nghiệm tính năng đặt chỗ VIP và giám sát xe trực tuyến ngay hôm nay.
          </p>
          <button className="px-8 py-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 mx-auto group">
            Bắt đầu trải nghiệm ngay
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>
    </div>
  );
}

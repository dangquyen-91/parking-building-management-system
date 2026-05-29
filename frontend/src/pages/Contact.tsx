import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, HelpCircle } from 'lucide-react';

export default function Contact() {
  const faqs = [
    {
      q: "Thời gian triển khai tích hợp ParkEase mất bao lâu?",
      a: "Tùy thuộc vào quy mô bãi đỗ xe và các thiết bị phần cứng hiện có. Trung bình thời gian thiết lập hệ thống máy chủ cloud và cài đặt AI nhận diện mất khoảng 5 - 7 ngày làm việc."
    },
    {
      q: "Hệ thống có tương thích với các loại barrier hiện có không?",
      a: "Có, bộ điều khiển IoT của chúng tôi được thiết kế mở để tương thích và ra lệnh kích hoạt mở đóng cho hầu hết các dòng cổng barie thông dụng trên thị trường thông qua rơ le tín hiệu."
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Cảm ơn bạn! Thông tin liên hệ đã được tiếp nhận. Chúng tôi sẽ phản hồi trong vòng 24 giờ.");
  };

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-5 flex flex-col gap-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">Kết Nối Với Chúng Tôi</h1>
                <p className="text-slate-600 font-light leading-relaxed">
                  Hãy gửi yêu cầu của bạn, đội ngũ kỹ sư và tư vấn giải pháp của chúng tôi sẽ liên hệ lại ngay để khảo sát hạ tầng tòa nhà.
                </p>
              </div>

              <div className="space-y-6 mt-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Email liên hệ</p>
                    <p className="text-slate-800 text-sm font-medium">support@parkease.io</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Số điện thoại</p>
                    <p className="text-slate-800 text-sm font-medium">1900 8888 (Hotline 24/7)</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-slate-100">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Trụ sở chính</p>
                    <p className="text-slate-800 text-sm font-medium">Khu Công Nghệ Cao, Quận 9, TP. Hồ Chí Minh</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-150 pt-8 mt-4">
                <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <HelpCircle size={18} className="text-blue-500" />
                  Hỏi đáp nhanh
                </h4>
                <div className="space-y-6">
                  {faqs.map((faq, idx) => (
                    <div key={idx}>
                      <h5 className="text-slate-900 text-sm font-semibold mb-1">{faq.q}</h5>
                      <p className="text-slate-600 text-xs font-light leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-7">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 md:p-10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-8">Gửi Yêu Cầu Tư Vấn</h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Họ và tên</label>
                      <input 
                        type="text" 
                        id="name" 
                        required 
                        className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-500">Số điện thoại</label>
                      <input 
                        type="tel" 
                        id="phone" 
                        required
                        className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="0901234567"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Địa chỉ Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      required
                      className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="nguyenvana@gmail.com"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="company" className="text-xs font-bold uppercase tracking-wider text-slate-500">Tên Tòa nhà / Doanh nghiệp</label>
                    <input 
                      type="text" 
                      id="company" 
                      className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Tòa nhà Landmark 81"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-slate-500">Nội dung yêu cầu</label>
                    <textarea 
                      id="message" 
                      rows={4}
                      required
                      className="bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                      placeholder="Tôi cần khảo sát giải pháp đỗ xe thông minh cho tòa nhà 3 tầng hầm..."
                    />
                  </div>

                  <button type="submit" className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 group">
                    Gửi yêu cầu liên hệ
                    <Send size={16} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                  </button>
                </form>
              </motion.div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

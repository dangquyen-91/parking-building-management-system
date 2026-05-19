import { motion } from 'framer-motion';
import { UserCheck, Shield, Car, Key, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Features() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className="pt-32 pb-24 bg-white min-h-screen">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-24">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-500 text-xs font-semibold mb-4"
          >
            <Sparkles size={12} />
            Hệ sinh thái tính năng chi tiết
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6"
          >
            Giải Pháp Đỗ Xe <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600">Được Số Hóa Toàn Diện</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-600 font-light leading-relaxed"
          >
            Khám phá chiều sâu công nghệ và hệ thống tính năng chuyên biệt dành riêng cho từng phân vai sử dụng tại bãi đỗ xe thông minh ParkEase.
          </motion.p>
        </div>

        {/* Detailed Sections List */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-24 max-w-6xl mx-auto"
        >
          {/* 1. Parking Manager */}
          <motion.div variants={itemVariants} className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold mb-4 border border-blue-100">
                <UserCheck size={14} />
                Quản lý vận hành
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">1. Parking Manager (Quản lý bãi đỗ)</h2>
              <p className="text-slate-600 font-light leading-relaxed mb-8">
                Giao diện điều khiển trung tâm tối ưu hóa cho ban quản lý tòa nhà, đem đến bức tranh toàn cảnh và quản trị các khu vực gửi xe hiệu quả.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "Quản lý vị trí & sơ đồ slot đỗ",
                  "Cập nhật và theo dõi trạng thái thực",
                  "Phân tầng thông minh theo loại xe",
                  "Tùy biến cấu hình bảng giá vé",
                  "Báo cáo thống kê doanh thu chi tiết",
                  "Theo dõi tỷ lệ lấp đầy thời gian thực"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-blue-500 shrink-0" />
                    <span className="text-slate-700 text-sm font-light">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2 bg-slate-50 border border-slate-100 rounded-3xl p-8 aspect-video flex items-center justify-center relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08),transparent_70%)]" />
              <div className="text-center relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-4 text-blue-500">
                  <UserCheck size={32} />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">Giao Diện Manager</h4>
                <p className="text-slate-500 text-xs font-light">Bản đồ số trực quan hóa và kiểm soát toàn bộ tòa nhà</p>
              </div>
            </div>
          </motion.div>

          {/* 2. Parking Staff */}
          <motion.div variants={itemVariants} className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 aspect-video flex items-center justify-center relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.08),transparent_70%)]" />
              <div className="text-center relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-4 text-cyan-500">
                  <Shield size={32} />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">Cổng Kiểm Soát Staff</h4>
                <p className="text-slate-500 text-xs font-light">Nhận dạng ANPR tự động và hỗ trợ lối vào</p>
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-50 text-cyan-600 text-xs font-semibold mb-4 border border-cyan-100">
                <Shield size={14} />
                Kiểm soát lối vào
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">2. Parking Staff (Nhân viên kiểm soát)</h2>
              <p className="text-slate-600 font-light leading-relaxed mb-8">
                Giao diện tác vụ tối giản, siêu tốc độ cho phép nhân viên tại chốt kiểm soát hỗ trợ khách vào/ra nhanh chóng.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "Hỗ trợ check-in & check-out thủ công",
                  "Quét biển số qua camera cầm tay",
                  "Khởi tạo phiên đỗ xe tức thì",
                  "Tra cứu thông tin phí đỗ phát sinh",
                  "Xử lý ngoại lệ lối ra lối vào bãi",
                  "Cảnh báo xe quá hạn đỗ quy định"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-cyan-500 shrink-0" />
                    <span className="text-slate-700 text-sm font-light">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 3. Parking User */}
          <motion.div variants={itemVariants} className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold mb-4 border border-indigo-100">
                <Car size={14} />
                Trải nghiệm khách hàng
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">3. Parking User / Driver (Người lái xe)</h2>
              <p className="text-slate-600 font-light leading-relaxed mb-8">
                Ứng dụng di động giúp tài xế giải tỏa hoàn toàn áp lực đỗ xe, cung cấp trải nghiệm không chạm hiện đại bậc nhất.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "Xem bản đồ slot trống thời gian thực",
                  "Đặt chỗ đỗ trước từ nhà hoặc văn phòng",
                  "Theo dõi thông số thời gian gửi xe",
                  "Tự động thanh toán qua thẻ/ví điện tử",
                  "Gửi phản hồi chất lượng bãi đỗ",
                  "Chỉ đường 3D dẫn lối đến slot trống"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-indigo-500 shrink-0" />
                    <span className="text-slate-700 text-sm font-light">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2 bg-slate-50 border border-slate-100 rounded-3xl p-8 aspect-video flex items-center justify-center relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08),transparent_70%)]" />
              <div className="text-center relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-4 text-indigo-500">
                  <Car size={32} />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">Ứng Dụng Di Động Lái Xe</h4>
                <p className="text-slate-500 text-xs font-light">Tất cả tương tác gói gọn trong một màn hình di động</p>
              </div>
            </div>
          </motion.div>

          {/* 4. System Administrator */}
          <motion.div variants={itemVariants} className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 aspect-video flex items-center justify-center relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.08),transparent_70%)]" />
              <div className="text-center relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-4 text-purple-500">
                  <Key size={32} />
                </div>
                <h4 className="font-bold text-slate-900 mb-1">Trình Quản Trị Hệ Thống</h4>
                <p className="text-slate-500 text-xs font-light">Cấu hình tham số và giám sát kiến trúc phần cứng IoT</p>
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-50 text-purple-600 text-xs font-semibold mb-4 border border-purple-100">
                <Key size={14} />
                Quản trị hệ thống
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">4. System Administrator (Quản trị viên)</h2>
              <p className="text-slate-600 font-light leading-relaxed mb-8">
                Trung tâm thiết lập hệ thống chuyên sâu, cấu hình kết nối thiết bị phần cứng IoT và quản trị bảo mật thông tin.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "Quản lý & phân quyền tài khoản chi tiết",
                  "Cấu hình kết nối camera, barrier",
                  "Sao lưu & phục hồi dữ liệu tự động",
                  "Giám sát logs hoạt động phần cứng",
                  "Cập nhật cấu trúc chương trình từ xa",
                  "Tích hợp các cổng thanh toán bên thứ 3"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-purple-500 shrink-0" />
                    <span className="text-slate-700 text-sm font-light">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 5. AI Smart Parking */}
          <motion.div variants={itemVariants} className="grid lg:grid-cols-2 gap-12 items-center bg-slate-950 text-white rounded-[40px] p-8 md:p-16 border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),transparent_70%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-semibold mb-4 border border-cyan-500/20">
                <Cpu size={14} />
                Core AI Engine
              </div>
              <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">5. AI Smart Parking System</h2>
              <p className="text-slate-400 font-light leading-relaxed mb-8">
                Trái tim công nghệ của ParkEase, tự động hóa các tác vụ phức tạp bằng thuật toán học máy giúp bãi đỗ tự tối ưu theo thời gian.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "AI định tuyến vị trí đỗ xe tối ưu",
                  "Tự động dự đoán tải lấp đầy",
                  "Hạn chế 90% điểm thắt cổ chai",
                  "Nhận diện phương tiện thông minh",
                  "Kiểm soát luồng vào giờ cao điểm",
                  "Cân bằng phân bố dòng xe theo tầng"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                    <span className="text-slate-300 text-sm font-light">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square max-w-[320px] mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-3xl" />
              <Cpu className="w-24 h-24 text-cyan-400 animate-pulse relative z-10" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
